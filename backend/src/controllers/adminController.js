/**
 * Admin Controller
 * SRDS FR-AD-1 through FR-AD-4
 */

import * as adminService from '../services/adminService.js';
import { BadRequestError } from '../utils/errors.js';

// ── Dashboard ──────────────────────────────────────────────────────────────

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};

// ── Users ──────────────────────────────────────────────────────────────────

export const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const result = await adminService.getAllUsers({
      role,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const user = await adminService.updateUser(id, req.body, adminId);
    res.status(200).json({ success: true, message: 'User updated', data: user });
  } catch (error) { next(error); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    await adminService.deleteUser(id, adminId);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) { next(error); }
};

// ── Courses ────────────────────────────────────────────────────────────────

export const getCourses = async (req, res, next) => {
  try {
    const courses = await adminService.getAllCourses();
    res.status(200).json({ success: true, data: { courses, count: courses.length } });
  } catch (error) { next(error); }
};

export const getOfferings = async (req, res, next) => {
  try {
    const offerings = await adminService.getAllOfferings();
    res.status(200).json({ success: true, data: { offerings, count: offerings.length } });
  } catch (error) { next(error); }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    await adminService.deleteCourse(id, adminId);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) { next(error); }
};

// ── Certificates ───────────────────────────────────────────────────────────

export const getCertificates = async (req, res, next) => {
  try {
    const certs = await adminService.getAllCertificates();
    res.status(200).json({ success: true, data: { certificates: certs, count: certs.length } });
  } catch (error) { next(error); }
};

export const revokeCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;
    const cert = await adminService.revokeCertificate(id, adminId, reason);
    res.status(200).json({ success: true, message: 'Certificate revoked', data: cert });
  } catch (error) { next(error); }
};

// ── Logs ───────────────────────────────────────────────────────────────────

export const getLogs = async (req, res, next) => {
  try {
    const { eventType, page = '1', limit = '50' } = req.query;
    const logs = await adminService.getSystemLogs({
      eventType,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json({ success: true, data: { logs, count: logs.length } });
  } catch (error) { next(error); }
};

// ── Settings ───────────────────────────────────────────────────────────────

export const getSettings = async (req, res, next) => {
  try {
    const settings = await adminService.getSettings();
    res.status(200).json({ success: true, data: { settings } });
  } catch (error) { next(error); }
};

export const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const adminId = req.user.id;
    if (value === undefined || value === null) throw new BadRequestError('value is required');
    const setting = await adminService.updateSetting(key, String(value), adminId);
    res.status(200).json({ success: true, message: 'Setting updated', data: setting });
  } catch (error) { next(error); }
};
