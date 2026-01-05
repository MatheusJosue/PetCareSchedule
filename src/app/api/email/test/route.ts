import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation
} from '@/lib/services/email'

/**
 * Test endpoint for email templates
 * Only works in development or when user is admin
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isDev = process.env.NODE_ENV === 'development'
    const isAdmin = userData?.role === 'admin'

    if (!isDev && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { type, email } = body

    const testEmail = email || user.email

    if (!testEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const testData = {
      recipientName: 'Teste',
      recipientEmail: testEmail,
      petName: 'Rex',
      serviceName: 'Banho Completo',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '14:00',
      appointmentId: 'test-123'
    }

    let result

    switch (type) {
      case 'confirmation':
        result = await sendAppointmentConfirmation(testData)
        break
      case 'reminder':
        result = await sendAppointmentReminder(testData)
        break
      case 'cancellation':
        result = await sendAppointmentCancellation({
          ...testData,
          cancelledBy: 'admin',
          reason: 'Motivo de teste'
        })
        break
      default:
        return NextResponse.json({
          error: 'Invalid type. Use: confirmation, reminder, or cancellation'
        }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent to ${testEmail}`,
      messageId: result.messageId
    })
  } catch (error) {
    console.error('Error in test email API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
