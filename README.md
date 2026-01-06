# Pet Care Schedule

Sistema de agendamento para pet shops com serviços de banho e tosa. Desenvolvido com Next.js 16, Supabase, Tailwind CSS e PWA support.

## Stack Tecnológica

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Brevo (Sendinblue)
- **PWA**: next-pwa
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Language**: TypeScript 5

## Funcionalidades

### Area do Cliente
- Dashboard com resumo de agendamentos
- Cadastro e gerenciamento de pets
- Agendamento de serviços com wizard intuitivo
- Seleção de data e horário com slots já ocupados bloqueados
- Histórico de agendamentos
- Perfil com endereço
- Sistema de assinaturas (planos mensais/semanais)

### Area Administrativa
- Dashboard com métricas
- Gerenciamento de agendamentos (confirmar, completar, cancelar)
- Cadastro de clientes
- Gerenciamento de serviços
- Configuração de planos de assinatura
- Gerenciamento de assinaturas (pagamentos, renovações)
- Calendário de atendimentos
- Bloqueio de horários e datas
- Configurações do sistema (horários de funcionamento)

### Sistema de Assinaturas
- Planos mensais e semanais com N sessões incluídas
- Cobrança automática por sessões extras
- Admin confirma pagamento para liberar novo ciclo
- Bloqueio de novos agendamentos enquanto houver pagamento pendente

### Sistema de Email (Brevo)
- **Confirmação de Agendamento**: Enviado quando cliente agenda
- **Confirmação pelo Admin**: Enviado quando admin confirma o agendamento
- **Lembrete**: 24h antes do agendamento (via cron job)
- **Cancelamento**: Enviado quando agendamento é cancelado
- **Notificações ao Admin**: Para novos agendamentos e cancelamentos

### PWA
- Instalável em dispositivos móveis e desktop
- Funciona offline (com cache)
- Ícone personalizado (pata roxa)
- Theme color roxo (#7c3aed)
- Modo standalone

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/                 # Rotas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (client)/               # Área do cliente
│   │   ├── page.tsx            # Dashboard
│   │   ├── appointments/       # Agendamentos
│   │   ├── pets/               # Meus pets
│   │   └── profile/            # Perfil
│   ├── (admin)/admin/          # Área administrativa
│   │   ├── page.tsx            # Dashboard admin
│   │   ├── appointments/       # Gerenciar agendamentos
│   │   ├── customers/          # Clientes
│   │   ├── services/           # Serviços
│   │   ├── plans/              # Planos
│   │   ├── subscriptions/      # Assinaturas
│   │   ├── calendar/           # Calendário
│   │   └── settings/           # Configurações
│   ├── api/                    # API routes
│   │   ├── email/
│   │   └── cron/
│   ├── globals.css             # Estilos globais + variáveis CSS
│   └── layout.tsx              # Layout raiz
├── components/
│   ├── ui/                     # Componentes de UI reutilizáveis
│   ├── layout/                 # Componentes de layout
│   └── appointments/           # Componentes específicos
├── contexts/
│   ├── auth-context.tsx        # Contexto de autenticação
│   └── theme-context.tsx       # Contexto de tema (light/dark)
├── lib/
│   ├── supabase/               # Clientes Supabase
│   ├── queries/                # Queries para admin e client
│   ├── services/               # Serviços (email, etc)
│   ├── email-templates/        # Templates de email
│   └── utils.ts                # Utilitários
├── types/
│   └── database.ts             # Tipos TypeScript do banco
└── middleware.ts               # Middleware de autenticação
```

## Sistema de Temas

O projeto usa CSS custom properties para suportar temas light e dark.

### Variáveis CSS disponíveis:

```css
/* Backgrounds */
--bg-primary         /* Fundo principal */
--bg-secondary       /* Fundo secundário (cards) */
--bg-tertiary        /* Fundo terciário */

/* Textos */
--text-primary       /* Texto principal */
--text-secondary     /* Texto secundário */
--text-muted         /* Texto muted */

/* Bordas */
--border-primary     /* Borda principal */
--border-secondary   /* Borda secundária */

/* Cores de destaque */
--accent-purple      /* Roxo principal */
--accent-purple-bg   /* Fundo roxo */
--accent-green       /* Verde (sucesso) */
--accent-green-bg
--accent-yellow      /* Amarelo (warning) */
--accent-yellow-bg
--accent-red         /* Vermelho (erro) */
--accent-red-bg
--accent-blue        /* Azul (info) */
--accent-blue-bg

/* Sombras */
--shadow-sm
--shadow-md
--shadow-lg
```

## Banco de Dados

### Tabelas principais:

- **users** - Usuários (clientes e admins)
- **pets** - Pets dos clientes
- **services** - Serviços oferecidos
- **plans** - Planos de assinatura
- **appointments** - Agendamentos
- **subscriptions** - Assinaturas ativas (por pet)
- **availability_slots** - Horários disponíveis/bloqueados
- **settings** - Configurações do sistema
- **notifications** - Notificações

### Enums:

- `user_role`: 'client' | 'admin'
- `appointment_status`: 'pending' | 'confirmed' | 'completed' | 'cancelled'
- `plan_type`: 'avulso' | 'semanal' | 'mensal'
- `pet_size`: 'pequeno' | 'medio' | 'grande'
- `pet_species`: 'cachorro' | 'gato' | 'outro'

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

# Brevo (Sendinblue - Email)
BREVO_API_KEY=sua_api_key_brevo
BREVO_FROM_EMAIL=seu_email_verificado
BREVO_FROM_NAME=Pet Care Schedule

# Admin Email (para receber notificações)
ADMIN_EMAIL=admin@email.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Brevo

1. Crie uma conta em https://www.brevo.com
2. Verifique seu email remetente em SMTP & API > Senders
3. Obtenha sua API Key em SMTP & API > API Keys

### 4. Configurar Supabase

Execute as migrations na ordem:

1. `20260103000001_create_tables.sql` - Cria tabelas
2. `20260103000002_row_level_security.sql` - Configura RLS
3. `20260103000003_storage.sql` - Configura storage
4. `20260103000004_auth_trigger.sql` - Trigger de auth
5. `20260104000001_subscription_payment.sql` - Funções de assinatura

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção (com webpack para PWA)
npm run start    # Iniciar produção
npm run lint     # Executar linter
```

## Deploy

### Vercel

O projeto está configurado para deploy na Vercel. Configure as variáveis de ambiente no dashboard da Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL`
- `BREVO_FROM_NAME`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_APP_URL` (URL de produção)

### Cron Jobs

Configure o cron job para lembretes de agendamento:

```bash
# Vercel Cron
GET /api/cron/send-reminders
# Schedule: 0 9 * * * (9h diariamente)
```

## Componentes UI

- Sistema de toast para notificações
- Modais reutilizáveis
- Wizard para fluxos multi-step
- Botões com variantes (primary, secondary, destructive, ghost, outline)
- Inputs com validação
- Badges de status
- Cards com estilização consistente

## Licença

Projeto privado.
