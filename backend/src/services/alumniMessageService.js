/**
 * Alumni Message Service
 * Handle messaging between students and alumni
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, ForbiddenError } from '../utils/errors.js';

export const sendMessage = async (senderId, receiverId, message) => {
  try {
    if (!message || message.trim().length === 0) {
      throw new BadRequestError('Message cannot be empty');
    }

    const { data, error } = await supabase
      .from('alumni_messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim(),
        created_at: new Date().toISOString(),
      }])
      .select(`
        *,
        sender:profiles!alumni_messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!alumni_messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      logger.error('Error sending message:', error);
      throw new BadRequestError('Failed to send message');
    }

    return data;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error sending message:', err);
    throw new BadRequestError('Failed to send message');
  }
};

export const getConversation = async (userId, otherUserId) => {
  try {
    const { data, error } = await supabase
      .from('alumni_messages')
      .select(`
        *,
        sender:profiles!alumni_messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!alumni_messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching conversation:', error);
      throw new BadRequestError('Failed to fetch conversation');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching conversation:', err);
    throw new BadRequestError('Failed to fetch conversation');
  }
};

export const getInbox = async (userId) => {
  try {
    // Get latest message per conversation partner
    const { data, error } = await supabase
      .from('alumni_messages')
      .select(`
        *,
        sender:profiles!alumni_messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!alumni_messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching inbox:', error);
      throw new BadRequestError('Failed to fetch inbox');
    }

    // Deduplicate: keep only latest message per conversation partner
    const seen = new Set();
    const inbox = [];
    for (const msg of (data || [])) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        inbox.push(msg);
      }
    }

    return inbox;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching inbox:', err);
    throw new BadRequestError('Failed to fetch inbox');
  }
};
