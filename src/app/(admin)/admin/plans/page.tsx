"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import {
  getPlansClient,
  createPlanClient,
  updatePlanClient,
  deletePlanClient,
} from "@/lib/queries/admin-client"
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Calendar,
  Repeat,
  Percent,
  Package,
  CreditCard,
  RefreshCw,
} from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string | null
  type: "avulso" | "semanal" | "mensal"
  sessions_per_period: number
  price: number
  discount_percent: number | null
  active: boolean
}

const typeOptions = [
  { value: "avulso", label: "Avulso" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
]

export default function AdminPlansPage() {
  const { addToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "avulso" as Plan["type"],
    sessions_per_period: 1,
    price: 80,
    discount_percent: 0,
  })

  const [plans, setPlans] = useState<Plan[]>([])

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getPlansClient()
      setPlans(data as Plan[])
    } catch (error) {
      console.error('Error fetching plans:', error)
      addToast("Erro ao carregar planos", "error")
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getTypeLabel = (type: Plan["type"]) => {
    switch (type) {
      case "avulso":
        return "Avulso"
      case "semanal":
        return "Semanal"
      case "mensal":
        return "Mensal"
    }
  }

  const getTypeVariant = (type: Plan["type"]): "default" | "info" | "warning" => {
    switch (type) {
      case "avulso":
        return "default"
      case "semanal":
        return "info"
      case "mensal":
        return "warning"
    }
  }

  const getIcon = (type: Plan["type"]) => {
    switch (type) {
      case "avulso":
        return <Package className="h-6 w-6" />
      case "semanal":
        return <Repeat className="h-6 w-6" />
      case "mensal":
        return <Calendar className="h-6 w-6" />
    }
  }

  const getGradient = (type: Plan["type"]) => {
    switch (type) {
      case "avulso":
        return "linear-gradient(to bottom right, #6b7280, #374151)"
      case "semanal":
        return "linear-gradient(to bottom right, #3b82f6, #2563eb)"
      case "mensal":
        return "linear-gradient(to bottom right, #7c3aed, #a855f7)"
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "avulso",
      sessions_per_period: 1,
      price: 80,
      discount_percent: 0,
    })
    setEditingPlan(null)
  }

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        description: plan.description || "",
        type: plan.type,
        sessions_per_period: plan.sessions_per_period,
        price: plan.price,
        discount_percent: plan.discount_percent || 0,
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingPlan) {
        await updatePlanClient(editingPlan.id, formData)
        setPlans(plans.map(p =>
          p.id === editingPlan.id ? { ...p, ...formData } : p
        ))
        addToast("Plano atualizado com sucesso!", "success")
      } else {
        const newPlan = await createPlanClient(formData)
        setPlans([...plans, newPlan as Plan])
        addToast("Plano criado com sucesso!", "success")
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error saving plan:', error)
      addToast("Erro ao salvar plano", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (plan: Plan) => {
    try {
      await updatePlanClient(plan.id, { active: !plan.active })
      setPlans(plans.map(p =>
        p.id === plan.id ? { ...p, active: !p.active } : p
      ))
      addToast("Status do plano atualizado!", "success")
    } catch (error) {
      console.error('Error toggling plan status:', error)
      addToast("Erro ao atualizar status do plano", "error")
    }
  }

  const handleDelete = async () => {
    if (!deletingPlan) return

    setIsDeleting(true)
    try {
      await deletePlanClient(deletingPlan.id)
      setPlans(plans.filter(p => p.id !== deletingPlan.id))
      addToast("Plano removido com sucesso!", "success")
      setIsDeleteModalOpen(false)
      setDeletingPlan(null)
    } catch (error) {
      console.error('Error deleting plan:', error)
      addToast("Erro ao remover plano", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                Planos
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Gerencie os planos e pacotes oferecidos
              </p>
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border animate-pulse"
              style={{
                height: '280px',
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
              Planos
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gerencie os planos e pacotes
            </p>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={fetchPlans} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl border transition-all"
              style={{
                padding: '24px',
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                opacity: plan.active ? 1 : 0.6
              }}
            >
              {(plan.discount_percent || 0) > 0 && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white border-0 shadow-lg">
                    <Percent className="h-3 w-3 mr-1" />
                    {plan.discount_percent}% OFF
                  </Badge>
                </div>
              )}

              <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ background: getGradient(plan.type) }}
                >
                  {getIcon(plan.type)}
                </div>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <Badge variant={getTypeVariant(plan.type)}>
                    {getTypeLabel(plan.type)}
                  </Badge>
                  {plan.type !== "avulso" && (
                    <Badge variant={plan.active ? "success" : "error"}>
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {plan.name}
              </h3>
              <p className="text-sm line-clamp-2" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                {plan.description || 'Sem descrição'}
              </p>

              <div
                className="border-t"
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-baseline justify-between" style={{ marginBottom: '8px' }}>
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(plan.price)}
                  </span>
                  {plan.type !== "avulso" && (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      /{plan.type === "semanal" ? "semana" : "mês"}
                    </span>
                  )}
                </div>

                {plan.sessions_per_period > 1 && (
                  <div
                    className="flex items-center text-sm"
                    style={{ gap: '8px', marginBottom: '12px', color: 'var(--text-muted)' }}
                  >
                    <Star className="h-4 w-4" style={{ color: 'var(--accent-yellow)' }} />
                    {plan.sessions_per_period} sessões incluídas
                  </div>
                )}
              </div>

              <div className="flex" style={{ gap: '8px', marginTop: '16px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenModal(plan)}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                {plan.type !== "avulso" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(plan)}
                  >
                    {plan.active ? "Desativar" : "Ativar"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeletingPlan(plan)
                    setIsDeleteModalOpen(true)
                  }}
                  style={{ color: 'var(--accent-red)' }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl border text-center"
          style={{
            padding: '48px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <CreditCard className="h-12 w-12 mx-auto opacity-50" style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhum plano cadastrado</p>
          <Button onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
            <Plus className="h-4 w-4" />
            Criar Primeiro Plano
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlan ? "Editar Plano" : "Novo Plano"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nome do Plano"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Plano Mensal Premium"
            required
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o que está incluso no plano..."
          />

          <Select
            label="Tipo de Plano"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Plan["type"] })}
          />

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <Input
              label="Sessões Incluídas"
              type="number"
              value={formData.sessions_per_period}
              onChange={(e) => setFormData({ ...formData, sessions_per_period: Number(e.target.value) })}
              min={1}
              required
            />

            <Input
              label="Desconto (%)"
              type="number"
              value={formData.discount_percent}
              onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
              min={0}
              max={50}
            />
          </div>

          <Input
            label="Preço (R$)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            min={0}
            step={5}
            required
          />

          <ModalActions>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingPlan ? "Salvar" : "Criar"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remover Plano"
      >
        <p style={{ color: 'var(--text-muted)' }}>
          Tem certeza que deseja remover o plano <strong style={{ color: 'var(--text-primary)' }}>{deletingPlan?.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <ModalActions>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
            Remover
          </Button>
        </ModalActions>
      </Modal>
    </div>
  )
}
