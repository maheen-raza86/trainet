/**
 * Admin Routes
 * All routes require authentication + admin role (FR-AD security)
 */

import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as courseOfferingController from '../controllers/courseOfferingController.js';
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

export default router;
