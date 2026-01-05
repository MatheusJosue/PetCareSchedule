// Base email template with consistent styling matching the Pet Care Schedule design

export interface EmailTemplateData {
  recipientName: string
  preheader?: string
  title: string
  content: string
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}

export function baseEmailTemplate(data: EmailTemplateData): string {
  const { recipientName, preheader, title, content, ctaText, ctaUrl, footerNote } = data

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background-color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .email-container {
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      padding: 40px 32px;
      text-align: center;
    }

    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .paw-icon {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .header-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin-top: 20px;
      letter-spacing: -0.5px;
    }

    .content {
      padding: 40px 32px;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }

    .message {
      font-size: 16px;
      color: #334155;
      margin-bottom: 24px;
    }

    .info-card {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
      border: 1px solid rgba(124, 58, 237, 0.15);
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }

    .info-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(124, 58, 237, 0.1);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      color: #7c3aed;
    }

    .info-label {
      font-size: 14px;
      color: #64748b;
      min-width: 100px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      padding: 16px 32px;
      border-radius: 12px;
      margin: 24px 0;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
      transition: all 0.2s ease;
    }

    .cta-button:hover {
      box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
    }

    .footer {
      background: #f8fafc;
      padding: 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .footer-note {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 16px;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .footer-brand-text {
      font-size: 14px;
      font-weight: 600;
      color: #7c3aed;
    }

    .footer-links {
      font-size: 12px;
      color: #94a3b8;
    }

    .footer-links a {
      color: #7c3aed;
      text-decoration: none;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 24px 0;
    }

    .paw-decoration {
      opacity: 0.1;
      position: absolute;
    }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }

    .status-confirmed {
      background: #ecfdf5;
      color: #10b981;
    }

    .status-pending {
      background: #fffbeb;
      color: #f59e0b;
    }

    .status-cancelled {
      background: #fef2f2;
      color: #ef4444;
    }

    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 12px;
      }

      .header {
        padding: 32px 24px;
      }

      .content {
        padding: 32px 24px;
      }

      .header-title {
        font-size: 24px;
      }

      .info-card {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}

  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header with gradient -->
      <div class="header">
        <div class="logo-container">
          <svg class="paw-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10C14.21 10 16 8.21 16 6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6C8 8.21 9.79 10 12 10Z" fill="white"/>
            <path d="M18 13.5C19.1046 13.5 20 12.6046 20 11.5C20 10.3954 19.1046 9.5 18 9.5C16.8954 9.5 16 10.3954 16 11.5C16 12.6046 16.8954 13.5 18 13.5Z" fill="white"/>
            <path d="M6 13.5C7.10457 13.5 8 12.6046 8 11.5C8 10.3954 7.10457 9.5 6 9.5C4.89543 9.5 4 10.3954 4 11.5C4 12.6046 4.89543 13.5 6 13.5Z" fill="white"/>
            <path d="M17 18C17 15.24 14.76 13 12 13C9.24 13 7 15.24 7 18C7 20.76 9.24 23 12 23C14.76 23 17 20.76 17 18Z" fill="white"/>
            <path d="M21 17C21.5523 17 22 16.5523 22 16C22 15.4477 21.5523 15 21 15C20.4477 15 20 15.4477 20 16C20 16.5523 20.4477 17 21 17Z" fill="white" opacity="0.5"/>
            <path d="M3 17C3.55228 17 4 16.5523 4 16C4 15.4477 3.55228 15 3 15C2.44772 15 2 15.4477 2 16C2 16.5523 2.44772 17 3 17Z" fill="white" opacity="0.5"/>
          </svg>
          <span class="logo-text">Pet Care Schedule</span>
        </div>
        <h1 class="header-title">${title}</h1>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="greeting">Olá, ${recipientName}!</p>
        <div class="message">
          ${content}
        </div>

        ${ctaText && ctaUrl ? `
        <div style="text-align: center;">
          <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        ${footerNote ? `<p class="footer-note">${footerNote}</p>` : ''}
        <div class="footer-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10C14.21 10 16 8.21 16 6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6C8 8.21 9.79 10 12 10Z" fill="#7c3aed"/>
            <path d="M17 18C17 15.24 14.76 13 12 13C9.24 13 7 15.24 7 18C7 20.76 9.24 23 12 23C14.76 23 17 20.76 17 18Z" fill="#7c3aed"/>
          </svg>
          <span class="footer-brand-text">Pet Care Schedule</span>
        </div>
        <p class="footer-links">
          Este email foi enviado automaticamente.<br>
          Dúvidas? Entre em contato conosco.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5) // HH:MM
}
