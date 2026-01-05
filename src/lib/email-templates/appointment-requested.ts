import { baseEmailTemplate, formatDate, formatTime } from './base'

export interface AppointmentRequestedData {
  recipientName: string
  recipientEmail: string
  petName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  appointmentId: string
  appUrl: string
}

export function appointmentRequestedEmail(data: AppointmentRequestedData): string {
  const { recipientName, petName, serviceName, scheduledDate, scheduledTime, appUrl } = data

  const formattedDate = formatDate(scheduledDate)
  const formattedTime = formatTime(scheduledTime)

  const content = `
    <p style="margin-bottom: 20px;">
      Seu agendamento foi <strong>solicitado com sucesso</strong>! 🎉
    </p>

    <p style="margin-bottom: 20px; color: #64748b;">
      Entraremos em contato em breve para confirmar a disponibilidade do horário.
    </p>

    <div class="info-card">
      <div style="text-align: center; margin-bottom: 16px;">
        <span class="status-badge status-pending" style="background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">
          Aguardando Confirmação
        </span>
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

    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
      Você receberá um email de confirmação assim que o horário for validado pela nossa equipe.
    </p>
  `

  return baseEmailTemplate({
    recipientName,
    preheader: `Agendamento solicitado para ${petName} - ${formattedDate} às ${formattedTime}`,
    title: 'Agendamento Solicitado! ⏰',
    content,
    ctaText: 'Ver Meus Agendamentos',
    ctaUrl: `${appUrl}/appointments`,
    footerNote: 'Entraremos em contato em breve com a confirmação!'
  })
}
