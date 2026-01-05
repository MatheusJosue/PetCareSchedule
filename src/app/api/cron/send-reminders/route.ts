import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAppointmentReminder } from '@/lib/services/email'

// Use service role key for cron jobs (runs server-side without user auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If no service key, use anon key (less secure but works for testing)
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Get appointments scheduled for tomorrow that are confirmed or pending
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        pet:pets(name),
        service:services(name),
        user:users(name, email)
      `)
      .eq('scheduled_date', tomorrowStr)
      .in('status', ['confirmed', 'pending'])

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments for tomorrow',
        sent: 0
      })
    }

    // Send reminder emails
    const results = await Promise.allSettled(
      appointments.map(async (apt) => {
        // Handle the case where relations might be arrays or single objects
        const pet = Array.isArray(apt.pet) ? apt.pet[0] : apt.pet
        const service = Array.isArray(apt.service) ? apt.service[0] : apt.service
        const user = Array.isArray(apt.user) ? apt.user[0] : apt.user

        if (!user?.email) {
          return { appointmentId: apt.id, skipped: true, reason: 'No email' }
        }

        const result = await sendAppointmentReminder({
          recipientName: user.name || 'Cliente',
          recipientEmail: user.email,
          petName: pet?.name || 'Pet',
          serviceName: service?.name || 'Serviço',
          scheduledDate: apt.scheduled_date,
          scheduledTime: apt.scheduled_time,
          appointmentId: apt.id
        })

        return { appointmentId: apt.id, ...result }
      })
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as { success?: boolean }).success
    ).length

    const failed = results.filter(
      (r) => r.status === 'rejected' || !(r.value as { success?: boolean }).success
    ).length

    return NextResponse.json({
      success: true,
      message: `Reminder emails sent`,
      total: appointments.length,
      sent: successful,
      failed,
      date: tomorrowStr
    })
  } catch (error) {
    console.error('Error in send-reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
