"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import {
  getSubscriptionsClient,
  getCustomersClient,
  getPlansClient,
  createSubscriptionClient,
  updateSubscriptionClient,
  markSubscriptionPaidClient,
  SubscriptionWithDetails,
} from "@/lib/queries/admin-client"
import {
  CreditCard,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  DollarSign,
  Search,
  Filter,
} from "lucide-react"

interface Customer {
  id: string
  name: string | null
  email: string
}

interface Plan {
  id: string
  name: string
  type: string
  sessions_per_period: number
  price: number
}

export default function AdminSubscriptionsPage() {
  const { addToast } = useToast()
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithDetails | null>(null)
  const [renewSessions, setRenewSessions] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    user_id: "",
    plan_id: "",
  })

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [subsData, customersData, plansData] = await Promise.all([
        getSubscriptionsClient(),
        getCustomersClient(),
        getPlansClient(),
      ])
      setSubscriptions(subsData)
      setCustomers(customersData as Customer[])
      setPlans(plansData as Plan[])
    } catch (error) {
      console.error('Error fetching data:', error)
      addToast("Erro ao carregar dados", "error")
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm ||
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter
    const matchesPayment = paymentFilter === "all" || sub.payment_status === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const handleCreateSubscription = async () => {
    if (!formData.user_id || !formData.plan_id) {
      addToast("Selecione cliente e plano", "error")
      return
    }

    setIsCreating(true)
    try {
      const plan = plans.find(p => p.id === formData.plan_id)
      if (!plan) throw new Error("Plano não encontrado")

      await createSubscriptionClient({
        user_id: formData.user_id,
        plan_id: formData.plan_id,
        sessions_remaining: plan.sessions_per_period,
      })

      addToast("Assinatura criada com sucesso!", "success")
      setIsCreateModalOpen(false)
      setFormData({ user_id: "", plan_id: "" })
      fetchData()
    } catch (error) {
      console.error('Error creating subscription:', error)
      addToast("Erro ao criar assinatura", "error")
    } finally {
      setIsCreating(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedSubscription) return

    setIsUpdating(true)
    try {
      const sessionsCount = renewSessions ? selectedSubscription.plan?.sessions_per_period : undefined
      await markSubscriptionPaidClient(selectedSubscription.id, renewSessions, sessionsCount)

      addToast("Pagamento confirmado!", "success")
      setIsPaymentModalOpen(false)
      setSelectedSubscription(null)
      setRenewSessions(false)
      fetchData()
    } catch (error) {
      console.error('Error marking as paid:', error)
      addToast("Erro ao confirmar pagamento", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelSubscription = async (subscription: SubscriptionWithDetails) => {
    setIsUpdating(true)
    try {
      await updateSubscriptionClient(subscription.id, { status: 'cancelled' })
      addToast("Assinatura cancelada", "success")
      fetchData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      addToast("Erro ao cancelar assinatura", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReactivateSubscription = async (subscription: SubscriptionWithDetails) => {
    setIsUpdating(true)
    try {
      await updateSubscriptionClient(subscription.id, { status: 'active' })
      addToast("Assinatura reativada", "success")
      fetchData()
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      addToast("Erro ao reativar assinatura", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Ativa</Badge>
      case "paused":
        return <Badge variant="warning">Pausada</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string, amount: number) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Pago</Badge>
      case "pending":
        return <Badge variant="warning">Pendente {formatCurrency(amount)}</Badge>
      case "overdue":
        return <Badge variant="destructive">Atrasado {formatCurrency(amount)}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPlanTypeBadge = (type: string) => {
    switch (type) {
      case "semanal":
        return <Badge variant="info">Semanal</Badge>
      case "mensal":
        return <Badge variant="purple">Mensal</Badge>
      default:
        return <Badge>Avulso</Badge>
    }
  }

  // Loading skeleton
  if (isLoading && subscriptions.length === 0) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '16px' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                Assinaturas
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Gerencie os planos dos clientes
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border animate-pulse"
              style={{
                height: '120px',
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '16px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Assinaturas
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {filteredSubscriptions.length} assinatura{filteredSubscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Assinatura
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row" style={{ gap: '12px' }}>
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <Input
            placeholder="Buscar por cliente ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border text-sm"
          style={{
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            minWidth: '140px',
          }}
        >
          <option value="all">Todos status</option>
          <option value="active">Ativas</option>
          <option value="paused">Pausadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-xl border text-sm"
          style={{
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            minWidth: '140px',
          }}
        >
          <option value="all">Pagamento</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="overdue">Atrasado</option>
        </select>
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <div
          className="rounded-2xl border text-center"
          style={{
            padding: '48px 24px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <CreditCard className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
            Nenhuma assinatura encontrada
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
              ? "Tente ajustar os filtros"
              : "Crie a primeira assinatura clicando no botão acima"}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="rounded-2xl border"
              style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderColor: subscription.payment_status !== 'paid' ? 'var(--accent-yellow)' : 'var(--border-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between" style={{ gap: '16px' }}>
                {/* Client & Plan Info */}
                <div className="flex-1">
                  <div className="flex items-center flex-wrap" style={{ gap: '8px', marginBottom: '8px' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {subscription.user?.name || subscription.user?.email || 'Cliente'}
                    </span>
                    {getStatusBadge(subscription.status)}
                    {getPaymentBadge(subscription.payment_status, subscription.payment_due_amount)}
                  </div>

                  <div className="flex items-center flex-wrap" style={{ gap: '16px', color: 'var(--text-muted)' }}>
                    <span className="flex items-center text-sm" style={{ gap: '4px' }}>
                      <CreditCard className="h-4 w-4" />
                      {subscription.plan?.name || 'Plano'}
                      {subscription.plan && getPlanTypeBadge(subscription.plan.type)}
                    </span>
                    <span className="flex items-center text-sm" style={{ gap: '4px' }}>
                      <Calendar className="h-4 w-4" />
                      Início: {formatDate(subscription.start_date)}
                    </span>
                  </div>
                </div>

                {/* Sessions Info */}
                <div
                  className="rounded-xl"
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    minWidth: '200px',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Sessões</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {subscription.sessions_remaining} / {subscription.plan?.sessions_per_period || 0}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-primary)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (subscription.sessions_remaining / (subscription.plan?.sessions_per_period || 1)) * 100)}%`,
                        background: subscription.sessions_remaining > 0
                          ? 'linear-gradient(to right, #7c3aed, #a855f7)'
                          : 'var(--accent-red)',
                      }}
                    />
                  </div>
                  {subscription.extra_sessions_used > 0 && (
                    <p className="text-xs" style={{ color: 'var(--accent-yellow)', marginTop: '4px' }}>
                      +{subscription.extra_sessions_used} sessões extras
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center" style={{ gap: '8px' }}>
                  {subscription.payment_status !== 'paid' && subscription.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSubscription(subscription)
                        setIsPaymentModalOpen(true)
                      }}
                    >
                      <DollarSign className="h-4 w-4" />
                      Confirmar Pagamento
                    </Button>
                  )}
                  {subscription.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelSubscription(subscription)}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {subscription.status === 'cancelled' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReactivateSubscription(subscription)}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Reativar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Assinatura"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Cliente
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full rounded-xl border text-sm"
              style={{
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Selecione um cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name || customer.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Plano
            </label>
            <select
              value={formData.plan_id}
              onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
              className="w-full rounded-xl border text-sm"
              style={{
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Selecione um plano</option>
              {plans.filter(p => p.type !== 'avulso').map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.sessions_per_period} sessões - {formatCurrency(plan.price)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ModalActions>
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateSubscription} isLoading={isCreating}>
            <Plus className="h-4 w-4" />
            Criar Assinatura
          </Button>
        </ModalActions>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedSubscription(null)
          setRenewSessions(false)
        }}
        title="Confirmar Pagamento"
      >
        {selectedSubscription && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="rounded-xl"
              style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
              }}
            >
              <p className="font-semibold" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                {selectedSubscription.user?.name || selectedSubscription.user?.email}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Plano: {selectedSubscription.plan?.name}
              </p>
              {selectedSubscription.payment_due_amount > 0 && (
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-yellow)', marginTop: '8px' }}>
                  Valor pendente: {formatCurrency(selectedSubscription.payment_due_amount)}
                </p>
              )}
            </div>

            <label className="flex items-center cursor-pointer" style={{ gap: '12px' }}>
              <input
                type="checkbox"
                checked={renewSessions}
                onChange={(e) => setRenewSessions(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span style={{ color: 'var(--text-primary)' }}>
                Renovar sessões ({selectedSubscription.plan?.sessions_per_period} sessões)
              </span>
            </label>
          </div>
        )}

        <ModalActions>
          <Button
            variant="outline"
            onClick={() => {
              setIsPaymentModalOpen(false)
              setSelectedSubscription(null)
              setRenewSessions(false)
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleMarkAsPaid} isLoading={isUpdating}>
            <CheckCircle className="h-4 w-4" />
            Confirmar Pagamento
          </Button>
        </ModalActions>
      </Modal>
    </div>
  )
}
