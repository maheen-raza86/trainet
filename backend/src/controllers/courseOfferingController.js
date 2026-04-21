/**
 * Course Offering Controller
 * Handle course offering-related HTTP requests
 */

import * as courseOfferingService from '../services/courseOfferingService.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Get course catalog
 * GET /api/courses/catalog
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getCourseCatalog = async (req, res, next) => {
  try {
    const courses = await courseOfferingService.getCourseCatalog();

    res.status(200).json({
      success: true,
      message: 'Course catalog retrieved successfully',
      data: {
        courses,
        count: courses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create course offering
 * POST /api/course-offerings
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const createCourseOffering = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const {
      courseId, durationWeeks, hoursPerWeek, outline,
      startDate, endDate, registrationDeadline,
      weeklyDays, sessionStartTime, sessionEndTime,
    } = req.body;

    const offering = await courseOfferingService.createCourseOffering(trainerId, {
      courseId,
      durationWeeks: Number(durationWeeks),
      hoursPerWeek: Number(hoursPerWeek),
      outline,
      startDate: startDate || null,
      endDate: endDate || null,
      registrationDeadline: registrationDeadline || null,
      weeklyDays: weeklyDays || null,
      sessionStartTime: sessionStartTime || null,
      sessionEndTime: sessionEndTime || null,
    });

    logger.info(`Course offering created: ${offering.id} by trainer ${trainerId}`);

    res.status(201).json({
      success: true,
      message: 'Course offering created successfully',
      data: offering,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer's course offerings
 * GET /api/course-offerings/trainer
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getTrainerOfferings = async (req, res, next) => {
  try {
    const trainerId = req.user.id;

    const offerings = await courseOfferingService.getTrainerOfferings(trainerId);

    res.status(200).json({
      success: true,
      message: 'Trainer offerings retrieved successfully',
      data: {
        offerings,
        count: offerings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course offering
 * PUT /api/course-offerings/:id
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const updateCourseOffering = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;
    const { durationWeeks, hoursPerWeek, outline, startDate, endDate, status } = req.body;

    // Validate at least one field is provided
    if (
      durationWeeks === undefined &&
      hoursPerWeek === undefined &&
      outline === undefined &&
      startDate === undefined &&
      endDate === undefined &&
      status === undefined
    ) {
      throw new BadRequestError('At least one field must be provided for update');
    }

    const updateData = {};
    if (durationWeeks !== undefined) updateData.durationWeeks = durationWeeks;
    if (hoursPerWeek !== undefined) updateData.hoursPerWeek = hoursPerWeek;
    if (outline !== undefined) updateData.outline = outline;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;

    const offering = await courseOfferingService.updateCourseOffering(id, trainerId, updateData);

    logger.info(`Course offering ${id} updated by trainer ${trainerId}`);

    res.status(200).json({
      success: true,
      message: 'Course offering updated successfully',
      data: offering,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available course offerings
 * GET /api/course-offerings/available
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getAvailableOfferings = async (req, res, next) => {
  try {
    const offerings = await courseOfferingService.getAvailableOfferings();

    res.status(200).json({
      success: true,
      message: 'Available course offerings retrieved successfully',
      data: {
        offerings,
        count: offerings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll in course offering
 * POST /api/course-offerings/enroll
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const enrollInOffering = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const studentRole = req.user.role;
    const { offeringId } = req.body;

    if (!offeringId) {
      throw new BadRequestError('offeringId is required');
    }

    // SRDS: direct enrollment is disabled — must use QR token
    // This endpoint is kept for backward compatibility but enforces student-only
    if (studentRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll. Use the QR code to enroll.',
        error: 'Forbidden',
      });
    }

    const enrollment = await courseOfferingService.enrollInOffering(studentId, studentRole, offeringId);

    logger.info(`Student ${studentId} enrolled in offering ${offeringId}`);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course offering',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove student from offering (trainer only)
 * DELETE /api/course-offerings/enrollment/:enrollmentId
 */
export const removeEnrollment = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const trainerId = req.user.id;

    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Only trainers can remove students', error: 'Forbidden' });
    }

    await courseOfferingService.removeEnrollment(enrollmentId, trainerId);
    res.status(200).json({ success: true, message: 'Student removed from course offering' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete course offering (trainer only)
 * DELETE /api/course-offerings/:id
 */
export const deleteOffering = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;
    await courseOfferingService.deleteOffering(id, trainerId);
    res.status(200).json({ success: true, message: 'Course offering deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update course offering
 * PUT /api/admin/course-offerings/:id
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const adminUpdateCourseOffering = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationWeeks, hoursPerWeek, outline, startDate, endDate, status } = req.body;

    // Validate at least one field is provided
    if (
      durationWeeks === undefined &&
      hoursPerWeek === undefined &&
      outline === undefined &&
      startDate === undefined &&
      endDate === undefined &&
      status === undefined
    ) {
      throw new BadRequestError('At least one field must be provided for update');
    }

    const updateData = {};
    if (durationWeeks !== undefined) updateData.durationWeeks = durationWeeks;
    if (hoursPerWeek !== undefined) updateData.hoursPerWeek = hoursPerWeek;
    if (outline !== undefined) updateData.outline = outline;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;

    const offering = await courseOfferingService.adminUpdateCourseOffering(id, updateData);

    logger.info(`Course offering ${id} updated by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Course offering updated successfully',
      data: offering,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete or archive course offering
 * DELETE /api/admin/course-offerings/:id
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const adminDeleteOffering = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await courseOfferingService.adminDeleteOffering(id);

    logger.info(`Course offering ${id} ${result.action} by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        action: result.action,
        offering: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Drop a course offering (student only)
 * POST /api/course-offerings/:id/drop
 */
export const dropCourse = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const offeringId = req.params.id;
    const result = await courseOfferingService.dropCourse(studentId, offeringId);
    res.status(200).json({ success: true, message: 'Course dropped successfully', data: result });
  } catch (error) {
    next(error);
  }
};
