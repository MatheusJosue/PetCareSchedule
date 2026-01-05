import { Resend } from 'resend'
import {
  appointmentConfirmationEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
  newAppointmentAdminEmail,
  type AppointmentConfirmationData,
  type AppointmentReminderData,
  type AppointmentCancellationData,
  type NewAppointmentAdminData
} from '../email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Pet Care Schedule <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'matheusjxcerqueira@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation(
  data: Omit<AppointmentConfirmationData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    const html = appointmentConfirmationEmail({
      ...data,
      appUrl: APP_URL
    })

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `Agendamento Confirmado - ${data.petName}`,
      html
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err) {
    console.error('Exception sending confirmation email:', err)
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
    const html = appointmentReminderEmail({
      ...data,
      appUrl: APP_URL
    })

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `Lembrete: Agendamento amanhã - ${data.petName}`,
      html
    })

    if (error) {
      console.error('Error sending reminder email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err) {
    console.error('Exception sending reminder email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment cancellation email
 */
export async function sendAppointmentCancellation(
  data: Omit<AppointmentCancellationData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    const html = appointmentCancellationEmail({
      ...data,
      appUrl: APP_URL
    })

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `Agendamento Cancelado - ${data.petName}`,
      html
    })

    if (error) {
      console.error('Error sending cancellation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err) {
    console.error('Exception sending cancellation email:', err)
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
    const html = newAppointmentAdminEmail({
      ...data,
      adminEmail: ADMIN_EMAIL,
      appUrl: APP_URL
    })

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Novo Agendamento - ${data.petName} (${data.clientName})`,
      html
    })

    if (error) {
      console.error('Error sending admin notification email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err) {
    console.error('Exception sending admin notification email:', err)
    return { success: false, error: 'Failed to send email' }
  }
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
