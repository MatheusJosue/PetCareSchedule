import { baseEmailTemplate, formatDate, formatTime } from './base'

export interface AppointmentCancelledAdminData {
  adminEmail: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  petName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  cancelledBy: 'client' | 'admin'
  reason?: string
  appUrl: string
}

export function appointmentCancelledAdminEmail(data: AppointmentCancelledAdminData): string {
  const { clientName, clientEmail, clientPhone, petName, serviceName, scheduledDate, scheduledTime, cancelledBy, reason, appUrl } = data

  const formattedDate = formatDate(scheduledDate)
  const formattedTime = formatTime(scheduledTime)

  const content = `
    <p style="margin-bottom: 20px;">
      Um agendamento foi <strong>cancelado</strong>.
    </p>

    <div style="background: rgba(239, 68, 68, 0.05); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(239, 68, 68, 0.2);">
      <h3 style="color: #dc2626; font-size: 16px; margin: 0 0 12px 0;">❌ Agendamento Cancelado</h3>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Cancelado por: <strong>${cancelledBy === 'client' ? 'Cliente' : 'Administrador'}</strong>
      </p>
      ${reason ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">Motivo: ${reason}</p>` : ''}
    </div>

    <div class="info-card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Cliente</span><br>
            <span style="font-weight: 600; color: #0f172a; font-size: 15px;">${clientName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Email</span><br>
            <a href="mailto:${clientEmail}" style="color: #7c3aed; text-decoration: none;">${clientEmail}</a>
          </td>
        </tr>
        ${clientPhone ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(124, 58, 237, 0.1);">
            <span style="color: #64748b; font-size: 14px;">Telefone</span><br>
            <a href="tel:${clientPhone}" style="color: #7c3aed; text-decoration: none;">${clientPhone}</a>
          </td>
        </tr>` : ''}
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
      Este horário agora está disponível para novos agendamentos.
    </p>
  `

  return baseEmailTemplate({
    recipientName: 'Administrador',
    preheader: `Agendamento cancelado - ${petName} (${clientName})`,
    title: 'Agendamento Cancelado ❌',
    content,
    ctaText: 'Ver Agenda',
    ctaUrl: `${appUrl}/admin/appointments`,
    footerNote: 'O horário foi liberado para novos agendamentos'
  })
}
