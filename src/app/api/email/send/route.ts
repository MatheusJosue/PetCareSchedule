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

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email API called')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('User authenticated:', !!user)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, appointmentId, email } = body

    console.log('Email request body:', { type, appointmentId, email })

    let result: { success: boolean; messageId?: string; error?: string } = {
      success: false,
      error: 'No email was sent'
    }

    // Handle welcome email (after registration)
    if (type === 'welcome') {
      console.log('Sending welcome email')
      result = await sendWelcomeEmail({
        recipientName: body.name || user.user_metadata?.name || 'Cliente',
        recipientEmail: email || user.email || ''
      })
    }

    // Get appointment details for appointment-related emails
    else if (type !== 'welcome') {
      console.log('Fetching appointment details for:', appointmentId)

      // Get appointment without joins first
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

      if (appointmentError || !appointment) {
        console.error('Appointment not found:', appointmentError)
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      console.log('Appointment found:', appointment.id)

      // Get related data separately
      const [{ data: pet }, { data: service }, { data: userData }] = await Promise.all([
        supabase.from('pets').select('id, name').eq('id', appointment.pet_id).single(),
        supabase.from('services').select('id, name').eq('id', appointment.service_id).single(),
        supabase.from('users').select('id, name, email, phone').eq('id', appointment.user_id).single()
      ])

      console.log('Related data:', { pet, service, userData })

      if (!pet || !service || !userData) {
        console.error('Missing related data:', { pet, service, userData })
        return NextResponse.json({ error: 'Missing appointment details' }, { status: 500 })
      }

      const clientEmailData = {
        recipientName: userData.name || 'Cliente',
        recipientEmail: userData.email || user.email || '',
        petName: pet.name || 'Pet',
        serviceName: service.name || 'Serviço',
        scheduledDate: appointment.scheduled_date,
        scheduledTime: appointment.scheduled_time,
        appointmentId: appointment.id
      }

      const adminEmailData = {
        clientName: userData.name || 'Cliente',
        clientEmail: userData.email || '',
        clientPhone: userData.phone || null,
        petName: pet.name || 'Pet',
        serviceName: service.name || 'Serviço',
        scheduledDate: appointment.scheduled_date,
        scheduledTime: appointment.scheduled_time,
        appointmentId: appointment.id
      }

      switch (type) {
        case 'requested':
          // Email to client when appointment is created
          console.log('Sending appointment requested email to:', clientEmailData.recipientEmail)
          result = await sendAppointmentRequested(clientEmailData)
          console.log('Client email result:', result)

          // Also notify admin
          console.log('Sending notification to admin:', ADMIN_EMAIL)
          const adminResult = await sendNewAppointmentToAdmin(adminEmailData)
          console.log('Admin email result:', adminResult)
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
