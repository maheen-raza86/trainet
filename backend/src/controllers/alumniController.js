/**
 * Alumni Controller
 */

import * as alumniService from '../services/alumniService.js';
import * as mentorshipService from '../services/mentorshipService.js';
import * as messageService from '../services/alumniMessageService.js';
import { BadRequestError } from '../utils/errors.js';

// ── Alumni Profiles ──────────────────────────────────────────────────────────

export const getAllAlumni = async (req, res, next) => {
  try {
    const alumni = await alumniService.getAllAlumni();
    res.status(200).json({ success: true, message: 'Alumni retrieved', data: { alumni, count: alumni.length } });
  } catch (err) { next(err); }
};

export const getAlumniById = async (req, res, next) => {
  try {
    const profile = await alumniService.getAlumniById(req.params.id);
    res.status(200).json({ success: true, message: 'Profile retrieved', data: profile });
  } catch (err) { next(err); }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await alumniService.getMyProfile(req.user.id);
    res.status(200).json({ success: true, message: 'Profile retrieved', data: profile });
  } catch (err) { next(err); }
};

export const saveProfile = async (req, res, next) => {
  try {
    const profile = await alumniService.createOrUpdateProfile(req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Profile saved', data: profile });
  } catch (err) { next(err); }
};

// ── Mentorship ───────────────────────────────────────────────────────────────

export const sendMentorshipRequest = async (req, res, next) => {
  try {
    const { alumniProfileId, message } = req.body;
    if (!alumniProfileId) throw new BadRequestError('alumniProfileId is required');
    const request = await mentorshipService.sendRequest(req.user.id, alumniProfileId, message);
    res.status(201).json({ success: true, message: 'Request sent', data: request });
  } catch (err) { next(err); }
};

export const getAlumniRequests = async (req, res, next) => {
  try {
    const requests = await mentorshipService.getRequestsForAlumni(req.user.id);
    res.status(200).json({ success: true, message: 'Requests retrieved', data: { requests, count: requests.length } });
  } catch (err) { next(err); }
};

export const getStudentRequests = async (req, res, next) => {
  try {
    const requests = await mentorshipService.getRequestsForStudent(req.user.id);
    res.status(200).json({ success: true, message: 'Requests retrieved', data: { requests, count: requests.length } });
  } catch (err) { next(err); }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, scheduledAt } = req.body;
    const request = await mentorshipService.updateRequestStatus(req.params.id, req.user.id, status, scheduledAt);
    res.status(200).json({ success: true, message: 'Request updated', data: request });
  } catch (err) { next(err); }
};

// ── Messages ─────────────────────────────────────────────────────────────────

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId) throw new BadRequestError('receiverId is required');
    const msg = await messageService.sendMessage(req.user.id, receiverId, message);
    res.status(201).json({ success: true, message: 'Message sent', data: msg });
  } catch (err) { next(err); }
};

export const getConversation = async (req, res, next) => {
  try {
    const messages = await messageService.getConversation(req.user.id, req.params.userId);
    res.status(200).json({ success: true, message: 'Conversation retrieved', data: { messages, count: messages.length } });
  } catch (err) { next(err); }
};

export const getInbox = async (req, res, next) => {
  try {
    const inbox = await messageService.getInbox(req.user.id);
    res.status(200).json({ success: true, message: 'Inbox retrieved', data: { inbox, count: inbox.length } });
  } catch (err) { next(err); }
};
