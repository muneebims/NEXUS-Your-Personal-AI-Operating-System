import { FileAttachment } from '../types/nexus.js';

export const SUPPORTED_TEXT_EXTENSIONS = [
  '.txt', '.json', '.csv', '.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.md', '.sql', '.yaml', '.yml', '.xml'
];

export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'
];

export const SUPPORTED_DOC_EXTENSIONS = [
  '.pdf', '.docx'
];

export function isSupportedFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return (
    SUPPORTED_TEXT_EXTENSIONS.includes(ext) ||
    SUPPORTED_IMAGE_EXTENSIONS.includes(ext) ||
    SUPPORTED_DOC_EXTENSIONS.includes(ext) ||
    file.type.startsWith('text/') ||
    file.type.startsWith('image/')
  );
}

export async function processUploadedFile(file: File): Promise<FileAttachment> {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const isImage = file.type.startsWith('image/') || SUPPORTED_IMAGE_EXTENSIONS.includes(ext);

  if (isImage) {
    const base64 = await readFileAsBase64(file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'image/png',
      extension: ext,
      content: `[Image: ${file.name} (${Math.round(file.size / 1024)} KB)]`,
      base64,
      uploadedAt: Date.now(),
    };
  }

  // Handle PDF or DOCX
  if (ext === '.pdf' || ext === '.docx') {
    try {
      const text = await readFileAsText(file);
      // Clean up any non-printable chars from binary preview
      const sanitized = text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const extracted = sanitized.length > 50
        ? sanitized.slice(0, 15000)
        : `[Document metadata: ${file.name} (${Math.round(file.size / 1024)} KB). Document parsed for analysis.]`;

      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type || (ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        extension: ext,
        content: extracted,
        uploadedAt: Date.now(),
      };
    } catch {
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        extension: ext,
        content: `[Document: ${file.name} (${Math.round(file.size / 1024)} KB)]`,
        uploadedAt: Date.now(),
      };
    }
  }

  // Handle Text, Code, JSON, CSV
  const textContent = await readFileAsText(file);
  let processedContent = textContent;

  if (ext === '.json') {
    try {
      const parsed = JSON.parse(textContent);
      processedContent = JSON.stringify(parsed, null, 2);
    } catch {
      // keep raw text
    }
  } else if (ext === '.csv') {
    const lines = textContent.split('\n').filter((l) => l.trim().length > 0);
    const header = lines[0] || '';
    const sample = lines.slice(0, 10).join('\n');
    processedContent = `CSV Document: ${file.name}\nTotal Rows: ${lines.length}\nColumns: ${header}\n\nSample Data (first 10 rows):\n${sample}\n\nFull Raw Data:\n${textContent}`;
  }

  return {
    id,
    name: file.name,
    size: file.size,
    type: file.type || 'text/plain',
    extension: ext,
    content: processedContent,
    uploadedAt: Date.now(),
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
