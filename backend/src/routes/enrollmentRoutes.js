import express from 'express';
import { enrollInCourse, getMyEnrollments, getEnrollmentsByOffering } from '../controllers/enrollmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, enrollInCourse);
router.get('/my', verifyToken, getMyEnrollments);
// Only trainers and admins may view all enrollments for an offering
router.get('/offering/:offeringId', verifyToken, authorizeRoles('trainer', 'admin'), getEnrollmentsByOffering);

export default router;
