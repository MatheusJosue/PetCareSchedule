# Pet Care Schedule - Tarefas Pendentes

## Integrações Admin (Prioridade Alta)

- [ ] Finalizar integrações da visão admin

  - Verificar se todas as páginas admin estão funcionando corretamente
  - Testar CRUD de serviços
  - Testar CRUD de planos
  - Testar gerenciamento de clientes
  - Testar calendário e bloqueio de horários
  - Testar configurações

- [ ] Agendamentos - Permitir reativar agendamentos cancelados

  - Agendamentos cancelados devem poder ser editados
  - Adicionar opção de voltar status para "pendente" ou "confirmado"
  - Implementar botões de ação no modal de detalhes para agendamentos cancelados

- [ ] Configurações - Integrar informações

  - Integrar dados de configurações com o banco de dados
  - Ajustar integração da agenda (horários, dias de funcionamento)
  - Salvar e carregar configurações do Supabase

- [ ] Agenda (Calendar) - Ajustar integração
  - Carregar horários de funcionamento das configurações do banco
  - Gerar timeSlots dinamicamente baseado nas configurações (início, fim, duração)
  - Respeitar dias de funcionamento configurados
  - Integrar bloqueio de horários com o banco de dados

## Emails (Prioridade Alta)

- [ ] Validar rotina de emails
  - Configurar serviço de email (Resend, SendGrid, etc.)
  - Testar envio de confirmação de agendamento
  - Testar envio de lembrete de agendamento
  - Testar envio de cancelamento

## Deploy (Prioridade Alta)

- [ ] Subir no GitHub

  - Criar repositório
  - Fazer push do código
  - Configurar .gitignore adequadamente

- [ ] Subir na Vercel

  - Conectar repositório GitHub
  - Configurar variáveis de ambiente:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - Outras variáveis necessárias

- [ ] Configurar redirect URL no Supabase
  - Acessar Supabase Dashboard > Authentication > URL Configuration
  - Adicionar URL de produção da Vercel em "Site URL"
  - Adicionar URLs de redirect em "Redirect URLs":
    - `https://seu-dominio.vercel.app/auth/callback`
    - `https://seu-dominio.vercel.app/login`

## Notas

- Lembre-se de testar o fluxo completo de autenticação após configurar os redirects
- Verifique as políticas RLS do Supabase para garantir segurança dos dados
