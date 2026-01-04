"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { getCustomersClient } from "@/lib/queries/admin-client"
import {
  Search,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Calendar,
  Eye,
  Users,
  RefreshCw,
} from "lucide-react"

interface Customer {
  id: string
  name: string | null
  email: string
  phone: string | null
  address_street: string | null
  address_number: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  pets: { id: string; name: string; species: string }[]
  appointments_count: number
  created_at: string
}

export default function AdminCustomersPage() {
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getCustomersClient(searchTerm || undefined)
      setCustomers(data as Customer[])
    } catch (error) {
      console.error('Error fetching customers:', error)
      addToast("Erro ao carregar clientes", "error")
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, addToast])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [fetchCustomers])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const formatAddress = (customer: Customer) => {
    const parts = [
      customer.address_street,
      customer.address_number,
      customer.address_neighborhood,
      customer.address_city,
      customer.address_state
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado'
  }

  // Loading skeleton
  if (isLoading && customers.length === 0) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '16px' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                Clientes
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Gerencie sua base de clientes
              </p>
            </div>
          </div>
        </div>

        {/* Search Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            height: '72px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        />

        {/* List Skeleton */}
        <div
          className="rounded-2xl border"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div
            className="border-b"
            style={{
              padding: '20px 24px',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="h-6 w-40 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{
                  height: '80px',
                  background: 'var(--bg-tertiary)',
                }}
              />
            ))}
          </div>
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
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Clientes
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gerencie sua base de clientes
            </p>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={fetchCustomers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="info" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {customers.length}
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div
        className="rounded-2xl border"
        style={{
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Customers List */}
      <div
        className="rounded-2xl border"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div
          className="border-b"
          style={{
            padding: '20px 24px',
            borderColor: 'var(--border-primary)'
          }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Lista de Clientes
          </h2>
        </div>

        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col sm:flex-row sm:items-center rounded-xl border transition-all"
                style={{
                  padding: '16px',
                  gap: '16px',
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-center flex-1" style={{ gap: '16px' }}>
                  <Avatar
                    fallback={customer.name || 'Cliente'}
                    size="lg"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {customer.name || 'Cliente'}
                    </p>
                    <div className="flex flex-wrap items-center text-sm" style={{ gap: '16px', color: 'var(--text-muted)' }}>
                      <span className="flex items-center" style={{ gap: '4px' }}>
                        <Mail className="h-3.5 w-3.5" />
                        {customer.email}
                      </span>
                      {customer.phone && (
                        <span className="flex items-center" style={{ gap: '4px' }}>
                          <Phone className="h-3.5 w-3.5" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center" style={{ gap: '16px' }}>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--accent-purple-bg)' }}
                    >
                      <PawPrint className="h-4 w-4" style={{ color: 'var(--accent-purple)' }} />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {customer.pets?.length || 0}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>pets</p>
                    </div>
                  </div>

                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--accent-blue-bg)' }}
                    >
                      <Calendar className="h-4 w-4" style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {customer.appointments_count}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>agend.</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setIsDetailModalOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}

            {customers.length === 0 && !isLoading && (
              <div className="text-center" style={{ padding: '32px', color: 'var(--text-muted)' }}>
                <Users className="h-12 w-12 mx-auto opacity-50" style={{ marginBottom: '8px' }} />
                <p>Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalhes do Cliente"
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex items-center" style={{ gap: '16px' }}>
              <Avatar fallback={selectedCustomer.name || 'Cliente'} size="xl" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedCustomer.name || 'Cliente'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Cliente desde {formatDate(selectedCustomer.created_at)}
                </p>
              </div>
            </div>

            <div
              className="border-y"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 0',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                <Mail className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{selectedCustomer.email}</span>
              </div>
              {selectedCustomer.phone && (
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <Phone className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{selectedCustomer.phone}</span>
                </div>
              )}
              <div className="flex items-start" style={{ gap: '12px' }}>
                <MapPin className="h-5 w-5" style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <span style={{ color: 'var(--text-primary)' }}>{formatAddress(selectedCustomer)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium" style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
                Pets ({selectedCustomer.pets?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCustomer.pets?.length > 0 ? (
                  selectedCustomer.pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center rounded-xl"
                      style={{
                        padding: '12px',
                        gap: '12px',
                        background: 'var(--bg-tertiary)'
                      }}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white">
                        <PawPrint className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pet.name}</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pet.species}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum pet cadastrado</p>
                )}
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-xl"
              style={{
                padding: '16px',
                background: 'var(--accent-purple-bg)'
              }}
            >
              <span style={{ color: 'var(--accent-purple)' }}>Total de agendamentos</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--accent-purple)' }}>
                {selectedCustomer.appointments_count}
              </span>
            </div>

            <ModalActions>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Fechar
              </Button>
            </ModalActions>
          </div>
        )}
      </Modal>
    </div>
  )
}
