/**
 * Email Service
 * Handle sending emails for verification and notifications
 */

import nodemailer from 'nodemailer';
import logger from './logger.js';
import config from '../config/env.js';

/**
 * Create email transporter
 * In development/test, uses ethereal.email for testing
 * In production, configure with real SMTP credentials
 */
const createTransporter = async () => {
  // In test environment, skip email sending
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  // In development, use ethereal.email for testing
  if (process.env.NODE_ENV === 'development') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      logger.warn('Failed to create ethereal test account, emails will be logged only');
      return null;
    }
  }

  // In production, use configured SMTP settings
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  logger.warn('No SMTP configuration found, emails will be logged only');
  return null;
};

/**
 * Send verification email to user
 * @param {string} email - User email address
 * @param {string} token - Verification token
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    const apiVerificationUrl = `${config.backendUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"TRAINET" <noreply@trainet.com>',
      to: email,
      subject: 'Verify your TRAINET account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to TRAINET!</h2>
          <p>Thank you for registering. Please verify your email address to activate your account.</p>
          <p>Click the button below to verify your email:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            If you didn't create an account with TRAINET, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
Welcome to TRAINET!

Thank you for registering. Please verify your email address to activate your account.

Click the following link to verify your email:
${verificationUrl}

If you didn't create an account with TRAINET, you can safely ignore this email.
      `,
    };

    // In test environment, just log and return
    if (process.env.NODE_ENV === 'test') {
      logger.info(`[TEST MODE] Verification email would be sent to: ${email}`);
      logger.info(`[TEST MODE] Verification URL: ${verificationUrl}`);
      return;
    }

    const transporter = await createTransporter();

    if (!transporter) {
      // No transporter available, just log the verification URL
      logger.info(`Verification email for ${email}: ${verificationUrl}`);
      logger.info(`API verification URL: ${apiVerificationUrl}`);
      return;
    }

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Verification email sent to ${email}`);
    logger.info(`Message ID: ${info.messageId}`);

    // Log preview URL for ethereal.email
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error('Error sending verification email:', error);
    // Don't throw error - email sending failure shouldn't block signup
    // Just log the error and continue
  }
};

/**
 * Send password reset email
 * @param {string} email - User email address
 * @param {string} token - Password reset token
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"TRAINET" <noreply@trainet.com>',
      to: email,
      subject: 'Reset your TRAINET password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password for your TRAINET account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2196F3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            If you didn't request a password reset, you can safely ignore this email.
            This link will expire in 1 hour.
          </p>
        </div>
      `,
      text: `
Password Reset Request

We received a request to reset your password for your TRAINET account.

Click the following link to reset your password:
${resetUrl}

If you didn't request a password reset, you can safely ignore this email.
This link will expire in 1 hour.
      `,
    };

    // In test environment, just log and return
    if (process.env.NODE_ENV === 'test') {
      logger.info(`[TEST MODE] Password reset email would be sent to: ${email}`);
      return;
    }

    const transporter = await createTransporter();

    if (!transporter) {
      logger.info(`Password reset email for ${email}: ${resetUrl}`);
      return;
    }

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Password reset email sent to ${email}`);
    logger.info(`Message ID: ${info.messageId}`);

    if (process.env.NODE_ENV === 'development') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error('Error sending password reset email:', error);
  }
};
