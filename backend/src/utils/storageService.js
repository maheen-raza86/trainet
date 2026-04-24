/**
 * Supabase Storage Service
 * Centralised file upload utility — replaces local disk storage.
 *
 * DO NOT COMMIT API KEYS — USE ENV VARIABLES ONLY
 *
 * Bucket layout inside "uploads":
 *   uploads/assignments/   — assignment resource files (trainer)
 *   uploads/submissions/   — student assignment submissions
 *   uploads/work-practice/ — work & practice task files + submissions
 *   uploads/avatars/       — user profile pictures
 *   uploads/materials/     — guidance session materials
 *   uploads/certificates/  — certificate PDFs (future use)
 */

import { supabaseAdminClient } from '../config/supabaseClient.js';
import path from 'path';
import logger from './logger.js';

const BUCKET = 'uploads';

/**
 * Ensure the "uploads" bucket exists (idempotent).
 * Called once at server startup.
 */
export const ensureBucketExists = async () => {
  try {
    const { data: buckets } = await supabaseAdminClient.storage.listBuckets();
    const exists = (buckets || []).some(b => b.name === BUCKET);
    if (!exists) {
      const { error } = await supabaseAdminClient.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 52428800, // 50 MB
      });
      if (error) {
        logger.error('[Storage] Failed to create bucket:', error.message);
      } else {
        logger.info(`[Storage] Bucket "${BUCKET}" created`);
      }
    } else {
      logger.info(`[Storage] Bucket "${BUCKET}" already exists`);
    }
  } catch (err) {
    logger.error('[Storage] ensureBucketExists error:', err.message);
  }
};

/**
 * Upload a file buffer to Supabase Storage.
 *
 * @param {Object} params
 * @param {Buffer}  params.buffer       — file buffer from multer memoryStorage
 * @param {string}  params.folder       — sub-folder: 'assignments'|'submissions'|'work-practice'|'avatars'|'materials'
 * @param {string}  params.originalName — original filename (used for extension)
 * @param {string}  params.mimeType     — MIME type of the file
 * @param {string}  [params.userId]     — optional user ID (used for avatar deduplication)
 * @returns {Promise<string>}           — public URL of the uploaded file
 */
export const uploadFile = async ({ buffer, folder, originalName, mimeType, userId }) => {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);

  // For avatars: use userId so each user has one file (overwrites old one)
  const filename = folder === 'avatars' && userId
    ? `avatar-${userId}${ext}`
    : `${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

  const storagePath = `${folder}/${filename}`;

  const { error } = await supabaseAdminClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: folder === 'avatars', // overwrite avatars, not other files
    });

  if (error) {
    logger.error(`[Storage] Upload failed (${storagePath}):`, error.message);
    throw new Error(`File upload failed: ${error.message}`);
  }

  const { data } = supabaseAdminClient.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  logger.info(`[Storage] Uploaded: ${storagePath} → ${data.publicUrl}`);
  return data.publicUrl;
};

/**
 * Download a file from Supabase Storage into a Buffer.
 * Used by AI evaluation to read submission content.
 *
 * @param {string} publicUrl — the public URL stored in the DB
 * @returns {Promise<{buffer: Buffer, ext: string}>}
 */
export const downloadFile = async (publicUrl) => {
  try {
    if (!publicUrl) return null;

    // Extract the storage path from the public URL
    // Public URL format: https://<project>.supabase.co/storage/v1/object/public/uploads/<path>
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) {
      logger.warn(`[Storage] Cannot parse storage path from URL: ${publicUrl}`);
      return null;
    }
    const storagePath = publicUrl.slice(idx + marker.length);
    const ext = path.extname(storagePath).toLowerCase();

    const { data, error } = await supabaseAdminClient.storage
      .from(BUCKET)
      .download(storagePath);

    if (error || !data) {
      logger.warn(`[Storage] Download failed (${storagePath}): ${error?.message}`);
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return { buffer, ext };
  } catch (err) {
    logger.error('[Storage] downloadFile error:', err.message);
    return null;
  }
};

/**
 * Check whether a URL is a Supabase Storage URL (vs old local path).
 * Used for backward compatibility when reading existing submissions.
 */
export const isSupabaseUrl = (url) => {
  if (!url) return false;
  return url.includes('.supabase.co/storage/') || url.startsWith('https://');
};
