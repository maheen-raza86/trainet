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
const avatarsDir = path.join(uploadsDir, 'avatars');

[uploadsDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Assignment submission storage ─────────────────────────────────────────

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const submissionFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.zip', '.js', '.py', '.java', '.cpp', '.c', '.txt', '.md', '.doc', '.docx'];
  const allowedMimeTypes = [
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'text/javascript', 'text/x-python', 'text/x-java-source',
    'text/x-c++src', 'text/x-csrc', 'text/plain', 'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage: submissionStorage,
  fileFilter: submissionFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Avatar / profile picture storage ──────────────────────────────────────

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Use user ID so each user has one file (overwrites old one)
    const userId = req.user?.id || Date.now();
    cb(null, `avatar-${userId}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, webp)'), false);
  }
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;
