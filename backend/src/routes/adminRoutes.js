/**
 * Admin Routes
 * All routes require authentication + admin role (FR-AD security)
 */

import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as courseOfferingController from '../controllers/courseOfferingController.js';
import * as trainerAppController from '../controllers/trainerApplicationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply admin guard to ALL routes in this router
router.use(verifyToken, authorizeRoles('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Course management
router.get('/courses', adminController.getCourses);
router.get('/course-offerings', adminController.getOfferings);
router.delete('/courses/:id', adminController.deleteCourse);

// Course offering management (admin control)
router.put('/course-offerings/:id', courseOfferingController.adminUpdateCourseOffering);
router.delete('/course-offerings/:id', courseOfferingController.adminDeleteOffering);

// Certificate management
router.get('/certificates', adminController.getCertificates);
router.patch('/certificates/:id/revoke', adminController.revokeCertificate);

// System logs
router.get('/logs', adminController.getLogs);

// Settings
router.get('/settings', adminController.getSettings);
router.patch('/settings/:key', adminController.updateSetting);

// Active courses monitoring
router.get('/active-offerings', adminController.getActiveOfferings);
router.get('/active-offerings/:id', adminController.getOfferingMonitorDetail);

// Deep analytics
router.get('/analytics', adminController.getAnalytics);

// ── Trainer Verification ──────────────────────────────────────────────────
// GET  /api/admin/trainers                          — list all trainers + status
// GET  /api/admin/trainer-applications              — list applications (filter by ?status=)
// PATCH /api/admin/trainer-applications/:id/review  — approve or reject
router.get('/trainers', trainerAppController.listAllTrainers);
router.get('/trainer-applications', trainerAppController.listApplications);
router.patch('/trainer-applications/:trainerId/review', trainerAppController.reviewApplication);

export default router;
