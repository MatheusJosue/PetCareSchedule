# Pet Care Schedule

Sistema de agendamento para pet shops com servicos de banho e tosa. Desenvolvido com Next.js 16, Supabase e Tailwind CSS.

## Stack Tecnologica

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Language**: TypeScript 5

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/                 # Rotas de autenticacao
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (client)/               # Area do cliente
│   │   ├── page.tsx            # Dashboard
│   │   ├── appointments/       # Agendamentos
│   │   ├── pets/               # Meus pets
│   │   └── profile/            # Perfil
│   ├── (admin)/admin/          # Area administrativa
│   │   ├── page.tsx            # Dashboard admin
│   │   ├── appointments/       # Gerenciar agendamentos
│   │   ├── customers/          # Clientes
│   │   ├── services/           # Servicos
│   │   ├── plans/              # Planos
│   │   ├── calendar/           # Calendario
│   │   └── settings/           # Configuracoes
│   ├── api/                    # API routes
│   ├── globals.css             # Estilos globais + variaveis CSS
│   └── layout.tsx              # Layout raiz
├── components/
│   ├── ui/                     # Componentes de UI reutilizaveis
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   ├── wizard.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/                 # Componentes de layout
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── mobile-nav.tsx
│   └── appointments/           # Componentes especificos
├── contexts/
│   ├── auth-context.tsx        # Contexto de autenticacao
│   └── theme-context.tsx       # Contexto de tema (light/dark)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Cliente Supabase (browser)
│   │   └── server.ts           # Cliente Supabase (server)
│   ├── queries/
│   │   ├── admin.ts            # Queries para area admin
│   │   └── client.ts           # Queries para area cliente
│   └── utils.ts                # Utilitarios (cn, etc)
├── types/
│   └── database.ts             # Tipos TypeScript do banco
└── middleware.ts               # Middleware de autenticacao
```

## Sistema de Temas

O projeto usa CSS custom properties para suportar temas light e dark.

### Variaveis CSS disponiveis:

```css
/* Backgrounds */
--bg-primary         /* Fundo principal */
--bg-secondary       /* Fundo secundario (cards) */
--bg-tertiary        /* Fundo terciario */

/* Textos */
--text-primary       /* Texto principal */
--text-secondary     /* Texto secundario */
--text-muted         /* Texto muted */

/* Bordas */
--border-primary     /* Borda principal */
--border-secondary   /* Borda secundaria */

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

### Exemplo de uso:

```tsx
<div style={{
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-primary)'
}}>
  Conteudo
</div>
```

## Banco de Dados

### Tabelas principais:

- **users** - Usuarios (clientes e admins)
- **pets** - Pets dos clientes
- **services** - Servicos oferecidos
- **plans** - Planos de assinatura
- **appointments** - Agendamentos
- **subscriptions** - Assinaturas ativas
- **availability_slots** - Horarios disponiveis/bloqueados
- **settings** - Configuracoes do sistema
- **notifications** - Notificacoes

### Enums:

- `user_role`: 'client' | 'admin'
- `appointment_status`: 'pending' | 'confirmed' | 'completed' | 'cancelled'
- `plan_type`: 'avulso' | 'semanal' | 'mensal'
- `pet_size`: 'pequeno' | 'medio' | 'grande'
- `pet_species`: 'cachorro' | 'gato' | 'outro'

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variaveis de ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 3. Configurar Supabase

Execute as migrations na ordem:

1. `20260103000001_create_tables.sql` - Cria tabelas
2. `20260103000002_row_level_security.sql` - Configura RLS
3. `20260103000003_storage.sql` - Configura storage
4. `20260103000004_auth_trigger.sql` - Trigger de auth

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de producao
npm run start    # Iniciar producao
npm run lint     # Executar linter
```

## Funcionalidades

### Area do Cliente
- Dashboard com resumo de agendamentos
- Cadastro e gerenciamento de pets
- Agendamento de servicos
- Historico de agendamentos
- Perfil com endereco

### Area Administrativa
- Dashboard com metricas
- Gerenciamento de agendamentos
- Cadastro de clientes
- Gerenciamento de servicos
- Configuracao de planos
- Calendario de atendimentos
- Configuracoes do sistema

### Componentes UI
- Sistema de toast para notificacoes
- Modais reutilizaveis
- Wizard para fluxos multi-step
- Botoes com variantes (primary, secondary, destructive, ghost, outline)
- Inputs com validacao
- Badges de status

## Licenca

Projeto privado.
