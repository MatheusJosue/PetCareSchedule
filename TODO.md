# Pet Care Schedule - Tarefas Pendentes

## Integrações Admin (Concluído)

- [x] Finalizar integrações da visão admin
  - Serviços: CRUD completo funcionando
  - Planos: CRUD completo funcionando
  - Clientes: Listagem e busca funcionando
  - Agendamentos: Listagem, filtros e mudança de status funcionando
  - Calendário: Visualização e bloqueio de horários funcionando
  - Configurações: Carregamento e salvamento funcionando

- [ ] Agendamentos - Permitir reativar agendamentos cancelados
  - Agendamentos cancelados devem poder ser editados
  - Adicionar opção de voltar status para "pendente" ou "confirmado"
  - Implementar botões de ação no modal de detalhes para agendamentos cancelados

- [ ] Agenda (Calendar) - Melhorias futuras
  - Carregar horários de funcionamento das configurações do banco
  - Gerar timeSlots dinamicamente baseado nas configurações (início, fim, duração)
  - Respeitar dias de funcionamento configurados

## Emails (Prioridade Alta)

- [ ] Validar rotina de emails
  - Configurar serviço de email (Resend, SendGrid, etc.)
  - Testar envio de confirmação de agendamento
  - Testar envio de lembrete de agendamento
  - Testar envio de cancelamento

## Deploy (Concluído)

- [x] Subir no GitHub
  - Repositório: https://github.com/MatheusJosue/PetCareSchedule

- [x] Subir na Vercel
  - URL: https://pet-care-schedule-flxkjmh94-matheuscerqueiras-projects.vercel.app
  - Variáveis de ambiente configuradas

- [x] Configurar redirect URL no Supabase

## Notas

- Lembre-se de testar o fluxo completo de autenticação após configurar os redirects
- Verifique as políticas RLS do Supabase para garantir segurança dos dados
