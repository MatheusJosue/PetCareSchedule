import { baseEmailTemplate, formatDate, formatTime } from './base'

export interface NewAppointmentAdminData {
  adminEmail: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  petName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  appointmentId: string
  appUrl: string
}

export function newAppointmentAdminEmail(data: NewAppointmentAdminData): string {
  const { clientName, clientEmail, clientPhone, petName, serviceName, scheduledDate, scheduledTime, appUrl } = data

  const formattedDate = formatDate(scheduledDate)
  const formattedTime = formatTime(scheduledTime)

  const content = `
    <p style="margin-bottom: 20px;">
      Um novo agendamento foi solicitado e aguarda sua confirmação.
    </p>

    <div class="info-card">
      <div style="text-align: center; margin-bottom: 16px;">
        <span class="status-badge status-pending">Aguardando Confirmação</span>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Cliente</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${clientName}</span><br>
            <span style="color: #64748b; font-size: 13px;">${clientEmail}</span>
            ${clientPhone ? `<br><span style="color: #64748b; font-size: 13px;">${clientPhone}</span>` : ''}
          </td>
        </tr>
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
            <span style="font-weight: 600; color: #f59e0b; font-size: 18px;">${formattedTime}</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
      Acesse o painel administrativo para confirmar ou recusar este agendamento.
    </p>
  `

  return baseEmailTemplate({
    recipientName: 'Admin',
    preheader: `Novo agendamento: ${petName} - ${serviceName} em ${formattedDate}`,
    title: 'Novo Agendamento Solicitado',
    content,
    ctaText: 'Ver Agendamentos',
    ctaUrl: `${appUrl}/admin/appointments`,
    footerNote: 'Confirme o agendamento o mais rápido possível.'
  })
}
