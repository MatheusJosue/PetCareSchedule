"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { useTheme } from "@/contexts/theme-context"
import { getSettingsClient, updateSettingClient } from "@/lib/queries/admin-client"
import {
  Settings,
  Store,
  Clock,
  Sun,
  Moon,
  Save,
  Bell,
  Shield,
  Palette,
  RefreshCw,
} from "lucide-react"

interface BusinessSettings {
  name: string
  email: string
  phone: string
  address: string
  description: string
  openingTime: string
  closingTime: string
  slotDuration: number
  maxAdvanceDays: number
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  appointmentReminders: boolean
  marketingEmails: boolean
}

const defaultBusinessSettings: BusinessSettings = {
  name: "Pet Care Schedule",
  email: "contato@petcare.com",
  phone: "(11) 99999-9999",
  address: "Jundiaí - SP",
  description: "O melhor cuidado para seu pet",
  openingTime: "08:00",
  closingTime: "18:00",
  slotDuration: 60,
  maxAdvanceDays: 30,
}

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  appointmentReminders: true,
  marketingEmails: false,
}

export default function AdminSettingsPage() {
  const { addToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"business" | "notifications" | "appearance" | "security">("business")

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultBusinessSettings)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const settings = await getSettingsClient()

      // Parse business settings
      if (settings.business) {
        setBusinessSettings(settings.business as BusinessSettings)
      }

      // Parse notification settings
      if (settings.notifications) {
        setNotificationSettings(settings.notifications as NotificationSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Use defaults on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSaveBusinessSettings = async () => {
    setIsSaving(true)
    try {
      await updateSettingClient('business', businessSettings)
      addToast("Configurações salvas com sucesso!", "success")
    } catch (error) {
      console.error('Error saving business settings:', error)
      addToast("Erro ao salvar configurações", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setIsSaving(true)
    try {
      await updateSettingClient('notifications', notificationSettings)
      addToast("Configurações de notificação salvas!", "success")
    } catch (error) {
      console.error('Error saving notification settings:', error)
      addToast("Erro ao salvar configurações", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: "business" as const, label: "Negócio", icon: Store },
    { id: "notifications" as const, label: "Notificações", icon: Bell },
    { id: "appearance" as const, label: "Aparência", icon: Palette },
    { id: "security" as const, label: "Segurança", icon: Shield },
  ]

  // Loading skeleton
  if (isLoading) {
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
                Configurações
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Gerencie as configurações do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            height: '56px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        />

        {/* Content Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            height: '400px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        />
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
              Configurações
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gerencie as configurações do sistema
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchSettings} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div
        className="rounded-2xl border"
        style={{
          padding: '8px',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="flex flex-wrap" style={{ gap: '8px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center rounded-xl transition-all"
              style={{
                padding: '12px 16px',
                gap: '8px',
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                fontWeight: activeTab === tab.id ? 600 : 400
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "business" && (
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
              Informações do Negócio
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Configure as informações da sua empresa
            </p>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
              <Input
                label="Nome do Estabelecimento"
                value={businessSettings.name}
                onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={businessSettings.email}
                onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
              <Input
                label="Telefone"
                value={businessSettings.phone}
                onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
              />
              <Input
                label="Endereço"
                value={businessSettings.address}
                onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
              />
            </div>

            <Textarea
              label="Descrição"
              value={businessSettings.description}
              onChange={(e) => setBusinessSettings({ ...businessSettings, description: e.target.value })}
              placeholder="Descreva seu negócio..."
            />

            <div
              className="rounded-xl border"
              style={{
                padding: '20px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h3 className="font-semibold flex items-center" style={{ gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                <Clock className="h-5 w-5" style={{ color: 'var(--accent-purple)' }} />
                Horário de Funcionamento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4" style={{ gap: '16px' }}>
                <Input
                  label="Abertura"
                  type="time"
                  value={businessSettings.openingTime}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, openingTime: e.target.value })}
                />
                <Input
                  label="Fechamento"
                  type="time"
                  value={businessSettings.closingTime}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, closingTime: e.target.value })}
                />
                <Input
                  label="Duração do Slot (min)"
                  type="number"
                  value={businessSettings.slotDuration}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, slotDuration: Number(e.target.value) })}
                  min={15}
                  step={15}
                />
                <Input
                  label="Dias de Antecedência"
                  type="number"
                  value={businessSettings.maxAdvanceDays}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, maxAdvanceDays: Number(e.target.value) })}
                  min={1}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBusinessSettings} isLoading={isSaving}>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
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
              Configurações de Notificação
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gerencie como você recebe notificações
            </p>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'emailNotifications', label: 'Notificações por Email', description: 'Receba atualizações importantes por email' },
              { key: 'smsNotifications', label: 'Notificações por SMS', description: 'Receba notificações por mensagem de texto' },
              { key: 'appointmentReminders', label: 'Lembretes de Agendamento', description: 'Enviar lembretes automáticos para clientes' },
              { key: 'marketingEmails', label: 'Emails de Marketing', description: 'Receba novidades e promoções' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border"
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    [item.key]: !notificationSettings[item.key as keyof NotificationSettings]
                  })}
                  className="relative w-12 h-6 rounded-full transition-colors"
                  style={{
                    background: notificationSettings[item.key as keyof NotificationSettings]
                      ? 'linear-gradient(to right, #7c3aed, #a855f7)'
                      : 'var(--border-primary)'
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
                    style={{
                      left: notificationSettings[item.key as keyof NotificationSettings] ? '28px' : '4px'
                    }}
                  />
                </button>
              </div>
            ))}

            <div className="flex justify-end" style={{ marginTop: '8px' }}>
              <Button onClick={handleSaveNotificationSettings} isLoading={isSaving}>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appearance" && (
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
              Aparência
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Personalize a aparência do sistema
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <div
              className="rounded-xl border"
              style={{
                padding: '20px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h3 className="font-semibold" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                Tema
              </h3>
              <div className="flex" style={{ gap: '12px' }}>
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className="flex-1 flex items-center justify-center rounded-xl border-2 transition-all"
                  style={{
                    padding: '24px',
                    gap: '12px',
                    background: theme === 'light' ? 'var(--accent-purple-bg)' : 'var(--bg-secondary)',
                    borderColor: theme === 'light' ? 'var(--accent-purple)' : 'var(--border-primary)'
                  }}
                >
                  <Sun className="h-6 w-6" style={{ color: theme === 'light' ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
                  <span
                    className="font-medium"
                    style={{ color: theme === 'light' ? 'var(--accent-purple)' : 'var(--text-muted)' }}
                  >
                    Claro
                  </span>
                </button>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className="flex-1 flex items-center justify-center rounded-xl border-2 transition-all"
                  style={{
                    padding: '24px',
                    gap: '12px',
                    background: theme === 'dark' ? 'var(--accent-purple-bg)' : 'var(--bg-secondary)',
                    borderColor: theme === 'dark' ? 'var(--accent-purple)' : 'var(--border-primary)'
                  }}
                >
                  <Moon className="h-6 w-6" style={{ color: theme === 'dark' ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
                  <span
                    className="font-medium"
                    style={{ color: theme === 'dark' ? 'var(--accent-purple)' : 'var(--text-muted)' }}
                  >
                    Escuro
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
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
              Segurança
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gerencie suas configurações de segurança
            </p>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              className="rounded-xl border"
              style={{
                padding: '20px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h3 className="font-semibold" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                Alterar Senha
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Senha Atual"
                  type="password"
                  placeholder="Digite sua senha atual"
                />
                <Input
                  label="Nova Senha"
                  type="password"
                  placeholder="Digite a nova senha"
                />
                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  placeholder="Confirme a nova senha"
                />
                <div className="flex justify-end">
                  <Button>
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border"
              style={{
                padding: '20px',
                background: 'var(--accent-red-bg)',
                borderColor: 'var(--accent-red)'
              }}
            >
              <h3 className="font-semibold" style={{ marginBottom: '8px', color: 'var(--accent-red)' }}>
                Zona de Perigo
              </h3>
              <p className="text-sm" style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
                Ações irreversíveis. Tenha cuidado.
              </p>
              <Button variant="destructive">
                Excluir Conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
