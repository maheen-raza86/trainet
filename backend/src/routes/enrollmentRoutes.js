import express from 'express';
import { enrollInCourse, getMyEnrollments, getEnrollmentsByOffering } from '../controllers/enrollmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, enrollInCourse);
router.get('/my', verifyToken, getMyEnrollments);
router.get('/offering/:offeringId', verifyToken, getEnrollmentsByOffering);

export default router;
