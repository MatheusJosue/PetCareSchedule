import Courier from '@trycourier/courier'
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

const courier = new Courier({ apiKey: process.env.COURIER_API_KEY })

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'matheusjxcerqueira@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Log configuration
console.log('📧 Email service initialized:', {
  hasApiKey: !!process.env.COURIER_API_KEY,
  apiKeyPrefix: process.env.COURIER_API_KEY?.substring(0, 10),
  adminEmail: ADMIN_EMAIL,
  appUrl: APP_URL
})

// ID do template no Courier - você precisa criar estes templates no dashboard do Courier
const TEMPLATE_IDS = {
  welcome: process.env.COURIER_TEMPLATE_WELCOME || '',
  appointmentRequested: process.env.COURIER_TEMPLATE_APPOINTMENT_REQUESTED || '',
  appointmentConfirmed: process.env.COURIER_TEMPLATE_APPOINTMENT_CONFIRMED || '',
  appointmentReminder: process.env.COURIER_TEMPLATE_APPOINTMENT_REMINDER || '',
  appointmentCancelled: process.env.COURIER_TEMPLATE_APPOINTMENT_CANCELLED || '',
  newAppointmentAdmin: process.env.COURIER_TEMPLATE_NEW_APPOINTMENT_ADMIN || '',
  appointmentCancelledAdmin: process.env.COURIER_TEMPLATE_APPOINTMENT_CANCELLED_ADMIN || '',
}

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
    // Se não tiver template configurado no Courier, usa HTML direto
    if (!TEMPLATE_IDS.welcome) {
      return await sendEmailDirect({
        to: data.recipientEmail,
        subject: 'Bem-vindo ao Pet Care Schedule! 🐾',
        html: welcomeEmail({ ...data, appUrl: APP_URL })
      })
    }

    const { requestId } = await courier.send.message({
      message: {
        to: { email: data.recipientEmail },
        template: TEMPLATE_IDS.welcome,
        data: {
          recipientName: data.recipientName,
          appUrl: APP_URL
        }
      }
    })

    return { success: true, messageId: requestId }
  } catch (err) {
    console.error('Exception sending welcome email:', err)
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
    console.log('📧 Template ID:', TEMPLATE_IDS.appointmentRequested || 'none (using direct email)')

    if (!TEMPLATE_IDS.appointmentRequested) {
      console.log('📧 Using direct email (no template)')
      const result = await sendEmailDirect({
        to: data.recipientEmail,
        subject: `Agendamento Solicitado - ${data.petName}`,
        html: appointmentRequestedEmail({ ...data, appUrl: APP_URL })
      })
      console.log('📧 Direct email result:', result)
      return result
    }

    console.log('📧 Using Courier template:', TEMPLATE_IDS.appointmentRequested)
    const { requestId } = await courier.send.message({
      message: {
        to: { email: data.recipientEmail },
        template: TEMPLATE_IDS.appointmentRequested,
        data: {
          recipientName: data.recipientName,
          petName: data.petName,
          serviceName: data.serviceName,
          formattedDate: new Date(data.scheduledDate).toLocaleDateString('pt-BR'),
          formattedTime: data.scheduledTime,
          appUrl: APP_URL
        }
      }
    })

    console.log('📧 Courier message sent successfully, requestId:', requestId)
    return { success: true, messageId: requestId }
  } catch (err) {
    console.error('❌ Exception sending appointment requested email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment confirmation email (when admin confirms)
 */
export async function sendAppointmentConfirmation(
  data: Omit<AppointmentConfirmationData, 'appUrl'>
): Promise<SendEmailResult> {
  try {
    if (!TEMPLATE_IDS.appointmentConfirmed) {
      return await sendEmailDirect({
        to: data.recipientEmail,
        subject: `Agendamento Confirmado - ${data.petName}`,
        html: appointmentConfirmationEmail({ ...data, appUrl: APP_URL })
      })
    }

    const { requestId } = await courier.send.message({
      message: {
        to: { email: data.recipientEmail },
        template: TEMPLATE_IDS.appointmentConfirmed,
        data: {
          recipientName: data.recipientName,
          petName: data.petName,
          serviceName: data.serviceName,
          formattedDate: new Date(data.scheduledDate).toLocaleDateString('pt-BR'),
          formattedTime: data.scheduledTime,
          appUrl: APP_URL
        }
      }
    })

    return { success: true, messageId: requestId }
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
    if (!TEMPLATE_IDS.appointmentReminder) {
      return await sendEmailDirect({
        to: data.recipientEmail,
        subject: `Lembrete: Agendamento amanhã - ${data.petName}`,
        html: appointmentReminderEmail({ ...data, appUrl: APP_URL })
      })
    }

    const { requestId } = await courier.send.message({
      message: {
        to: { email: data.recipientEmail },
        template: TEMPLATE_IDS.appointmentReminder,
        data: {
          recipientName: data.recipientName,
          petName: data.petName,
          serviceName: data.serviceName,
          formattedDate: new Date(data.scheduledDate).toLocaleDateString('pt-BR'),
          formattedTime: data.scheduledTime,
          appUrl: APP_URL
        }
      }
    })

    return { success: true, messageId: requestId }
  } catch (err) {
    console.error('Exception sending reminder email:', err)
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
    if (!TEMPLATE_IDS.appointmentCancelled) {
      return await sendEmailDirect({
        to: data.recipientEmail,
        subject: `Agendamento Cancelado - ${data.petName}`,
        html: appointmentCancellationEmail({
          ...data,
          appUrl: APP_URL
        })
      })
    }

    const { requestId } = await courier.send.message({
      message: {
        to: { email: data.recipientEmail },
        template: TEMPLATE_IDS.appointmentCancelled,
        data: {
          recipientName: data.recipientName,
          petName: data.petName,
          serviceName: data.serviceName,
          cancelledBy: data.cancelledBy,
          reason: data.reason,
          appUrl: APP_URL
        }
      }
    })

    return { success: true, messageId: requestId }
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
    if (!TEMPLATE_IDS.newAppointmentAdmin) {
      return await sendEmailDirect({
        to: ADMIN_EMAIL,
        subject: `Novo Agendamento - ${data.petName} (${data.clientName})`,
        html: newAppointmentAdminEmail({
          ...data,
          adminEmail: ADMIN_EMAIL,
          appUrl: APP_URL
        })
      })
    }

    const { requestId } = await courier.send.message({
      message: {
        to: { email: ADMIN_EMAIL },
        template: TEMPLATE_IDS.newAppointmentAdmin,
        data: {
          adminName: 'Administrador',
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          petName: data.petName,
          serviceName: data.serviceName,
          formattedDate: new Date(data.scheduledDate).toLocaleDateString('pt-BR'),
          formattedTime: data.scheduledTime,
          appUrl: APP_URL
        }
      }
    })

    return { success: true, messageId: requestId }
  } catch (err) {
    console.error('Exception sending admin notification email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment cancellation notification to admin
 */
export async function sendAppointmentCancelledToAdmin(
  data: Omit<AppointmentCancelledAdminData, 'appUrl' | 'adminEmail'>
): Promise<SendEmailResult> {
  try {
    if (!TEMPLATE_IDS.appointmentCancelledAdmin) {
      return await sendEmailDirect({
        to: ADMIN_EMAIL,
        subject: `Agendamento Cancelado - ${data.petName} (${data.clientName})`,
        html: appointmentCancelledAdminEmail({
          ...data,
          adminEmail: ADMIN_EMAIL,
          appUrl: APP_URL
        })
      })
    }

    const { requestId } = await courier.send.message({
      message: {
        to: { email: ADMIN_EMAIL },
        template: TEMPLATE_IDS.appointmentCancelledAdmin,
        data: {
          adminName: 'Administrador',
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          petName: data.petName,
          serviceName: data.serviceName,
          cancelledBy: data.cancelledBy,
          reason: data.reason,
          formattedDate: new Date(data.scheduledDate).toLocaleDateString('pt-BR'),
          formattedTime: data.scheduledTime,
          appUrl: APP_URL
        }
      }
    })

    return { success: true, messageId: requestId }
  } catch (err) {
    console.error('Exception sending cancellation notification to admin:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Função auxiliar para enviar email diretamente (sem template Courier)
 * Usa o Courier API com conteúdo inline
 */
async function sendEmailDirect({ to, subject, html }: { to: string; subject: string; html: string }): Promise<SendEmailResult> {
  try {
    const { requestId } = await courier.send.message({
      message: {
        to: { email: to },
        content: {
          title: subject,
          body: html
        }
      }
    })

    return { success: true, messageId: requestId }
  } catch (error) {
    console.error('Error sending email directly:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
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
