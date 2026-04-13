/**
 * Recruiter Controller
 */

import * as recruiterService from '../services/recruiterService.js';
import { BadRequestError } from '../utils/errors.js';

export const searchCandidates = async (req, res, next) => {
  try {
    const { skills, min_score, project_type } = req.query;
    const candidates = await recruiterService.searchCandidates({ skills, minScore: min_score, projectType: project_type });
    res.status(200).json({ success: true, message: 'Candidates retrieved', data: { candidates, count: candidates.length } });
  } catch (err) { next(err); }
};

export const getCandidateProfile = async (req, res, next) => {
  try {
    const profile = await recruiterService.getCandidateProfile(req.params.id);
    res.status(200).json({ success: true, message: 'Profile retrieved', data: profile });
  } catch (err) { next(err); }
};

export const bookmarkCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) throw new BadRequestError('candidateId is required');
    const result = await recruiterService.bookmarkCandidate(req.user.id, candidateId);
    res.status(200).json({ success: true, message: result.bookmarked ? 'Bookmarked' : 'Bookmark removed', data: result });
  } catch (err) { next(err); }
};

export const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await recruiterService.getBookmarks(req.user.id);
    res.status(200).json({ success: true, message: 'Bookmarks retrieved', data: { bookmarks, count: bookmarks.length } });
  } catch (err) { next(err); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId) throw new BadRequestError('receiverId is required');
    const msg = await recruiterService.sendMessage(req.user.id, receiverId, message);
    res.status(201).json({ success: true, message: 'Message sent', data: msg });
  } catch (err) { next(err); }
};

export const getConversation = async (req, res, next) => {
  try {
    const messages = await recruiterService.getConversation(req.user.id, req.params.userId);
    res.status(200).json({ success: true, message: 'Conversation retrieved', data: { messages, count: messages.length } });
  } catch (err) { next(err); }
};

export const getInbox = async (req, res, next) => {
  try {
    const inbox = await recruiterService.getInbox(req.user.id);
    res.status(200).json({ success: true, message: 'Inbox retrieved', data: { inbox, count: inbox.length } });
  } catch (err) { next(err); }
};
