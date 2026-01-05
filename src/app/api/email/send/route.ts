import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendWelcomeEmail,
  sendAppointmentRequested,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendNewAppointmentToAdmin,
  sendAppointmentCancelledToAdmin
} from '@/lib/services/email'

// Type definitions for appointment query with joins
type AppointmentWithRelations = {
  id: string
  scheduled_date: string
  scheduled_time: string
  pet: { id: string; name: string } | null
  service: { id: string; name: string } | null
  user: { id: string; name: string | null; email: string; phone: string | null } | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, appointmentId, email } = body

    let result: { success: boolean; messageId?: string; error?: string } = {
      success: false,
      error: 'No email was sent'
    }

    // Handle welcome email (after registration)
    if (type === 'welcome') {
      result = await sendWelcomeEmail({
        recipientName: body.name || user.user_metadata?.name || 'Cliente',
        recipientEmail: email || user.email || ''
      })
    }

    // Get appointment details for appointment-related emails
    else if (type !== 'welcome') {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          pet:pets(id, name),
          service:services(id, name),
          user:users(id, name, email, phone)
        `)
        .eq('id', appointmentId)
        .single() as { data: AppointmentWithRelations | null; error: any }

      if (appointmentError || !appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      const clientEmailData = {
        recipientName: appointment.user?.name || 'Cliente',
        recipientEmail: appointment.user?.email || user.email || '',
        petName: appointment.pet?.name || 'Pet',
        serviceName: appointment.service?.name || 'Serviço',
        scheduledDate: appointment.scheduled_date,
        scheduledTime: appointment.scheduled_time,
        appointmentId: appointment.id
      }

      const adminEmailData = {
        clientName: appointment.user?.name || 'Cliente',
        clientEmail: appointment.user?.email || '',
        clientPhone: appointment.user?.phone || null,
        petName: appointment.pet?.name || 'Pet',
        serviceName: appointment.service?.name || 'Serviço',
        scheduledDate: appointment.scheduled_date,
        scheduledTime: appointment.scheduled_time,
        appointmentId: appointment.id
      }

      switch (type) {
        case 'requested':
          // Email to client when appointment is created
          result = await sendAppointmentRequested(clientEmailData)
          // Also notify admin
          await sendNewAppointmentToAdmin(adminEmailData)
          break

        case 'confirmation':
          // Email to client when admin confirms appointment
          result = await sendAppointmentConfirmation(clientEmailData)
          break

        case 'cancellation':
          // Email to client when appointment is cancelled
          result = await sendAppointmentCancellation({
            ...clientEmailData,
            cancelledBy: body.cancelledBy || 'client',
            reason: body.reason
          })
          // Also notify admin about cancellation
          await sendAppointmentCancelledToAdmin({
            ...adminEmailData,
            cancelledBy: body.cancelledBy || 'client',
            reason: body.reason
          })
          break

        case 'new_appointment_admin':
          // Email to admin when client creates appointment
          result = await sendNewAppointmentToAdmin(adminEmailData)
          break

        case 'cancelled_admin':
          // Email to admin when appointment is cancelled
          result = await sendAppointmentCancelledToAdmin({
            ...adminEmailData,
            cancelledBy: body.cancelledBy || 'client',
            reason: body.reason
          })
          break

        default:
          return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
      }
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
