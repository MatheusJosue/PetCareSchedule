import { createClient } from "@/lib/supabase/client"
import type { Appointment, AppointmentStatus } from "@/types/database"

const supabase = createClient()

export interface CreateAppointmentData {
  pet_id: string
  service_id: string
  scheduled_date: string
  scheduled_time: string
  notes?: string
}

export interface AppointmentWithDetails extends Omit<Appointment, 'pet' | 'service' | 'user'> {
  pet: {
    id: string
    name: string
    species: string
    breed?: string
    photo_url?: string
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
  user?: {
    id: string
    full_name: string
    email: string
    phone?: string
  }
}

export async function getAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration)
    `)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })

  if (error) throw error
  return data as AppointmentWithDetails[]
}

export async function getAppointmentById(id: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data as AppointmentWithDetails
}

export async function getUpcomingAppointments() {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration)
    `)
    .gte("scheduled_date", today)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })

  if (error) throw error
  return data as AppointmentWithDetails[]
}

export async function getPastAppointments() {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration)
    `)
    .or(`scheduled_date.lt.${today},status.eq.completed,status.eq.cancelled`)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false })

  if (error) throw error
  return data as AppointmentWithDetails[]
}

export async function createAppointment(appointment: CreateAppointmentData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const insertData = {
    pet_id: appointment.pet_id,
    service_id: appointment.service_id,
    scheduled_date: appointment.scheduled_date,
    scheduled_time: appointment.scheduled_time,
    notes: appointment.notes,
    user_id: user.id,
    status: "pending" as const,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("appointments")
    .insert(insertData)
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration)
    `)
    .single()

  if (error) throw error
  return data as AppointmentWithDetails
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration)
    `)
    .single()

  if (error) throw error
  return data as AppointmentWithDetails
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  return updateAppointment(id, { status })
}

export async function cancelAppointment(id: string) {
  return updateAppointmentStatus(id, "cancelled")
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Admin functions
export async function getAllAppointments(filters?: {
  status?: AppointmentStatus
  date?: string
  userId?: string
}) {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration),
      user:users(id, full_name, email, phone)
    `)

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.date) {
    query = query.eq("scheduled_date", filters.date)
  }
  if (filters?.userId) {
    query = query.eq("user_id", filters.userId)
  }

  const { data, error } = await query
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })

  if (error) throw error
  return data as AppointmentWithDetails[]
}

export async function getAppointmentsByDate(date: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      pet:pets(id, name, species, breed, photo_url),
      service:services(id, name, price, duration),
      user:users(id, full_name, email, phone)
    `)
    .eq("scheduled_date", date)
    .order("scheduled_time", { ascending: true })

  if (error) throw error
  return data as AppointmentWithDetails[]
}

export async function getAvailableSlots(date: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc("get_available_slots", { p_date: date })

  if (error) throw error
  return data as string[]
}

export async function checkSlotAvailability(date: string, time: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc("is_slot_available", { p_date: date, p_time: time })

  if (error) throw error
  return data as boolean
}
