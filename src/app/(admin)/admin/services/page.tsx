"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import {
  getServicesClient,
  createServiceClient,
  updateServiceClient,
  deleteServiceClient,
} from "@/lib/queries/admin-client"
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Scissors,
  Droplets,
  Sparkles,
  PawPrint,
  Settings,
  RefreshCw,
} from "lucide-react"

interface Service {
  id: string
  name: string
  description: string | null
  duration_min: number
  base_price: number
  active: boolean
}

export default function AdminServicesPage() {
  const { addToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_min: 60,
    base_price: 50,
  })

  const [services, setServices] = useState<Service[]>([])

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getServicesClient()
      setServices(data as Service[])
    } catch (error) {
      console.error('Error fetching services:', error)
      addToast("Erro ao carregar serviços", "error")
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("banho") && name.toLowerCase().includes("tosa")) {
      return <Sparkles className="h-6 w-6" />
    }
    if (name.toLowerCase().includes("banho")) {
      return <Droplets className="h-6 w-6" />
    }
    if (name.toLowerCase().includes("tosa")) {
      return <Scissors className="h-6 w-6" />
    }
    return <PawPrint className="h-6 w-6" />
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_min: 60,
      base_price: 50,
    })
    setEditingService(null)
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description || "",
        duration_min: service.duration_min,
        base_price: service.base_price,
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
      if (editingService) {
        await updateServiceClient(editingService.id, formData)
        setServices(services.map(s =>
          s.id === editingService.id ? { ...s, ...formData } : s
        ))
        addToast("Serviço atualizado com sucesso!", "success")
      } else {
        const newService = await createServiceClient(formData)
        setServices([...services, newService as Service])
        addToast("Serviço criado com sucesso!", "success")
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error saving service:', error)
      addToast("Erro ao salvar serviço", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      await updateServiceClient(service.id, { active: !service.active })
      setServices(services.map(s =>
        s.id === service.id ? { ...s, active: !s.active } : s
      ))
      addToast("Status do serviço atualizado!", "success")
    } catch (error) {
      console.error('Error toggling service status:', error)
      addToast("Erro ao atualizar status do serviço", "error")
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return

    setIsDeleting(true)
    try {
      await deleteServiceClient(deletingService.id)
      setServices(services.filter(s => s.id !== deletingService.id))
      addToast("Serviço removido com sucesso!", "success")
      setIsDeleteModalOpen(false)
      setDeletingService(null)
    } catch (error) {
      console.error('Error deleting service:', error)
      addToast("Erro ao remover serviço", "error")
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
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                Serviços
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Gerencie os serviços oferecidos
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
                height: '220px',
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
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Serviços
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gerencie os serviços oferecidos
            </p>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={fetchServices} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border transition-all"
              style={{
                padding: '24px',
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                opacity: service.active ? 1 : 0.6
              }}
            >
              <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-lg shadow-purple-400/20">
                  {getIcon(service.name)}
                </div>
                <Badge variant={service.active ? "success" : "error"}>
                  {service.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {service.name}
              </h3>
              <p className="text-sm line-clamp-2" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                {service.description || 'Sem descrição'}
              </p>

              <div
                className="flex items-center border-t"
                style={{
                  gap: '16px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-center text-sm" style={{ gap: '4px', color: 'var(--text-muted)' }}>
                  <Clock className="h-4 w-4" />
                  {service.duration_min} min
                </div>
                <div className="flex items-center text-sm font-semibold" style={{ gap: '4px', color: 'var(--text-primary)' }}>
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(service.base_price)}
                </div>
              </div>

              <div className="flex" style={{ gap: '8px', marginTop: '16px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenModal(service)}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(service)}
                >
                  {service.active ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeletingService(service)
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
          <Settings className="h-12 w-12 mx-auto opacity-50" style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhum serviço cadastrado</p>
          <Button onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
            <Plus className="h-4 w-4" />
            Criar Primeiro Serviço
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingService ? "Editar Serviço" : "Novo Serviço"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nome do Serviço"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Banho Completo"
            required
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o serviço..."
          />

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <Input
              label="Duração (min)"
              type="number"
              value={formData.duration_min}
              onChange={(e) => setFormData({ ...formData, duration_min: Number(e.target.value) })}
              min={15}
              step={15}
              required
            />

            <Input
              label="Preço Base (R$)"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
              min={0}
              step={5}
              required
            />
          </div>

          <ModalActions>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingService ? "Salvar" : "Criar"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remover Serviço"
      >
        <p style={{ color: 'var(--text-muted)' }}>
          Tem certeza que deseja remover o serviço <strong style={{ color: 'var(--text-primary)' }}>{deletingService?.name}</strong>?
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
