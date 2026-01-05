import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendNewAppointmentToAdmin
} from '@/lib/services/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, appointmentId } = body

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        pet:pets(id, name),
        service:services(id, name),
        user:users(id, name, email, phone)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const emailData = {
      recipientName: appointment.user?.name || 'Cliente',
      recipientEmail: appointment.user?.email || user.email || '',
      petName: appointment.pet?.name || 'Pet',
      serviceName: appointment.service?.name || 'Serviço',
      scheduledDate: appointment.scheduled_date,
      scheduledTime: appointment.scheduled_time,
      appointmentId: appointment.id
    }

    let result

    switch (type) {
      case 'confirmation':
        result = await sendAppointmentConfirmation(emailData)
        break
      case 'cancellation':
        result = await sendAppointmentCancellation({
          ...emailData,
          cancelledBy: body.cancelledBy || 'client',
          reason: body.reason
        })
        break
      case 'new_appointment_admin':
        result = await sendNewAppointmentToAdmin({
          clientName: appointment.user?.name || 'Cliente',
          clientEmail: appointment.user?.email || '',
          clientPhone: appointment.user?.phone || null,
          petName: appointment.pet?.name || 'Pet',
          serviceName: appointment.service?.name || 'Serviço',
          scheduledDate: appointment.scheduled_date,
          scheduledTime: appointment.scheduled_time,
          appointmentId: appointment.id
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
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
