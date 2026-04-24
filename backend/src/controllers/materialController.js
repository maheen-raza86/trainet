/**
 * Course Material Controller
 */

import * as materialService from '../services/materialService.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';
import { uploadFile } from '../utils/storageService.js';

/**
 * Add material to a course offering
 * POST /api/materials
 */
export const addMaterial = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { offeringId, title, description, materialType, externalUrl, sortOrder } = req.body;
    const file = req.file;

    if (!offeringId || !title) {
      throw new BadRequestError('offeringId and title are required');
    }

    // Upload file to Supabase Storage if provided
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    if (file) {
      fileUrl = await uploadFile({
        buffer: file.buffer,
        folder: 'materials',
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      fileName = file.originalname;
      fileSize = file.size;
    }

    const material = await materialService.addMaterial(trainerId, {
      offeringId,
      title,
      description,
      materialType: materialType || (file ? 'file' : 'link'),
      fileUrl,
      externalUrl: externalUrl || null,
      fileName,
      fileSize,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    });

    logger.info(`Material added to offering ${offeringId} by trainer ${trainerId}`);

    res.status(201).json({
      success: true,
      message: 'Material added successfully',
      data: material,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get materials for a course offering
 * GET /api/materials/offering/:offeringId
 */
export const getMaterialsByOffering = async (req, res, next) => {
  try {
    const { offeringId } = req.params;
    const materials = await materialService.getMaterialsByOffering(offeringId);

    res.status(200).json({
      success: true,
      message: 'Materials retrieved successfully',
      data: { materials, count: materials.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a material
 * DELETE /api/materials/:id
 */
export const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    await materialService.deleteMaterial(id, trainerId);

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update live session link
 * PUT /api/materials/live-session/:offeringId
 */
export const updateLiveSession = async (req, res, next) => {
  try {
    const { offeringId } = req.params;
    const trainerId = req.user.id;
    const { liveSessionLink, liveSessionNotes } = req.body;

    const offering = await materialService.updateLiveSession(
      offeringId, trainerId, liveSessionLink, liveSessionNotes
    );

    res.status(200).json({
      success: true,
      message: 'Live session updated successfully',
      data: offering,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course offering detail (with materials)
 * GET /api/materials/offering-detail/:offeringId
 */
export const getOfferingDetail = async (req, res, next) => {
  try {
    const { offeringId } = req.params;
    const detail = await materialService.getOfferingDetail(offeringId);

    res.status(200).json({
      success: true,
      message: 'Offering detail retrieved successfully',
      data: detail,
    });
  } catch (error) {
    next(error);
  }
};
