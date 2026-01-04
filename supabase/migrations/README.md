# Pet Care Schedule - Supabase Migrations

## Como executar as migrations

### Opcao 1: Via Supabase Dashboard

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Va em **SQL Editor**
3. Execute cada arquivo na ordem numerica:
   - `20260103000001_create_tables.sql` - Cria todas as tabelas
   - `20260103000002_row_level_security.sql` - Configura RLS (Row Level Security)
   - `20260103000003_storage.sql` - Configura Storage buckets
   - `20260103000004_auth_trigger.sql` - Configura triggers de autenticacao

### Opcao 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se nao tiver)
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref seu-project-ref

# Executar migrations
supabase db push
```

## Estrutura das Tabelas

### users
Perfil do usuario, extende auth.users
- Campos de endereco completo
- Role: client ou admin

### pets
Pets cadastrados pelos usuarios
- Especie: cachorro, gato, outro
- Porte: pequeno, medio, grande

### services
Servicos disponiveis
- Banho, Tosa, Banho+Tosa, etc.
- Preco base e duracao

### plans
Planos de assinatura
- Avulso, Semanal, Mensal
- Desconto por plano

### availability_slots
Horarios disponiveis para agendamento

### appointments
Agendamentos
- Status: pending, confirmed, completed, cancelled

### subscriptions
Assinaturas ativas dos usuarios

### settings
Configuracoes do sistema

### notifications
Notificacoes dos usuarios

## Row Level Security (RLS)

Todas as tabelas tem RLS habilitado:

- **Usuarios**: podem ver/editar apenas seus proprios dados
- **Admins**: podem ver/editar todos os dados
- **Servicos/Planos**: publicos para leitura, apenas admin pode modificar
- **Agendamentos**: usuarios veem apenas seus, admins veem todos

## Storage Buckets

### pet-photos
- Fotos dos pets
- Limite: 5MB
- Formatos: JPEG, PNG, WebP, GIF

### avatars
- Avatares dos usuarios
- Limite: 2MB
- Formatos: JPEG, PNG, WebP

## Funcoes Auxiliares

### is_admin()
Verifica se o usuario atual e admin

### is_slot_available(date, time, duration)
Verifica se um slot esta disponivel

### get_available_slots(date)
Retorna slots disponiveis para uma data

### generate_availability_slots(start_date, end_date, ...)
Gera slots de disponibilidade para um periodo

### use_subscription_session(subscription_id)
Usa uma sessao de uma assinatura

## Triggers

### on_auth_user_created
Cria perfil na tabela users quando usuario faz signup

### on_appointment_status_change
Cria notificacao quando status do agendamento muda

### update_*_updated_at
Atualiza campo updated_at automaticamente
