# Pet Care Schedule - Instruções para Claude

## Comandos

- **NÃO** rodar `npm run build` automaticamente após fazer alterações
- **NÃO** fazer commit e push automaticamente - apenas quando o usuário solicitar explicitamente

## Estrutura do Projeto

- Next.js 16 com App Router
- Supabase para backend (autenticação e banco de dados)
- Tailwind CSS para estilização
- Deploy na Vercel

## Arquivos Importantes

- `src/lib/queries/admin-client.ts` - Queries client-side para admin
- `src/lib/queries/admin.ts` - Queries server-side para admin
- `src/app/(admin)/admin/` - Páginas do painel admin
- `src/app/(client)/` - Páginas da área do cliente
- `supabase/migrations/` - Migrations do banco de dados

## Padrões de Código

- Usar variáveis CSS para cores (ex: `var(--text-primary)`, `var(--accent-purple)`)
- Componentes UI em `src/components/ui/`
- Todas as páginas admin são client-side (`"use client"`)

## Sistema de Assinaturas (Subscriptions)

### Conceito
Clientes podem contratar planos (mensal, semanal) que incluem N sessões. Quando excedem o limite, são cobrados valores adicionais. O admin confirma pagamento para liberar novo ciclo.

### Campos da Tabela `subscriptions`
- `sessions_remaining`: Sessões restantes no período atual
- `sessions_used`: Sessões já utilizadas
- `extra_sessions_used`: Sessões extras (além do plano)
- `payment_status`: 'paid' | 'pending' | 'overdue'
- `payment_due_amount`: Valor devido por sessões extras
- `last_payment_date`: Data do último pagamento

### Fluxo de Uso
1. **Cliente agenda**: Sistema verifica assinatura ativa
2. **Se tem sessões**: Decrementa `sessions_remaining`, incrementa `sessions_used`
3. **Se não tem sessões**: Incrementa `extra_sessions_used`, adiciona valor ao `payment_due_amount`, status vira 'pending'
4. **Se pagamento pendente**: Cliente não consegue agendar novos banhos
5. **Admin confirma pagamento**: Zera débito, opcionalmente renova sessões

### Funções SQL (em `supabase/migrations/20260104000001_subscription_payment.sql`)
- `can_user_book(user_id)`: Verifica se pode agendar
- `use_subscription_session(subscription_id, extra_charge)`: Usa uma sessão
- `mark_subscription_paid(subscription_id, renew_sessions)`: Marca como pago

### Arquivos Relacionados
- `src/app/(admin)/admin/subscriptions/page.tsx` - Painel admin de assinaturas
- `src/lib/queries/admin-client.ts` - Funções de consulta (getSubscriptionsClient, markSubscriptionPaidClient, etc.)
- `src/app/(client)/appointments/new/page.tsx` - Verifica assinatura antes de agendar

## Sistema de Email

### Configuração
- Provedor: Resend (já configurado)
- API Key: `RESEND_API_KEY` no `.env.local`
- Serviço: `src/lib/services/email.ts`
- Templates: `src/lib/email-templates/`

### Tipos de Email
1. **Confirmação de Agendamento**: Enviado quando cliente agenda
2. **Lembrete**: Enviado 24h antes do agendamento
3. **Cancelamento**: Enviado quando agendamento é cancelado

### Design dos Templates
- Gradiente roxo (#7c3aed → #a855f7) no header
- Fonte Inter
- Cards com bordas arredondadas
- Ícones de pata como decoração

### Endpoints
- `POST /api/email/send` - Enviar email (confirmation, cancellation)
- `POST /api/email/test` - Testar templates (admin/dev only)
- `GET /api/cron/send-reminders` - Cron para lembretes (Vercel Cron, 9h diariamente)

### Variáveis de Ambiente Necessárias
```env
RESEND_API_KEY=re_xxxx                    # API key do Resend
NEXT_PUBLIC_APP_URL=http://localhost:3000  # URL base do app
CRON_SECRET=secret                         # Opcional: proteger cron endpoint
SUPABASE_SERVICE_ROLE_KEY=eyJxx...         # Opcional: para cron sem auth
```

### Testando Emails
```bash
# Via curl (dev ou admin logado)
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type": "confirmation", "email": "seu@email.com"}'
```
