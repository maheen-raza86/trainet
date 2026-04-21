import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import supabase from '../config/supabaseClient.js';

const router = express.Router();

// GET /api/enroll/preview?token= — MUST be before /qr/:token to avoid param capture
router.get('/preview', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const { data: qrToken, error } = await supabase
      .from('enrollment_qr_tokens')
      .select(`
        id, offering_id, expires_at, is_single_use, used_at,
        course_offerings (
          id, duration_weeks, hours_per_week, status,
          start_date, end_date,
          courses ( id, title, description ),
          profiles!course_offerings_trainer_id_fkey ( first_name, last_name )
        )
      `)
      .eq('token', token)
      .single();

    if (error || !qrToken) return res.status(404).json({ success: false, message: 'Invalid or expired QR token' });
    if (new Date(qrToken.expires_at) < new Date()) return res.status(410).json({ success: false, message: 'This QR code has expired' });

    const offering = qrToken.course_offerings;
    res.status(200).json({
      success: true,
      data: {
        offeringId: offering.id,
        courseTitle: offering.courses?.title || 'Course',
        courseDescription: offering.courses?.description || '',
        trainerName: `${offering.profiles?.first_name || ''} ${offering.profiles?.last_name || ''}`.trim(),
        durationWeeks: offering.duration_weeks,
        hoursPerWeek: offering.hours_per_week,
        startDate: offering.start_date,
        endDate: offering.end_date,
        status: offering.status,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/enroll/qr — POST-based enrollment (token in body)
router.post('/qr', verifyToken, userController.enrollViaQRPost);

// GET /api/enroll/qr/:token — legacy GET-based enrollment (MUST be last — :token is a wildcard)
router.get('/qr/:token', verifyToken, userController.enrollViaQR);

export default router;
