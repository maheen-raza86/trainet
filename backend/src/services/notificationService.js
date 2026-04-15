/**
 * Notification Service
 * Create and manage user notifications
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, { title, message, type = 'info' }) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, title, message, type }]);
    if (error) logger.error('Error creating notification:', error);
  } catch (err) {
    logger.error('Unexpected error creating notification:', err);
  }
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    logger.error('Unexpected error fetching notifications:', err);
    return [];
  }
};

/**
 * Mark notification(s) as read
 */
export const markAsRead = async (userId, notificationId = null) => {
  try {
    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);

    if (notificationId) {
      query = query.eq('id', notificationId);
    }

    const { error } = await query;
    if (error) logger.error('Error marking notification as read:', error);
  } catch (err) {
    logger.error('Unexpected error marking notification:', err);
  }
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
};
