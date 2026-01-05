"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  getAppointmentsClient,
  updateAppointmentStatusClient,
} from "@/lib/queries/admin-client";
import {
  Calendar,
  Clock,
  PawPrint,
  Phone,
  MapPin,
  Check,
  X,
  Search,
  ClipboardList,
  RefreshCw,
  FileText,
  Mail,
  Navigation,
  ExternalLink,
  User,
  Ruler,
  AlertTriangle,
  Scissors,
  RotateCcw,
} from "lucide-react";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  price: number;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address_street: string | null;
    address_number: string | null;
    address_complement: string | null;
    address_neighborhood: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zip: string | null;
  } | null;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    size: string | null;
    notes: string | null;
    photo_url: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    base_price: number;
    duration_min: number;
  } | null;
}

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "confirmed", label: "Confirmados" },
  { value: "completed", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

const speciesLabels: Record<string, string> = {
  cachorro: "Cachorro",
  gato: "Gato",
  outro: "Outro",
};

const sizeLabels: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export default function AdminAppointmentsPage() {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type:
      | "confirm"
      | "cancel"
      | "complete"
      | "reactivate_pending"
      | "reactivate_confirmed";
    id: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAppointmentsClient({ status: statusFilter });
      setAppointments(data as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      addToast("Erro ao carregar agendamentos", "error");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  const statusVariants: Record<
    string,
    "warning" | "info" | "success" | "error"
  > = {
    pending: "warning",
    confirmed: "info",
    completed: "success",
    cancelled: "error",
  };

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatFullAddress = (user: Appointment["user"]) => {
    if (!user) return null;
    const parts = [
      user.address_street,
      user.address_number,
      user.address_complement,
    ].filter(Boolean);
    const line1 = parts.join(", ");

    const parts2 = [
      user.address_neighborhood,
      user.address_city,
      user.address_state,
    ].filter(Boolean);
    const line2 = parts2.join(" - ");

    if (!line1 && !line2) return null;
    return { line1, line2, zip: user.address_zip };
  };

  const getGoogleMapsUrl = (user: Appointment["user"]) => {
    if (!user) return null;
    const parts = [
      user.address_street,
      user.address_number,
      user.address_neighborhood,
      user.address_city,
      user.address_state,
      user.address_zip,
    ].filter(Boolean);
    if (parts.length === 0) return null;
    const address = encodeURIComponent(parts.join(", "));
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  };

  const getWazeUrl = (user: Appointment["user"]) => {
    if (!user) return null;
    const parts = [
      user.address_street,
      user.address_number,
      user.address_neighborhood,
      user.address_city,
      user.address_state,
    ].filter(Boolean);
    if (parts.length === 0) return null;
    const address = encodeURIComponent(parts.join(", "));
    return `https://waze.com/ul?q=${address}&navigate=yes`;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      apt.user?.name?.toLowerCase().includes(searchLower) ||
      apt.pet?.name?.toLowerCase().includes(searchLower) ||
      apt.service?.name?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleStatusChange = async (
    id: string,
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    try {
      setIsUpdating(true);
      await updateAppointmentStatusClient(id, newStatus);

      // Update local state
      setAppointments(
        appointments.map((apt) =>
          apt.id === id ? { ...apt, status: newStatus } : apt
        )
      );

      // Update selected appointment if it's the one being changed
      if (selectedAppointment?.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }

      // Enviar emails baseado no status
      if (newStatus === "confirmed") {
        // Email de confirmação quando admin confirma
        const appointment = appointments.find(a => a.id === id);
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "confirmation",
            appointmentId: id,
            email: appointment?.user?.email
          }),
        }).catch((err) =>
          console.error("Error sending confirmation email:", err)
        );
      } else if (newStatus === "cancelled") {
        // Email de cancelamento quando admin cancela
        const appointment = appointments.find(a => a.id === id);
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "cancellation",
            appointmentId: id,
            cancelledBy: "admin",
            email: appointment?.user?.email
          }),
        }).catch((err) =>
          console.error("Error sending cancellation email:", err)
        );
      }

      const messages = {
        confirmed: "Agendamento confirmado!",
        completed: "Agendamento concluído!",
        cancelled: "Agendamento cancelado!",
        pending: "Agendamento atualizado!",
      };
      addToast(messages[newStatus], "success");
    } catch (error) {
      console.error("Error updating appointment status:", error);
      addToast("Erro ao atualizar agendamento", "error");
    } finally {
      setIsUpdating(false);
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
    }
  };

  const openConfirmModal = (
    type:
      | "confirm"
      | "cancel"
      | "complete"
      | "reactivate_pending"
      | "reactivate_confirmed",
    id: string
  ) => {
    setConfirmAction({ type, id });
    setIsConfirmModalOpen(true);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    const statusMap: Record<
      string,
      "pending" | "confirmed" | "completed" | "cancelled"
    > = {
      confirm: "confirmed",
      cancel: "cancelled",
      complete: "completed",
      reactivate_pending: "pending",
      reactivate_confirmed: "confirmed",
    };
    handleStatusChange(confirmAction.id, statusMap[confirmAction.type]);
  };

  const getConfirmModalContent = () => {
    if (!confirmAction)
      return {
        title: "",
        message: "",
        buttonText: "",
        variant: "default" as const,
      };

    switch (confirmAction.type) {
      case "confirm":
        return {
          title: "Confirmar Agendamento",
          message:
            "Tem certeza que deseja confirmar este agendamento? O cliente será notificado.",
          buttonText: "Confirmar",
          variant: "default" as const,
        };
      case "cancel":
        return {
          title: "Cancelar Agendamento",
          message:
            "Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.",
          buttonText: "Cancelar",
          variant: "destructive" as const,
        };
      case "complete":
        return {
          title: "Concluir Agendamento",
          message:
            "Tem certeza que deseja marcar este agendamento como concluído?",
          buttonText: "Concluir",
          variant: "default" as const,
        };
      case "reactivate_pending":
        return {
          title: "Reativar como Pendente",
          message:
            "Tem certeza que deseja reativar este agendamento cancelado como pendente?",
          buttonText: "Reativar",
          variant: "default" as const,
        };
      case "reactivate_confirmed":
        return {
          title: "Reativar como Confirmado",
          message:
            "Tem certeza que deseja reativar este agendamento cancelado como confirmado?",
          buttonText: "Reativar",
          variant: "default" as const,
        };
      default:
        return {
          title: "",
          message: "",
          buttonText: "",
          variant: "default" as const,
        };
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="w-full"
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between"
          style={{ gap: "16px" }}
        >
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-[1.5rem] sm:text-[1.75rem] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Agendamentos
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Gerencie todos os agendamentos
              </p>
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            height: "72px",
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
          }}
        />

        {/* List Skeleton */}
        <div
          className="rounded-2xl border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          <div
            className="flex items-center justify-between border-b"
            style={{
              padding: "20px 24px",
              borderColor: "var(--border-primary)",
            }}
          >
            <div
              className="h-6 w-48 rounded animate-pulse"
              style={{ background: "var(--bg-tertiary)" }}
            />
            <div
              className="h-6 w-24 rounded animate-pulse"
              style={{ background: "var(--bg-tertiary)" }}
            />
          </div>
          <div
            style={{
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{
                  height: "100px",
                  background: "var(--bg-tertiary)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between"
        style={{ gap: "16px" }}
      >
        <div className="flex items-center" style={{ gap: "12px" }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="text-[1.5rem] sm:text-[1.75rem] font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Agendamentos
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Gerencie todos os agendamentos
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAppointments}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl border"
        style={{
          padding: "16px",
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex flex-col sm:flex-row" style={{ gap: "16px" }}>
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--text-muted)" }}
            />
            <Input
              placeholder="Buscar por cliente, pet ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div
        className="rounded-2xl border"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          className="flex items-center justify-between border-b"
          style={{
            padding: "20px 24px",
            borderColor: "var(--border-primary)",
          }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Lista de Agendamentos
          </h2>
          <Badge variant="info">{filteredAppointments.length} registros</Badge>
        </div>

        <div style={{ padding: "12px 16px" }} className="sm:p-6">
          <div
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            style={{ gap: "16px" }}
          >
            {filteredAppointments.map((appointment) => {
              const statusColors: Record<
                string,
                { bg: string; border: string; text: string }
              > = {
                pending: {
                  bg: "var(--accent-yellow-bg)",
                  border: "var(--accent-yellow)",
                  text: "var(--accent-yellow)",
                },
                confirmed: {
                  bg: "var(--accent-blue-bg)",
                  border: "var(--accent-blue)",
                  text: "var(--accent-blue)",
                },
                completed: {
                  bg: "var(--accent-green-bg)",
                  border: "var(--accent-green)",
                  text: "var(--accent-green)",
                },
                cancelled: {
                  bg: "var(--accent-red-bg)",
                  border: "var(--accent-red)",
                  text: "var(--accent-red)",
                },
              };
              const colors =
                statusColors[appointment.status] || statusColors.pending;

              return (
                <div
                  key={appointment.id}
                  className="flex flex-col rounded-2xl border-l-4 transition-all hover:shadow-lg cursor-pointer"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                    borderLeftColor: colors.border,
                    overflow: "hidden",
                  }}
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setIsDetailModalOpen(true);
                  }}
                >
                  {/* Header with date/time and status */}
                  <div
                    className="flex items-center justify-between"
                    style={{
                      padding: "12px 16px",
                      background: colors.bg,
                    }}
                  >
                    <div className="flex items-center" style={{ gap: "12px" }}>
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          width: "44px",
                          height: "44px",
                          background: "var(--bg-primary)",
                        }}
                      >
                        <div className="text-center">
                          <p
                            className="text-xs font-medium uppercase"
                            style={{
                              color: "var(--text-muted)",
                              lineHeight: 1,
                            }}
                          >
                            {new Date(appointment.scheduled_date + "T12:00:00")
                              .toLocaleDateString("pt-BR", { weekday: "short" })
                              .replace(".", "")}
                          </p>
                          <p
                            className="text-lg font-bold"
                            style={{
                              color: "var(--text-primary)",
                              lineHeight: 1.1,
                            }}
                          >
                            {new Date(
                              appointment.scheduled_date + "T12:00:00"
                            ).getDate()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(
                            appointment.scheduled_date + "T12:00:00"
                          ).toLocaleDateString("pt-BR", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{ color: colors.text }}
                        >
                          {appointment.scheduled_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={statusVariants[appointment.status] || "info"}
                    >
                      {statusLabels[appointment.status] || appointment.status}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "16px" }}>
                    {/* Client & Pet Info */}
                    <div
                      className="flex items-start"
                      style={{ gap: "12px", marginBottom: "12px" }}
                    >
                      {appointment.pet?.photo_url ? (
                        <div
                          className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 border-2"
                          style={{ borderColor: colors.border }}
                        >
                          <Image
                            src={appointment.pet.photo_url}
                            alt={appointment.pet.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-14 w-14 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${colors.border}, var(--accent-purple))`,
                          }}
                        >
                          <PawPrint className="h-7 w-7" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-base"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {appointment.pet?.name || "Pet"}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {appointment.pet?.breed ||
                            appointment.pet?.species ||
                            "Sem raça definida"}
                          {appointment.pet?.size &&
                            ` • ${appointment.pet.size}`}
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: "var(--text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          <User
                            className="h-3.5 w-3.5 inline mr-1"
                            style={{ verticalAlign: "text-bottom" }}
                          />
                          {appointment.user?.name || "Cliente"}
                        </p>
                      </div>
                    </div>

                    {/* Service */}
                    <div
                      className="flex items-center justify-between rounded-lg"
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-secondary)",
                        marginBottom: "12px",
                      }}
                    >
                      <div className="flex items-center" style={{ gap: "8px" }}>
                        <Scissors
                          className="h-4 w-4"
                          style={{ color: "var(--accent-purple)" }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {appointment.service?.name || "Serviço"}
                        </span>
                      </div>
                      {appointment.service?.base_price && (
                        <span
                          className="font-bold"
                          style={{ color: "var(--accent-green)" }}
                        >
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(appointment.service.base_price)}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {(appointment.status === "pending" ||
                      appointment.status === "confirmed") && (
                      <div className="grid grid-cols-2" style={{ gap: "8px" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal("cancel", appointment.id);
                          }}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        {appointment.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                              setIsDetailModalOpen(true);
                            }}
                            disabled={isUpdating}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                        )}
                        {appointment.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirmModal("complete", appointment.id);
                            }}
                            disabled={isUpdating}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Reactivate cancelled appointments */}
                    {appointment.status === "cancelled" && (
                      <div className="grid grid-cols-2" style={{ gap: "8px" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal(
                              "reactivate_pending",
                              appointment.id
                            );
                          }}
                          disabled={isUpdating}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Pendente
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal(
                              "reactivate_confirmed",
                              appointment.id
                            );
                          }}
                          disabled={isUpdating}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Confirmado
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAppointments.length === 0 && (
              <div
                className="text-center"
                style={{ padding: "32px", color: "var(--text-muted)" }}
              >
                <Calendar
                  className="h-12 w-12 mx-auto opacity-50"
                  style={{ marginBottom: "8px" }}
                />
                <p>Nenhum agendamento encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setConfirmAction(null);
        }}
        title={getConfirmModalContent().title}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="flex items-start" style={{ gap: "12px" }}>
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  confirmAction?.type === "cancel"
                    ? "var(--accent-red-bg)"
                    : "var(--accent-purple-bg)",
              }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{
                  color:
                    confirmAction?.type === "cancel"
                      ? "var(--accent-red)"
                      : "var(--accent-purple)",
                }}
              />
            </div>
            <p style={{ color: "var(--text-primary)", lineHeight: "1.5" }}>
              {getConfirmModalContent().message}
            </p>
          </div>

          <div
            className="grid grid-cols-2"
            style={{ gap: "12px", marginTop: "8px" }}
          >
            <Button
              variant="secondary"
              onClick={() => {
                setIsConfirmModalOpen(false);
                setConfirmAction(null);
              }}
              style={{ height: "52px" }}
            >
              Voltar
            </Button>
            <Button
              variant={getConfirmModalContent().variant}
              onClick={executeConfirmAction}
              disabled={isUpdating}
              style={{ height: "52px" }}
            >
              {isUpdating
                ? "Processando..."
                : getConfirmModalContent().buttonText}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalhes do Agendamento"
      >
        {selectedAppointment && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Header with status and price */}
            <div className="flex items-center justify-between">
              <Badge
                variant={statusVariants[selectedAppointment.status] || "info"}
                className="text-sm"
              >
                {statusLabels[selectedAppointment.status] ||
                  selectedAppointment.status}
              </Badge>
              <span
                className="text-xl font-bold"
                style={{ color: "var(--accent-green)" }}
              >
                {formatCurrency(
                  selectedAppointment.price ||
                    selectedAppointment.service?.base_price ||
                    0
                )}
              </span>
            </div>

            {/* Service & Schedule Info */}
            <div
              className="rounded-xl"
              style={{
                padding: "16px",
                background: "var(--bg-tertiary)",
              }}
            >
              <div
                className="flex items-center"
                style={{ gap: "12px", marginBottom: "12px" }}
              >
                <Calendar
                  className="h-5 w-5"
                  style={{ color: "var(--accent-purple)" }}
                />
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Serviço
                  </p>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedAppointment.service?.name} (
                    {selectedAppointment.service?.duration_min || 60} min)
                  </p>
                </div>
              </div>
              <div className="flex items-center" style={{ gap: "12px" }}>
                <Clock
                  className="h-5 w-5"
                  style={{ color: "var(--accent-purple)" }}
                />
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Data e Hora
                  </p>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatDate(selectedAppointment.scheduled_date)} às{" "}
                    {selectedAppointment.scheduled_time?.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {/* Pet Info */}
            <div
              className="rounded-xl"
              style={{
                padding: "16px",
                background: "var(--bg-tertiary)",
              }}
            >
              <h3
                className="font-semibold flex items-center"
                style={{
                  gap: "8px",
                  marginBottom: "12px",
                  color: "var(--text-primary)",
                }}
              >
                <PawPrint
                  className="h-5 w-5"
                  style={{ color: "var(--accent-pink)" }}
                />
                Pet
              </h3>
              <div className="flex" style={{ gap: "16px" }}>
                {selectedAppointment.pet?.photo_url ? (
                  <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedAppointment.pet.photo_url}
                      alt={selectedAppointment.pet.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#f472b6] flex items-center justify-center text-white flex-shrink-0">
                    <PawPrint className="h-10 w-10" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedAppointment.pet?.name}
                  </p>
                  <div
                    className="flex flex-wrap items-center"
                    style={{ gap: "8px", marginTop: "4px" }}
                  >
                    <span
                      className="text-xs rounded-full"
                      style={{
                        padding: "2px 8px",
                        background: "var(--accent-purple-bg)",
                        color: "var(--accent-purple)",
                      }}
                    >
                      {speciesLabels[selectedAppointment.pet?.species || ""] ||
                        selectedAppointment.pet?.species}
                    </span>
                    {selectedAppointment.pet?.breed && (
                      <span
                        className="text-xs rounded-full"
                        style={{
                          padding: "2px 8px",
                          background: "var(--accent-blue-bg)",
                          color: "var(--accent-blue)",
                        }}
                      >
                        {selectedAppointment.pet.breed}
                      </span>
                    )}
                    {selectedAppointment.pet?.size && (
                      <span
                        className="text-xs rounded-full flex items-center"
                        style={{
                          padding: "2px 8px",
                          gap: "4px",
                          background: "var(--accent-green-bg)",
                          color: "var(--accent-green)",
                        }}
                      >
                        <Ruler className="h-3 w-3" />
                        {sizeLabels[selectedAppointment.pet.size] ||
                          selectedAppointment.pet.size}
                      </span>
                    )}
                  </div>
                  {selectedAppointment.pet?.notes && (
                    <p
                      className="text-sm mt-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {selectedAppointment.pet.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div
              className="rounded-xl"
              style={{
                padding: "16px",
                background: "var(--bg-tertiary)",
              }}
            >
              <h3
                className="font-semibold flex items-center"
                style={{
                  gap: "8px",
                  marginBottom: "12px",
                  color: "var(--text-primary)",
                }}
              >
                <User
                  className="h-5 w-5"
                  style={{ color: "var(--accent-blue)" }}
                />
                Cliente
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedAppointment.user?.name || "Cliente"}
                </p>

                {selectedAppointment.user?.phone && (
                  <a
                    href={`tel:${selectedAppointment.user.phone}`}
                    className="flex items-center text-sm hover:underline"
                    style={{ gap: "8px", color: "var(--text-muted)" }}
                  >
                    <Phone className="h-4 w-4" />
                    {selectedAppointment.user.phone}
                  </a>
                )}

                {selectedAppointment.user?.email && (
                  <a
                    href={`mailto:${selectedAppointment.user.email}`}
                    className="flex items-center text-sm hover:underline"
                    style={{ gap: "8px", color: "var(--text-muted)" }}
                  >
                    <Mail className="h-4 w-4" />
                    {selectedAppointment.user.email}
                  </a>
                )}

                {formatFullAddress(selectedAppointment.user) && (
                  <div>
                    <div
                      className="flex items-start"
                      style={{ gap: "8px", color: "var(--text-muted)" }}
                    >
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p>
                          {formatFullAddress(selectedAppointment.user)?.line1}
                        </p>
                        <p>
                          {formatFullAddress(selectedAppointment.user)?.line2}
                        </p>
                        {formatFullAddress(selectedAppointment.user)?.zip && (
                          <p>
                            CEP:{" "}
                            {formatFullAddress(selectedAppointment.user)?.zip}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Map Links */}
                    <div className="flex flex-wrap mt-3" style={{ gap: "8px" }}>
                      {getGoogleMapsUrl(selectedAppointment.user) && (
                        <a
                          href={getGoogleMapsUrl(selectedAppointment.user)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-xs font-medium rounded-lg transition-colors hover:opacity-80"
                          style={{
                            padding: "8px 12px",
                            gap: "6px",
                            background: "var(--accent-blue-bg)",
                            color: "var(--accent-blue)",
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Google Maps
                        </a>
                      )}
                      {getWazeUrl(selectedAppointment.user) && (
                        <a
                          href={getWazeUrl(selectedAppointment.user)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-xs font-medium rounded-lg transition-colors hover:opacity-80"
                          style={{
                            padding: "8px 12px",
                            gap: "6px",
                            background: "var(--accent-purple-bg)",
                            color: "var(--accent-purple)",
                          }}
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Waze
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedAppointment.notes && (
              <div
                className="rounded-xl"
                style={{
                  padding: "16px",
                  background: "var(--accent-yellow-bg)",
                }}
              >
                <h3
                  className="font-semibold flex items-center"
                  style={{
                    gap: "8px",
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  <FileText
                    className="h-5 w-5"
                    style={{ color: "var(--accent-yellow)" }}
                  />
                  Observações do Agendamento
                </h3>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {selectedAppointment.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            {selectedAppointment.status === "pending" && (
              <div
                className="grid grid-cols-2"
                style={{ gap: "12px", marginTop: "8px" }}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openConfirmModal("cancel", selectedAppointment.id);
                  }}
                  disabled={isUpdating}
                  style={{ height: "52px" }}
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openConfirmModal("confirm", selectedAppointment.id);
                  }}
                  disabled={isUpdating}
                  style={{ height: "52px" }}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Confirmar
                </Button>
              </div>
            )}
            {selectedAppointment.status === "confirmed" && (
              <div
                className="grid grid-cols-2"
                style={{ gap: "12px", marginTop: "8px" }}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openConfirmModal("cancel", selectedAppointment.id);
                  }}
                  disabled={isUpdating}
                  style={{ height: "52px" }}
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openConfirmModal("complete", selectedAppointment.id);
                  }}
                  disabled={isUpdating}
                  style={{ height: "52px" }}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Concluir
                </Button>
              </div>
            )}
            {(selectedAppointment.status === "completed" ||
              selectedAppointment.status === "cancelled") && (
              <div style={{ marginTop: "8px" }}>
                <Button
                  variant="secondary"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full"
                  style={{ height: "52px" }}
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
