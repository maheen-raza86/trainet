/**
 * File Upload Middleware
 * Handle file uploads using multer
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Allowed file extensions - added .doc and .docx
  const allowedExtensions = ['.pdf', '.zip', '.js', '.py', '.java', '.cpp', '.c', '.txt', '.md', '.doc', '.docx'];
  
  // Allowed MIME types - added Word document MIME types
  const allowedMimeTypes = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/javascript',
    'text/x-python',
    'text/x-java-source',
    'text/x-c++src',
    'text/x-csrc',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export default upload;