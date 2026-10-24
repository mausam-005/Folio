/**
 * Format Conversion Utilities for Folio
 * Supports high-fidelity image re-encoding via HTML5 Canvas,
 * structured data transforms (JSON <-> CSV/TSV), and markup conversion (MD <-> HTML).
 */

export const FORMAT_PRESETS = {
  image: [
    { ext: 'png', label: 'PNG', desc: 'Lossless with transparency' },
    { ext: 'jpg', label: 'JPG', desc: 'Standard compressed image' },
    { ext: 'webp', label: 'WebP', desc: 'Modern web image format' },
    { ext: 'avif', label: 'AVIF', desc: 'Next-gen compact format' },
    { ext: 'bmp', label: 'BMP', desc: 'Uncompressed bitmap' },
    { ext: 'svg', label: 'SVG', desc: 'Scalable vector graphics' },
  ],
  document: [
    { ext: 'csv', label: 'CSV', desc: 'Comma-separated spreadsheet values' },
    { ext: 'json', label: 'JSON', desc: 'Structured JavaScript Object Notation' },
    { ext: 'tsv', label: 'TSV', desc: 'Tab-separated values' },
    { ext: 'md', label: 'Markdown', desc: 'Formatted markdown document' },
    { ext: 'html', label: 'HTML', desc: 'Webpage markup document' },
    { ext: 'txt', label: 'Plain Text', desc: 'Standard unformatted text' },
    { ext: 'rtf', label: 'RTF', desc: 'Rich text format' },
  ],
  code: [
    { ext: 'ts', label: 'TypeScript', desc: 'Typed JavaScript' },
    { ext: 'js', label: 'JavaScript', desc: 'Standard JavaScript' },
    { ext: 'tsx', label: 'TSX', desc: 'TypeScript with React JSX' },
    { ext: 'jsx', label: 'JSX', desc: 'JavaScript with React JSX' },
    { ext: 'json', label: 'JSON', desc: 'Structured config' },
    { ext: 'yaml', label: 'YAML', desc: 'Clean human-readable config' },
    { ext: 'py', label: 'Python', desc: 'Python script' },
    { ext: 'html', label: 'HTML', desc: 'Web markup' },
    { ext: 'css', label: 'CSS', desc: 'Cascading stylesheet' },
    { ext: 'sh', label: 'Shell', desc: 'Unix shell script' },
    { ext: 'sql', label: 'SQL', desc: 'Database query script' },
  ],
  video: [
    { ext: 'mp4', label: 'MP4', desc: 'Universal video container' },
    { ext: 'mov', label: 'MOV', desc: 'Apple QuickTime video' },
    { ext: 'webm', label: 'WebM', desc: 'Modern web video' },
    { ext: 'mkv', label: 'MKV', desc: 'Matroska multimedia container' },
    { ext: 'avi', label: 'AVI', desc: 'Audio Video Interleaved' },
  ],
  audio: [
    { ext: 'mp3', label: 'MP3', desc: 'Universal compressed audio' },
    { ext: 'wav', label: 'WAV', desc: 'Uncompressed PCM audio' },
    { ext: 'm4a', label: 'M4A', desc: 'Apple AAC audio container' },
    { ext: 'ogg', label: 'OGG', desc: 'Ogg Vorbis audio' },
    { ext: 'flac', label: 'FLAC', desc: 'Lossless audio' },
    { ext: 'aac', label: 'AAC', desc: 'Advanced Audio Coding' },
  ],
};

/**
 * Re-encode image via HTML5 Canvas
 */
export async function convertImage(imgUrl, targetExt) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        const clean = targetExt.toLowerCase().replace(/^\./, '');

        // If target is JPEG, fill white background for transparency
        if (clean === 'jpg' || clean === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        let mimeType = 'image/png';
        if (clean === 'jpg' || clean === 'jpeg') mimeType = 'image/jpeg';
        else if (clean === 'webp') mimeType = 'image/webp';
        else if (clean === 'avif') mimeType = 'image/avif';
        else if (clean === 'bmp') mimeType = 'image/bmp';

        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for canvas encoding.'));
    img.src = imgUrl;
  });
}

/**
 * Convert structured data and text documents
 */
export function convertTextDocument(content, fromExt, toExt) {
  const from = (fromExt || '').toLowerCase().replace(/^\./, '');
  const to = (toExt || '').toLowerCase().replace(/^\./, '');

  if (!content || from === to) return content;

  // JSON -> CSV
  if (from === 'json' && to === 'csv') {
    return jsonToCsv(content, ',');
  }

  // JSON -> TSV
  if (from === 'json' && to === 'tsv') {
    return jsonToCsv(content, '\t');
  }

  // CSV -> JSON
  if (from === 'csv' && to === 'json') {
    return csvToJson(content, ',');
  }

  // TSV -> JSON
  if (from === 'tsv' && to === 'json') {
    return csvToJson(content, '\t');
  }

  // Markdown -> HTML
  if (from === 'md' && to === 'html') {
    return markdownToHtml(content);
  }

  // HTML -> Markdown
  if (from === 'html' && to === 'md') {
    return htmlToMarkdown(content);
  }

  // Any text to TXT
  if (to === 'txt') {
    if (from === 'html') {
      return content.replace(/<[^>]+>/g, '').trim();
    }
    return content;
  }

  // TXT -> Markdown
  if (from === 'txt' && to === 'md') {
    return content;
  }

  return content;
}

function jsonToCsv(jsonStr, delimiter = ',') {
  try {
    const data = JSON.parse(jsonStr);
    const escapeVal = (val) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const keys = Array.from(
        new Set(
          data.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value']))
        )
      );
      const headerRow = keys.map(escapeVal).join(delimiter);
      const rows = data.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return keys.map((k) => escapeVal(item[k])).join(delimiter);
        }
        return escapeVal(item);
      });
      return [headerRow, ...rows].join('\n');
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      const headerRow = ['key', 'value'].join(delimiter);
      const rows = keys.map((k) => `${escapeVal(k)}${delimiter}${escapeVal(data[k])}`);
      return [headerRow, ...rows].join('\n');
    }
    return String(data);
  } catch (e) {
    throw new Error('Invalid JSON format: ' + e.message);
  }
}

function csvToJson(csvStr, delimiter = ',') {
  const lines = csvStr.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return '[]';

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h || `column_${idx + 1}`] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }

  return JSON.stringify(rows, null, 2);
}

function markdownToHtml(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '</p><p>');

  html = `<p>${html}</p>`.replace(/<p><\/p>/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #24292e; }
    h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    code { background: #f6f8fa; padding: .2em .4em; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

function htmlToMarkdown(html) {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}
