import { baseEmailTemplate, formatDate, formatTime } from './base'

export interface AppointmentReminderData {
  recipientName: string
  recipientEmail: string
  petName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  appointmentId: string
  appUrl: string
}

export function appointmentReminderEmail(data: AppointmentReminderData): string {
  const { recipientName, petName, serviceName, scheduledDate, scheduledTime, appUrl } = data

  const formattedDate = formatDate(scheduledDate)
  const formattedTime = formatTime(scheduledTime)

  const content = `
    <p style="margin-bottom: 20px;">
      Este é um lembrete amigável sobre o agendamento do seu pet para <strong>amanhã</strong>!
    </p>

    <div class="info-card">
      <div style="text-align: center; margin-bottom: 20px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto;">
          <circle cx="12" cy="12" r="10" stroke="#7c3aed" stroke-width="2"/>
          <path d="M12 6V12L16 14" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p style="color: #7c3aed; font-weight: 600; font-size: 18px; margin-top: 12px;">Amanhã!</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Pet</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${petName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Serviço</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${serviceName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Data</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${formattedDate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <span style="color: #64748b; font-size: 14px;">Horário</span><br>
            <span style="font-weight: 600; color: #7c3aed; font-size: 18px;">${formattedTime}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 16px; margin-top: 20px;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>Dica:</strong> Chegue com 5-10 minutos de antecedência para garantir um atendimento tranquilo.
      </p>
    </div>

    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
      Caso precise cancelar ou reagendar, faça isso com antecedência através do nosso sistema.
    </p>
  `

  return baseEmailTemplate({
    recipientName,
    preheader: `Lembrete: Amanhã às ${formattedTime} - ${serviceName} para ${petName}`,
    title: 'Lembrete de Agendamento',
    content,
    ctaText: 'Ver Detalhes',
    ctaUrl: `${appUrl}/appointments`,
    footerNote: 'Estamos esperando vocês!'
  })
}
