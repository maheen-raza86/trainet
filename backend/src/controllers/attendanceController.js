/**
 * Attendance Controller
 */

import * as attendanceService from '../services/attendanceService.js';

/** POST /api/attendance/mark — trainer marks attendance */
export const markAttendance = async (req, res, next) => {
  try {
    const { offeringId, studentId, sessionDate, status } = req.body;
    const result = await attendanceService.markAttendance(req.user.id, offeringId, studentId, sessionDate, status);
    res.status(200).json({ success: true, message: 'Attendance marked', data: result });
  } catch (err) { next(err); }
};

/** POST /api/attendance/session — trainer adds a new session date */
export const addSessionDate = async (req, res, next) => {
  try {
    const { offeringId, sessionDate } = req.body;
    if (!offeringId || !sessionDate) {
      return res.status(400).json({ success: false, message: 'offeringId and sessionDate are required' });
    }
    const result = await attendanceService.addSessionDate(req.user.id, offeringId, sessionDate);
    res.status(201).json({ success: true, message: 'Session date added', data: result });
  } catch (err) { next(err); }
};

/** GET /api/attendance/offering/:offeringId — trainer views all attendance */
export const getOfferingAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getOfferingAttendance(req.params.offeringId, req.user.id);
    res.status(200).json({ success: true, message: 'Attendance retrieved', data: result });
  } catch (err) { next(err); }
};

/** GET /api/attendance/student/:offeringId — student views own attendance */
export const getStudentAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getStudentAttendance(req.user.id, req.params.offeringId);
    res.status(200).json({ success: true, message: 'Attendance retrieved', data: result });
  } catch (err) { next(err); }
};
