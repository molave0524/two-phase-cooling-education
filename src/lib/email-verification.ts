/**
 * Email Verification Utilities
 * Functions for sending verification and password reset emails
 */

import { sendEmail } from './email'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * Send email verification link
 */
export async function sendEmailVerification(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${BASE_URL}/api/account/verify-email?token=${token}`

  return sendEmail({
    to: email,
    subject: 'Verify Your New Email Address',
    template: 'support_response', // Using generic template
    data: {
      content: `
        <h2>Verify Your New Email Address</h2>
        <p>Please click the link below to verify your new email address:</p>
        <p><a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this change, please ignore this email.</p>
      `,
    },
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string
): Promise<boolean> {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`

  return sendEmail({
    to: email,
    subject: 'Reset Your Password',
    template: 'support_response',
    data: {
      content: `
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      `,
    },
  })
}

/**
 * Send email change notification to old email
 */
export async function sendEmailChangeNotification(
  oldEmail: string,
  newEmail: string
): Promise<boolean> {
  return sendEmail({
    to: oldEmail,
    subject: 'Email Change Request',
    template: 'support_response',
    data: {
      content: `
        <h2>Email Change Request</h2>
        <p>We received a request to change the email address for your account from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
        <p>If you made this request, no action is needed. A verification email has been sent to the new address.</p>
        <p>If you didn't request this change, please contact support immediately to secure your account.</p>
      `,
    },
  })
}
