import express from 'express';
import { markAttendance, addSessionDate, getOfferingAttendance, getStudentAttendance } from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Trainer adds a new session date (seeds absent for all enrolled students)
router.post('/session', verifyToken, authorizeRoles('trainer'), addSessionDate);

// Trainer marks/updates attendance for a specific student+date
router.post('/mark', verifyToken, authorizeRoles('trainer'), markAttendance);

// Trainer views all attendance for an offering
router.get('/offering/:offeringId', verifyToken, authorizeRoles('trainer'), getOfferingAttendance);

// Student views own attendance
router.get('/student/:offeringId', verifyToken, authorizeRoles('student'), getStudentAttendance);

export default router;
