/**
 * Guidance Controller
 */

import * as guidanceService from '../services/guidanceService.js';

// ── Guidance Requests ─────────────────────────────────────────────────────────

export const createGuidanceRequest = async (req, res, next) => {
  try {
    const result = await guidanceService.createRequest(req.user.id, req.user.role, req.body);
    res.status(201).json({ success: true, message: 'Guidance request created', data: result });
  } catch (err) { next(err); }
};

export const getStudentRequests = async (req, res, next) => {
  try {
    const result = await guidanceService.getStudentRequests(req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Guidance requests retrieved', data: { requests: result, count: result.length } });
  } catch (err) { next(err); }
};

export const getAlumniRequests = async (req, res, next) => {
  try {
    const result = await guidanceService.getAlumniRequests(req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Guidance requests retrieved', data: { requests: result, count: result.length } });
  } catch (err) { next(err); }
};

export const cancelGuidanceRequest = async (req, res, next) => {
  try {
    const result = await guidanceService.cancelRequest(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Guidance request cancelled', data: result });
  } catch (err) { next(err); }
};

export const respondToRequest = async (req, res, next) => {
  try {
    const result = await guidanceService.respondToRequest(req.params.id, req.user.id, req.body.status);
    res.status(200).json({ success: true, message: 'Guidance request updated', data: result });
  } catch (err) { next(err); }
};

// ── Mentorship Sessions ───────────────────────────────────────────────────────

export const createSession = async (req, res, next) => {
  try {
    const result = await guidanceService.createSession(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Mentorship session created', data: result });
  } catch (err) { next(err); }
};

export const getStudentSessions = async (req, res, next) => {
  try {
    const result = await guidanceService.getStudentSessions(req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Sessions retrieved', data: { sessions: result, count: result.length } });
  } catch (err) { next(err); }
};

export const getAlumniSessions = async (req, res, next) => {
  try {
    const result = await guidanceService.getAlumniSessions(req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Sessions retrieved', data: { sessions: result, count: result.length } });
  } catch (err) { next(err); }
};

export const getSessionById = async (req, res, next) => {
  try {
    const result = await guidanceService.getSessionById(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Session retrieved', data: result });
  } catch (err) { next(err); }
};

export const updateSession = async (req, res, next) => {
  try {
    const result = await guidanceService.updateSession(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Session updated', data: result });
  } catch (err) { next(err); }
};

// ── Materials ─────────────────────────────────────────────────────────────────

export const uploadMaterialHandler = async (req, res, next) => {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    // If a real file was uploaded via multer, use its path; otherwise fall back to body.file_url
    const fileUrl = req.file
      ? `${backendUrl}/uploads/${req.file.filename}`
      : req.body.file_url;

    // Auto-detect type from file extension if not provided
    let type = req.body.type || 'document';
    if (req.file) {
      const ext = req.file.originalname.split('.').pop()?.toLowerCase() || '';
      if (['pdf'].includes(ext)) type = 'pdf';
      else if (['ppt', 'pptx'].includes(ext)) type = 'slides';
      else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) type = 'image';
      else if (['doc', 'docx', 'txt', 'md'].includes(ext)) type = 'document';
      else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) type = 'link';
    }

    const result = await guidanceService.uploadMaterial(req.params.id, req.user.id, {
      title: req.body.title,
      file_url: fileUrl,
      type,
    });
    res.status(201).json({ success: true, message: 'Material uploaded', data: result });
  } catch (err) { next(err); }
};

export const uploadMaterial = async (req, res, next) => {
  try {
    const result = await guidanceService.uploadMaterial(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Material uploaded', data: result });
  } catch (err) { next(err); }
};

export const getMaterials = async (req, res, next) => {
  try {
    const result = await guidanceService.getMaterials(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Materials retrieved', data: { materials: result, count: result.length } });
  } catch (err) { next(err); }
};

// ── Feedback ──────────────────────────────────────────────────────────────────

export const submitFeedback = async (req, res, next) => {
  try {
    const result = await guidanceService.submitFeedback(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Feedback submitted', data: result });
  } catch (err) { next(err); }
};

export const getFeedback = async (req, res, next) => {
  try {
    const result = await guidanceService.getFeedback(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, message: 'Feedback retrieved', data: { feedback: result, count: result.length } });
  } catch (err) { next(err); }
};
