const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } catch (err) {
        console.error(
          "Failed to load existing database, creating fresh one:",
          err,
        );
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
    this.seedDefaultTags();
    this.save();
    return this;
  }

  save() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error("Error saving SQLite database to disk:", err);
    }
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT UNIQUE NOT NULL,
        size INTEGER NOT NULL,
        extension TEXT NOT NULL,
        category TEXT NOT NULL,
        is_favorite INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS file_tags (
        file_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (file_id, tag_id),
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
      CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(is_favorite);
    `);
  }

  seedDefaultTags() {
    const res = this.db.exec("SELECT COUNT(*) as count FROM tags");
    const count =
      res.length > 0 && res[0].values.length > 0 ? res[0].values[0][0] : 0;
    if (count === 0) {
      const defaults = [
        { name: "Urgent", color: "#EF4444" },
        { name: "Work", color: "#6366F1" },
        { name: "Design", color: "#EC4899" },
        { name: "Code", color: "#10B981" },
        { name: "Reading", color: "#F59E0B" },
      ];
      const stmt = this.db.prepare(
        "INSERT INTO tags (name, color) VALUES (?, ?)",
      );
      for (const tag of defaults) {
        stmt.run([tag.name, tag.color]);
      }
      stmt.free();
    }
  }

  categorizeExtension(ext) {
    const e = ext.toLowerCase().replace(".", "");
    const images = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
    const docs = [
      "pdf",
      "doc",
      "docx",
      "txt",
      "md",
      "rtf",
      "odt",
      "csv",
      "xlsx",
      "pptx",
    ];
    const code = [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "rs",
      "go",
      "html",
      "css",
      "json",
      "yml",
      "yaml",
      "sh",
      "sql",
    ];
    const video = ["mp4", "mov", "avi", "mkv", "webm", "wmv"];
    const audio = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
    const archives = ["zip", "tar", "gz", "rar", "7z", "bz2"];

    if (e === "folder" || e === "directory") return "folder";
    if (images.includes(e)) return "image";
    if (docs.includes(e)) return "document";
    if (code.includes(e)) return "code";
    if (video.includes(e)) return "video";
    if (audio.includes(e)) return "audio";
    if (archives.includes(e)) return "archive";
    return "other";
  }

  addFiles(filePaths) {
    const added = [];
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO files (name, path, size, extension, category, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // Helper: recursively scan directory for nested files
    const scanDirectory = (dirPath, maxDepth = 8, currentDepth = 0) => {
      let files = [];
      let totalSize = 0;
      if (currentDepth > maxDepth) return { files, totalSize };
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".git") continue;
          const fullPath = path.join(dirPath, entry.name);
          try {
            if (entry.isDirectory()) {
              const sub = scanDirectory(fullPath, maxDepth, currentDepth + 1);
              totalSize += sub.totalSize;
              files = files.concat(sub.files);
            } else if (entry.isFile()) {
              const s = fs.statSync(fullPath);
              totalSize += s.size;
              files.push({ name: entry.name, path: fullPath, size: s.size });
            }
          } catch (e) {}
        }
      } catch (e) {}
      return { files, totalSize };
    };

    for (const filePath of filePaths) {
      try {
        if (!fs.existsSync(filePath)) continue;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          const folderName = path.basename(filePath);
          const { files: dirFiles, totalSize } = scanDirectory(filePath);

          // 1. Add the folder itself as a taggable, first-class Folio item
          stmt.run([folderName, filePath, totalSize || stats.size, 'folder', 'folder']);
          added.push({
            name: folderName,
            path: filePath,
            size: totalSize || stats.size,
            extension: 'folder',
            category: 'folder',
          });

          // 2. Add all nested files inside the folder
          for (const item of dirFiles) {
            const ext = path.extname(item.name).slice(1).toLowerCase();
            const category = this.categorizeExtension(ext);
            stmt.run([item.name, item.path, item.size, ext, category]);
            added.push({
              name: item.name,
              path: item.path,
              size: item.size,
              extension: ext,
              category,
            });
          }
        } else {
          const name = path.basename(filePath);
          const ext = path.extname(name).slice(1).toLowerCase();
          const category = this.categorizeExtension(ext);
          stmt.run([name, filePath, stats.size, ext, category]);
          added.push({
            name,
            path: filePath,
            size: stats.size,
            extension: ext,
            category,
          });
        }
      } catch (err) {
        console.error("Failed to process file:", filePath, err);
      }
    }
    stmt.free();
    this.save();
    return added;
  }

  getFiles({
    tagId = null,
    category = "all",
    search = "",
    favoriteOnly = false,
    sortBy = "date_desc",
  } = {}) {
    let sql = `
      SELECT 
        f.id, f.name, f.path, f.size, f.extension, f.category, f.is_favorite, f.notes, f.created_at, f.updated_at,
        GROUP_CONCAT(t.id || '::' || t.name || '::' || t.color, '||') as tag_info
      FROM files f
      LEFT JOIN file_tags ft ON f.id = ft.file_id
      LEFT JOIN tags t ON ft.tag_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== "all") {
      sql += ` AND f.category = ?`;
      params.push(category);
    }

    if (favoriteOnly) {
      sql += ` AND f.is_favorite = 1`;
    }

    if (tagId) {
      sql += ` AND f.id IN (SELECT file_id FROM file_tags WHERE tag_id = ?)`;
      params.push(tagId);
    }

    if (search && search.trim() !== "") {
      sql += ` AND (f.name LIKE ? OR f.notes LIKE ? OR f.extension LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` GROUP BY f.id`;

    // Sorting
    switch (sortBy) {
      case "name_asc":
        sql += ` ORDER BY f.name ASC`;
        break;
      case "name_desc":
        sql += ` ORDER BY f.name DESC`;
        break;
      case "size_desc":
        sql += ` ORDER BY f.size DESC`;
        break;
      case "size_asc":
        sql += ` ORDER BY f.size ASC`;
        break;
      case "date_asc":
        sql += ` ORDER BY f.updated_at ASC`;
        break;
      case "date_desc":
      default:
        sql += ` ORDER BY f.updated_at DESC`;
        break;
    }

    const stmt = this.db.prepare(sql);
    stmt.bind(params);

    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const tags = [];
      if (row.tag_info) {
        const parts = row.tag_info.split("||");
        for (const part of parts) {
          const [tId, tName, tColor] = part.split("::");
          if (tId && tName) {
            tags.push({
              id: Number(tId),
              name: tName,
              color: tColor || "#6366F1",
            });
          }
        }
      }
      delete row.tag_info;
      row.tags = tags;
      row.is_favorite = Boolean(row.is_favorite);
      rows.push(row);
    }
    stmt.free();
    return rows;
  }

  deleteFile(fileId) {
    this.db.run("DELETE FROM file_tags WHERE file_id = ?", [fileId]);
    this.db.run("DELETE FROM files WHERE id = ?", [fileId]);
    this.save();
    return true;
  }

  deleteFiles(fileIds) {
    if (!Array.isArray(fileIds) || fileIds.length === 0) return true;
    const placeholders = fileIds.map(() => "?").join(",");
    this.db.run(
      `DELETE FROM file_tags WHERE file_id IN (${placeholders})`,
      fileIds,
    );
    this.db.run(`DELETE FROM files WHERE id IN (${placeholders})`, fileIds);
    this.save();
    return true;
  }

  attachTagToMultiple(fileIds, tagId) {
    if (!Array.isArray(fileIds) || fileIds.length === 0) return true;
    const stmt = this.db.prepare(
      "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)",
    );
    for (const id of fileIds) {
      stmt.run([id, tagId]);
    }
    stmt.free();
    this.save();
    return true;
  }

  updateFileInfo(fileId, { name, path: newPath, extension, category }) {
    this.db.run(
      "UPDATE files SET name = ?, path = ?, extension = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, newPath, extension, category, fileId],
    );
    this.save();
    return true;
  }

  toggleFavorite(fileId) {
    this.db.run(
      "UPDATE files SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [fileId],
    );
    this.save();
    const res = this.db.exec("SELECT is_favorite FROM files WHERE id = ?", [
      fileId,
    ]);
    return res.length > 0 && res[0].values.length > 0
      ? Boolean(res[0].values[0][0])
      : false;
  }

  updateNotes(fileId, notes) {
    this.db.run(
      "UPDATE files SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [notes, fileId],
    );
    this.save();
    return true;
  }

  getTags() {
    const sql = `
      SELECT t.id, t.name, t.color, COUNT(ft.file_id) as count
      FROM tags t
      LEFT JOIN file_tags ft ON t.id = ft.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `;
    const res = this.db.exec(sql);
    if (res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map((vals) => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = vals[idx];
      });
      return obj;
    });
  }

  createTag(name, color) {
    try {
      this.db.run("INSERT INTO tags (name, color) VALUES (?, ?)", [
        name.trim(),
        color,
      ]);
      this.save();
      const res = this.db.exec(
        "SELECT id, name, color FROM tags WHERE name = ?",
        [name.trim()],
      );
      if (res.length > 0 && res[0].values.length > 0) {
        return {
          id: res[0].values[0][0],
          name: res[0].values[0][1],
          color: res[0].values[0][2],
          count: 0,
        };
      }
    } catch (err) {
      console.error("Failed to create tag (possibly duplicate):", err);
      throw err;
    }
  }

  deleteTag(tagId) {
    this.db.run("DELETE FROM file_tags WHERE tag_id = ?", [tagId]);
    this.db.run("DELETE FROM tags WHERE id = ?", [tagId]);
    this.save();
    return true;
  }

  attachTag(fileId, tagId) {
    this.db.run(
      "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)",
      [fileId, tagId],
    );
    this.save();
    return true;
  }

  detachTag(fileId, tagId) {
    this.db.run("DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?", [
      fileId,
      tagId,
    ]);
    this.save();
    return true;
  }

  getStats() {
    const totalFilesRes = this.db.exec("SELECT COUNT(*) FROM files");
    const totalSizeRes = this.db.exec("SELECT SUM(size) FROM files");
    const favCountRes = this.db.exec(
      "SELECT COUNT(*) FROM files WHERE is_favorite = 1",
    );
    const tagCountRes = this.db.exec("SELECT COUNT(*) FROM tags");

    const totalFiles =
      totalFilesRes.length > 0 ? totalFilesRes[0].values[0][0] || 0 : 0;
    const totalSize =
      totalSizeRes.length > 0 ? totalSizeRes[0].values[0][0] || 0 : 0;
    const favCount =
      favCountRes.length > 0 ? favCountRes[0].values[0][0] || 0 : 0;
    const tagCount =
      tagCountRes.length > 0 ? tagCountRes[0].values[0][0] || 0 : 0;

    return {
      totalFiles,
      totalSize,
      favCount,
      tagCount,
    };
  }
}

module.exports = DatabaseManager;
