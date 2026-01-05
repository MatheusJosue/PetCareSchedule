import { baseEmailTemplate } from './base'

export interface WelcomeData {
  recipientName: string
  recipientEmail: string
  appUrl: string
}

export function welcomeEmail(data: WelcomeData): string {
  const { recipientName, appUrl } = data

  const content = `
    <p style="margin-bottom: 20px;">
      Bem-vindo ao <strong>Pet Care Schedule</strong>! 🐾
    </p>

    <p style="margin-bottom: 20px;">
      Seu cadastro foi realizado com sucesso. Agora você pode agendar serviços de cuidados para o seu pet de forma rápida e fácil.
    </p>

    <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(124, 58, 237, 0.1);">
      <h3 style="color: #7c3aed; font-size: 18px; margin: 0 0 16px 0;">O que você pode fazer agora:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #475569;">
        <li style="margin-bottom: 8px;">Cadastrar seus pets</li>
        <li style="margin-bottom: 8px;">Agendar banho, tosa e outros serviços</li>
        <li style="margin-bottom: 8px;">Acompanhar seus agendamentos</li>
        <li style="margin-bottom: 8px;">Gerenciar seus planos de assinatura</li>
      </ul>
    </div>

    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
      Clique no botão abaixo para acessar sua conta e começar a agendar!
    </p>
  `

  return baseEmailTemplate({
    recipientName,
    preheader: 'Bem-vindo ao Pet Care Schedule!',
    title: 'Cadastro Realizado com Sucesso! 🎉',
    content,
    ctaText: 'Acessar Minha Conta',
    ctaUrl: `${appUrl}/dashboard`,
    footerNote: 'Estamos aqui para cuidar do seu pet com muito carinho!'
  })
}
