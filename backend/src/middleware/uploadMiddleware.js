/**
 * File Upload Middleware
 * Uses multer memoryStorage — files are held in memory as Buffer.
 * Actual upload to Supabase Storage happens in each controller.
 *
 * DO NOT COMMIT API KEYS — USE ENV VARIABLES ONLY
 */

import multer from 'multer';
import path from 'path';

// ── Memory storage (no local disk writes) ─────────────────────────────────
const memoryStorage = multer.memoryStorage();

// ── File filter: assignment / submission / WP files ───────────────────────
const submissionFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.zip', '.js', '.py', '.java', '.cpp', '.c',
    '.txt', '.md', '.doc', '.docx', '.ts', '.jsx', '.tsx',
    '.html', '.css', '.json', '.yaml', '.yml',
  ];
  const allowedMimeTypes = [
    'application/pdf',
    'application/zip', 'application/x-zip-compressed',
    'text/javascript', 'text/x-python', 'text/x-java-source',
    'text/x-c++src', 'text/x-csrc', 'text/plain', 'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`), false);
  }
};

// ── File filter: avatar / profile picture ─────────────────────────────────
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

// ── General upload (submissions, assignments, WP, materials) ──────────────
const upload = multer({
  storage: memoryStorage,
  fileFilter: submissionFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ── Avatar upload ──────────────────────────────────────────────────────────
export const uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;
