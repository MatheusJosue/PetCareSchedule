import {
  appointmentConfirmationEmail,
  appointmentRequestedEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
  newAppointmentAdminEmail,
  welcomeEmail,
  appointmentCancelledAdminEmail,
  type AppointmentConfirmationData,
  type AppointmentRequestedData,
  type AppointmentReminderData,
  type AppointmentCancellationData,
  type NewAppointmentAdminData,
  type WelcomeData,
  type AppointmentCancelledAdminData
} from '../email-templates'
import { TransactionalEmailsApi } from '@getbrevo/brevo'

// Initialize Brevo API
const apiInstance = new TransactionalEmailsApi()

// Configure API key
apiInstance.setApiKey(
  0,
  process.env.BREVO_API_KEY || ''
)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'matheusjx@hotmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@petcareschedule.com'
const FROM_NAME = process.env.BREVO_FROM_NAME || 'Pet Care Schedule'

// Log configuration
console.log('📧 Email service initialized (Brevo):', {
  hasApiKey: !!process.env.BREVO_API_KEY,
  adminEmail: ADMIN_EMAIL,
  fromEmail: FROM_EMAIL,
  fromName: FROM_NAME,
  appUrl: APP_URL
})

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail(
  data: Omit<WelcomeData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending welcome email to:', data.recipientEmail)

    const htmlContent = welcomeEmail({ ...data, appUrl: APP_URL })

    const response = await apiInstance.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: data.recipientEmail }],
      subject: 'Bem-vindo ao Pet Care Schedule! 🐾',
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any)

    console.log('✅ Welcome email sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending welcome email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment requested email (when client creates appointment)
 */
export async function sendAppointmentRequested(
  data: Omit<AppointmentRequestedData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending appointment requested email to:', data.recipientEmail)
    console.log('📧 From:', FROM_EMAIL, FROM_NAME)

    const htmlContent = appointmentRequestedEmail({ ...data, appUrl: APP_URL })

    const emailData = {
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: data.recipientEmail }],
      subject: `Agendamento Solicitado - ${data.petName}`,
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any

    console.log('📧 Sending email with data:', JSON.stringify(emailData, null, 2))

    const response = await apiInstance.sendTransacEmail(emailData)

    console.log('📧 Brevo response:', response)
    console.log('✅ Appointment requested email sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending appointment requested email:', err)
    console.error('❌ Error details:', JSON.stringify(err, null, 2))

    // Extract more detailed error info
    const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
    const errorDetails = (err as any).response?.body || (err as any).response?.data

    console.error('❌ Brevo error details:', errorDetails)

    return {
      success: false,
      error: errorMessage + (errorDetails ? `: ${JSON.stringify(errorDetails)}` : '')
    }
  }
}

/**
 * Send appointment confirmation email (when admin confirms)
 */
export async function sendAppointmentConfirmation(
  data: Omit<AppointmentConfirmationData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending appointment confirmation email to:', data.recipientEmail)

    const htmlContent = appointmentConfirmationEmail({ ...data, appUrl: APP_URL })

    const response = await apiInstance.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: data.recipientEmail }],
      subject: `Agendamento Confirmado - ${data.petName}`,
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any)

    console.log('✅ Confirmation email sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment reminder email (24h before)
 */
export async function sendAppointmentReminder(
  data: Omit<AppointmentReminderData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending appointment reminder email to:', data.recipientEmail)

    const htmlContent = appointmentReminderEmail({ ...data, appUrl: APP_URL })

    const response = await apiInstance.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: data.recipientEmail }],
      subject: `Lembrete: Agendamento amanhã - ${data.petName}`,
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any);

    console.log('✅ Reminder email sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending reminder email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment cancellation email (to client)
 */
export async function sendAppointmentCancellation(
  data: Omit<AppointmentCancellationData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending appointment cancellation email to:', data.recipientEmail)

    const htmlContent = appointmentCancellationEmail({
      ...data,
      appUrl: APP_URL
    })

    const response = await apiInstance.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: data.recipientEmail }],
      subject: `Agendamento Cancelado - ${data.petName}`,
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any)

    console.log('✅ Cancellation email sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending cancellation email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send new appointment notification to admin
 */
export async function sendNewAppointmentToAdmin(
  data: Omit<NewAppointmentAdminData, 'appUrl' | 'adminEmail'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending new appointment notification to admin:', ADMIN_EMAIL)
    console.log('📧 From:', FROM_EMAIL, FROM_NAME)

    const htmlContent = newAppointmentAdminEmail({
      ...data,
      adminEmail: ADMIN_EMAIL,
      appUrl: APP_URL
    })

    const emailData = {
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: ADMIN_EMAIL }],
      subject: `Novo Agendamento - ${data.petName} (${data.clientName})`,
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any

    console.log('📧 Sending admin email with data:', JSON.stringify(emailData, null, 2))

    const response = await apiInstance.sendTransacEmail(emailData)

    console.log('📧 Brevo response:', response)
    console.log('✅ Admin notification sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending admin notification:', err)
    console.error('❌ Error details:', JSON.stringify(err, null, 2))

    const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
    const errorDetails = (err as any).response?.body || (err as any).response?.data

    console.error('❌ Brevo error details:', errorDetails)

    return {
      success: false,
      error: errorMessage + (errorDetails ? `: ${JSON.stringify(errorDetails)}` : '')
    }
  }
}

/**
 * Send appointment cancellation notification to admin
 */
export async function sendAppointmentCancelledToAdmin(
  data: Omit<AppointmentCancelledAdminData, 'appUrl' | 'adminEmail'>
): Promise<SendEmailResult> {
  try {
    console.log('📧 Sending cancellation notification to admin:', ADMIN_EMAIL)

    const htmlContent = appointmentCancelledAdminEmail({
      ...data,
      adminEmail: ADMIN_EMAIL,
      appUrl: APP_URL
    })

    const response = await apiInstance.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: ADMIN_EMAIL }],
      subject: `Agendamento Cancelado - ${data.petName} (${data.clientName})`,
      htmlContent,
      textContent: stripHtml(htmlContent),
      params: {
        trackingClicks: false
      }
    } as any)

    console.log('✅ Admin cancellation notification sent, messageId:', response.body?.messageId)
    return { success: true, messageId: response.body?.messageId?.toString() }
  } catch (err) {
    console.error('❌ Error sending admin cancellation notification:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Helper function to strip HTML tags
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get appointments scheduled for tomorrow (for reminder cron job)
 */
export async function getAppointmentsForTomorrow(): Promise<{
  appointmentId: string
  recipientName: string
  recipientEmail: string
  petName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
}[]> {
  // This would typically be called from a cron job or edge function
  // Implementation depends on your cron setup (Vercel Cron, Supabase Edge Functions, etc.)
  // For now, return empty array - implement with your preferred cron solution
  return []
}
