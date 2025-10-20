/**
 * Email Notification System
 * Handles automated email notifications for orders and customer communication
 */

import { Order, OrderStatus } from './orders'
import { logger } from '@/lib/logger'
import { DEFAULTS, COMPANY_CONTACTS } from '@/constants/defaults'

// Email template types
export type EmailTemplate =
  | 'order_confirmation'
  | 'payment_confirmation'
  | 'payment_failed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_refunded'
  | 'support_response'

export interface EmailData {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
}

export interface OrderConfirmationData {
  order: Order
  customerName: string
  estimatedDelivery: string
  supportEmail: string
  trackingUrl?: string
}

// Email service configuration
const EMAIL_CONFIG = {
  from: process.env.FROM_EMAIL || COMPANY_CONTACTS.CONTACT_EMAIL,
  supportEmail: process.env.SUPPORT_EMAIL || COMPANY_CONTACTS.SUPPORT_EMAIL,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || DEFAULTS.APP_URL,
  // In production, you would configure AWS SES, SendGrid, etc.
  provider: process.env.EMAIL_PROVIDER || 'console', // 'ses' | 'sendgrid' | 'console'
}

// Order confirmation email template
export function generateOrderConfirmationEmail(data: OrderConfirmationData): string {
  const { order, customerName, estimatedDelivery, supportEmail, trackingUrl } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Confirmation</h1>
        <p>Thank you for your purchase!</p>
    </div>

    <div class="content">
        <p>Hi ${customerName},</p>

        <p>We've received your order and are preparing it for shipment. Your order details are below:</p>

        <div class="order-details">
            <h3>Order #${order.orderNumber}</h3>
            <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
            <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
            ${order.status === 'shipped' && trackingUrl ? `<p><strong>Tracking:</strong> <a href="${trackingUrl}">Track your package</a></p>` : ''}
        </div>

        <h3>Items Ordered:</h3>
        ${order.items
          .map(
            item => `
            <div class="item-row">
                <div>
                    <strong>${item.product.name}</strong><br>
                    <small>Quantity: ${item.quantity}</small>
                </div>
                <div>$${item.totalPrice.toFixed(2)}</div>
            </div>
        `
          )
          .join('')}

        <div class="total-row">
            <div>Subtotal:</div>
            <div>$${order.totals.subtotal.toFixed(2)}</div>
        </div>
        <div class="total-row">
            <div>Shipping:</div>
            <div>$${order.totals.shipping.toFixed(2)}</div>
        </div>
        <div class="total-row">
            <div>Tax:</div>
            <div>$${order.totals.tax.toFixed(2)}</div>
        </div>
        ${
          order.totals.discount > 0
            ? `
            <div class="total-row" style="color: #059669;">
                <div>Discount:</div>
                <div>-$${order.totals.discount.toFixed(2)}</div>
            </div>
        `
            : ''
        }
        <div class="total-row" style="font-size: 18px; border-top: 2px solid #374151; margin-top: 10px; padding-top: 10px;">
            <div>Total:</div>
            <div>$${order.totals.total.toFixed(2)}</div>
        </div>

        <h3>Shipping Address:</h3>
        <p>
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.company ? `${order.shippingAddress.company}<br>` : ''}
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}/orders/${order.id}" class="button">View Order Details</a>
        </div>

        ${
          !order.userId
            ? `
        <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #1e40af;">Create an Account to Track Your Order</h3>
            <p>Track your shipment, view order history, and manage your information by creating an account.</p>
            <a href="${EMAIL_CONFIG.baseUrl}/auth/signup?email=${encodeURIComponent(order.customer.email)}" class="button">Create Account</a>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                Already have an account? <a href="${EMAIL_CONFIG.baseUrl}/auth/signin?callbackUrl=${encodeURIComponent(`/orders/${order.id}`)}">Sign in</a>
            </p>
        </div>
        `
            : ''
        }

        <h3>What's Next?</h3>
        <ul>
            <li>We'll send you shipping confirmation with tracking information</li>
            <li>Your two-phase cooling system will be carefully packaged for safe delivery</li>
            <li>Installation guides and support resources will be included</li>
        </ul>

        <p>If you have any questions about your order, please contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

        <p>Thank you for choosing Two-Phase Cooling!</p>
    </div>

    <div class="footer">
        <p>Two-Phase Cooling Systems<br>
        Revolutionary PC Cooling Technology</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
</body>
</html>
  `.trim()
}

// Shipping notification email template
export function generateShippingNotificationEmail(
  order: Order,
  trackingNumber: string,
  trackingUrl: string
): string {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Order Has Shipped - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .tracking-box { background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚚 Your Order Has Shipped!</h1>
        <p>Order #${order.orderNumber}</p>
    </div>

    <div class="content">
        <p>Hi ${customerName},</p>

        <p>Great news! Your Two-Phase Cooling system has been shipped and is on its way to you.</p>

        <div class="tracking-box">
            <h3>Tracking Information</h3>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Carrier:</strong> ${order.tracking?.carrier}</p>
            <p><strong>Estimated Delivery:</strong> ${order.tracking?.estimatedDelivery?.toLocaleDateString() || 'TBD'}</p>
            <a href="${trackingUrl}" class="button">Track Your Package</a>
        </div>

        <h3>What to Expect:</h3>
        <ul>
            <li>Your package is carefully protected with premium packaging materials</li>
            <li>Installation guide and quick start instructions are included</li>
            <li>All necessary mounting hardware is provided</li>
            <li>Pre-filled with Novec 7000 cooling fluid (no assembly required)</li>
        </ul>

        <h3>Delivery Address:</h3>
        <p>
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.company ? `${order.shippingAddress.company}<br>` : ''}
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
        </p>

        <p>Once your order arrives, you can find installation videos and support resources in our <a href="${EMAIL_CONFIG.baseUrl}/education">Education Center</a>.</p>

        <p>If you have any questions or need assistance, please contact us at <a href="mailto:${EMAIL_CONFIG.supportEmail}">${EMAIL_CONFIG.supportEmail}</a>.</p>
    </div>

    <div class="footer">
        <p>Two-Phase Cooling Systems<br>
        Revolutionary PC Cooling Technology</p>
    </div>
</body>
</html>
  `.trim()
}

// Email sending function (implementation depends on provider)
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  logger.info('Sending email', { template: emailData.template, to: emailData.to })

  try {
    switch (EMAIL_CONFIG.provider) {
      case 'console':
        // Development/testing mode - just log the email
        logger.debug('Email preview', {
          to: emailData.to,
          subject: emailData.subject,
          htmlContent: emailData.data.htmlContent || emailData.data,
        })
        return true

      case 'ses':
        // AWS SES implementation would go here
        throw new Error('AWS SES not implemented yet')

      case 'sendgrid':
        // SendGrid implementation would go here
        throw new Error('SendGrid not implemented yet')

      default:
        throw new Error(`Unknown email provider: ${EMAIL_CONFIG.provider}`)
    }
  } catch (error) {
    logger.error('Failed to send email', error, { template: emailData.template, to: emailData.to })
    return false
  }
}

// Order-specific email functions
export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`
  const estimatedDelivery =
    order.tracking?.estimatedDelivery?.toLocaleDateString() || '5-7 business days'

  const htmlContent = generateOrderConfirmationEmail({
    order,
    customerName,
    estimatedDelivery,
    supportEmail: EMAIL_CONFIG.supportEmail,
    trackingUrl: order.tracking?.trackingUrl || '',
  })

  return await sendEmail({
    to: order.customer.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    template: 'order_confirmation',
    data: {
      order,
      customerName,
      htmlContent,
    },
  })
}

export async function sendShippingNotificationEmail(order: Order): Promise<boolean> {
  if (!order.tracking) {
    logger.error('Cannot send shipping notification - no tracking information available', null, {
      orderNumber: order.orderNumber,
    })
    return false
  }

  const htmlContent = generateShippingNotificationEmail(
    order,
    order.tracking.trackingNumber,
    order.tracking.trackingUrl
  )

  return await sendEmail({
    to: order.customer.email,
    subject: `Your Order Has Shipped - ${order.orderNumber}`,
    template: 'order_shipped',
    data: {
      order,
      tracking: order.tracking,
      htmlContent,
    },
  })
}

export async function sendOrderStatusUpdateEmail(
  order: Order,
  previousStatus: OrderStatus
): Promise<boolean> {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`

  let subject = `Order Update - ${order.orderNumber}`
  let template: EmailTemplate = 'support_response'

  switch (order.status) {
    case 'shipped':
      return await sendShippingNotificationEmail(order)

    case 'delivered':
      subject = `Order Delivered - ${order.orderNumber}`
      template = 'order_delivered'
      break

    case 'cancelled':
      subject = `Order Cancelled - ${order.orderNumber}`
      template = 'order_cancelled'
      break
  }

  return await sendEmail({
    to: order.customer.email,
    subject,
    template,
    data: {
      order,
      customerName,
      previousStatus,
      currentStatus: order.status,
    },
  })
}

// Payment failed email template
export function generatePaymentFailedEmail(order: Order, reason?: string): string {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-box { background: #fef2f2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Payment Issue</h1>
        <p>Order #${order.orderNumber}</p>
    </div>

    <div class="content">
        <p>Hi ${customerName},</p>

        <p>We were unable to process your payment for order #${order.orderNumber}.</p>

        <div class="alert-box">
            <h3 style="margin-top: 0; color: #991b1b;">Payment Failed</h3>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>Your order is currently on hold and will be cancelled if payment is not received within 24 hours.</p>
        </div>

        <h3>What You Can Do:</h3>
        <ul>
            <li><strong>Update Payment Method:</strong> Try a different card or payment method</li>
            <li><strong>Check Card Details:</strong> Ensure billing address and card information are correct</li>
            <li><strong>Contact Your Bank:</strong> Verify there are no holds or restrictions on your card</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}/orders/${order.id}/payment" class="button">Update Payment Method</a>
        </div>

        <p>If you continue to experience issues or need assistance, please contact our support team at <a href="mailto:${EMAIL_CONFIG.supportEmail}">${EMAIL_CONFIG.supportEmail}</a>.</p>

        <p><strong>Order Summary:</strong></p>
        <p>Total Amount: $${order.totals.total.toFixed(2)}</p>
    </div>

    <div class="footer">
        <p>Two-Phase Cooling Systems<br>
        Revolutionary PC Cooling Technology</p>
    </div>
</body>
</html>
  `.trim()
}

// Refund confirmation email template
export function generateRefundEmail(order: Order, refundAmount: number, reason?: string): string {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Processed - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .refund-box { background: #ecfeff; border: 1px solid: #06b6d4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Refund Processed</h1>
        <p>Order #${order.orderNumber}</p>
    </div>

    <div class="content">
        <p>Hi ${customerName},</p>

        <p>Your refund has been processed successfully.</p>

        <div class="refund-box">
            <h3 style="margin-top: 0; color: #0e7490;">Refund Amount</h3>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #0891b2;">$${refundAmount.toFixed(2)}</p>
            <p>The refund will be credited to your original payment method within 5-10 business days.</p>
        </div>

        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

        <h3>What to Expect:</h3>
        <ul>
            <li>Refund will appear on your statement within 5-10 business days</li>
            <li>The refund will be applied to the original payment method</li>
            <li>You will receive a confirmation from your bank once processed</li>
        </ul>

        <p>If you have any questions about this refund or need further assistance, please contact our support team at <a href="mailto:${EMAIL_CONFIG.supportEmail}">${EMAIL_CONFIG.supportEmail}</a>.</p>

        <p>We appreciate your business and hope to serve you again in the future.</p>
    </div>

    <div class="footer">
        <p>Two-Phase Cooling Systems<br>
        Revolutionary PC Cooling Technology</p>
    </div>
</body>
</html>
  `.trim()
}

// Send payment failed email
export async function sendPaymentFailedEmail(order: Order, reason?: string): Promise<boolean> {
  const htmlContent = generatePaymentFailedEmail(order, reason)

  return await sendEmail({
    to: order.customer.email,
    subject: `Payment Failed - Order ${order.orderNumber}`,
    template: 'payment_failed',
    data: {
      order,
      reason,
      htmlContent,
    },
  })
}

// Send refund confirmation email
export async function sendRefundEmail(
  order: Order,
  refundAmount: number,
  reason?: string
): Promise<boolean> {
  const htmlContent = generateRefundEmail(order, refundAmount, reason)

  return await sendEmail({
    to: order.customer.email,
    subject: `Refund Processed - Order ${order.orderNumber}`,
    template: 'order_refunded',
    data: {
      order,
      refundAmount,
      reason,
      htmlContent,
    },
  })
}

// Utility function to validate email configuration
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!EMAIL_CONFIG.from) {
    errors.push('FROM_EMAIL environment variable not set')
  }

  if (!EMAIL_CONFIG.supportEmail) {
    errors.push('SUPPORT_EMAIL environment variable not set')
  }

  if (!EMAIL_CONFIG.baseUrl) {
    errors.push('NEXT_PUBLIC_BASE_URL environment variable not set')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
