import { baseEmailTemplate, formatDate, formatTime } from './base'

export interface AppointmentCancellationData {
  recipientName: string
  recipientEmail: string
  petName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  cancelledBy: 'client' | 'admin'
  reason?: string
  appUrl: string
}

export function appointmentCancellationEmail(data: AppointmentCancellationData): string {
  const { recipientName, petName, serviceName, scheduledDate, scheduledTime, cancelledBy, reason, appUrl } = data

  const formattedDate = formatDate(scheduledDate)
  const formattedTime = formatTime(scheduledTime)

  const cancellationMessage = cancelledBy === 'admin'
    ? 'Infelizmente, precisamos informar que seu agendamento foi cancelado.'
    : 'Seu agendamento foi cancelado conforme solicitado.'

  const content = `
    <p style="margin-bottom: 20px;">
      ${cancellationMessage}
    </p>

    <div class="info-card" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(248, 113, 113, 0.08) 100%); border-color: rgba(239, 68, 68, 0.15);">
      <div style="text-align: center; margin-bottom: 16px;">
        <span class="status-badge status-cancelled">Cancelado</span>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Pet</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${petName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Serviço</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${serviceName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Data</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px; text-decoration: line-through;">${formattedDate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <span style="color: #64748b; font-size: 14px;">Horário</span><br>
            <span style="font-weight: 600; color: #ef4444; font-size: 18px; text-decoration: line-through;">${formattedTime}</span>
          </td>
        </tr>
      </table>
    </div>

    ${reason ? `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 20px;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        <strong>Motivo:</strong> ${reason}
      </p>
    </div>
    ` : ''}

    <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 16px; margin-top: 20px;">
      <p style="color: #065f46; font-size: 14px; margin: 0;">
        <strong>Quer reagendar?</strong> Acesse nosso sistema e escolha um novo horário que funcione melhor para você.
      </p>
    </div>
  `

  return baseEmailTemplate({
    recipientName,
    preheader: `Agendamento cancelado: ${serviceName} para ${petName} em ${formattedDate}`,
    title: 'Agendamento Cancelado',
    content,
    ctaText: 'Agendar Novo Horário',
    ctaUrl: `${appUrl}/appointments/new`,
    footerNote: 'Esperamos vê-los em breve!'
  })
}
