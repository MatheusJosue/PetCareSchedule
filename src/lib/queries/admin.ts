import { createClient } from "@/lib/supabase/server"

// ============================================
// TYPES
// ============================================

interface UpcomingAppointment {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  price: number
  user: { id: string; name: string | null; phone: string | null } | null
  pet: { id: string; name: string } | null
  service: { id: string; name: string; base_price: number } | null
}

interface AppointmentWithDetails {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  price: number
  notes: string | null
  user: {
    id: string
    name: string | null
    phone: string | null
    address_street: string | null
    address_number: string | null
    address_neighborhood: string | null
    address_city: string | null
  } | null
  pet: { id: string; name: string; species: string } | null
  service: { id: string; name: string; base_price: number } | null
}

interface CustomerWithDetails {
  id: string
  name: string | null
  email: string
  phone: string | null
  address_street: string | null
  address_number: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  created_at: string
  pets: { id: string; name: string; species: string }[]
  appointments_count: number
}

interface CalendarAppointment {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  user: { id: string; name: string | null; phone: string | null } | null
  pet: { id: string; name: string; species: string } | null
  service: { id: string; name: string } | null
}

// ============================================
// DASHBOARD QUERIES
// ============================================

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = getStartOfWeek()
  const endOfWeek = getEndOfWeek()

  // Upcoming appointments count (today and future, pending or confirmed)
  const { count: upcomingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_date', today)
    .in('status', ['pending', 'confirmed'])

  // This week's appointments count
  const { count: weekCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_date', startOfWeek)
    .lte('scheduled_date', endOfWeek)
    .neq('status', 'cancelled')

  // Total clients
  const { count: totalClients } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')

  // Total pets
  const { count: totalPets } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })

  // Pending appointments (all pending, regardless of date - they need attention)
  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Upcoming revenue (pending and confirmed appointments)
  const { data: upcomingAppointmentsData } = await supabase
    .from('appointments')
    .select('price')
    .gte('scheduled_date', today)
    .in('status', ['pending', 'confirmed'])

  const upcomingRevenue = (upcomingAppointmentsData as { price: number }[] | null)?.reduce((sum, apt) => sum + Number(apt.price), 0) || 0

  return {
    upcomingCount: upcomingCount || 0,
    weekCount: weekCount || 0,
    totalClients: totalClients || 0,
    totalPets: totalPets || 0,
    pendingCount: pendingCount || 0,
    upcomingRevenue,
  }
}

export async function getUpcomingAppointments(limit: number = 10): Promise<UpcomingAppointment[]> {
  const supabase = await createClient()

  // First, get pending appointments that need attention (regardless of date)
  const { data: pendingData, error: pendingError } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      price,
      user:users!appointments_user_id_fkey(id, name, phone),
      pet:pets(id, name),
      service:services(id, name, base_price)
    `)
    .eq('status', 'pending')
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(limit)

  if (pendingError) throw pendingError

  // Then get confirmed appointments for today and future
  const today = new Date().toISOString().split('T')[0]
  const { data: confirmedData, error: confirmedError } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      price,
      user:users!appointments_user_id_fkey(id, name, phone),
      pet:pets(id, name),
      service:services(id, name, base_price)
    `)
    .eq('status', 'confirmed')
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(limit)

  if (confirmedError) throw confirmedError

  // Combine and sort, prioritizing pending
  const allAppointments = [...(pendingData || []), ...(confirmedData || [])]

  // Remove duplicates (if any) and sort by date/time
  const uniqueAppointments = allAppointments
    .filter((apt, index, self) => self.findIndex(a => a.id === apt.id) === index)
    .sort((a, b) => {
      // Pending always comes first
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (b.status === 'pending' && a.status !== 'pending') return 1
      // Then sort by date and time
      const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date)
      if (dateCompare !== 0) return dateCompare
      return (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
    })
    .slice(0, limit)

  return uniqueAppointments as unknown as UpcomingAppointment[]
}

// ============================================
// APPOINTMENTS QUERIES
// ============================================

export async function getAppointments(filters?: {
  status?: string
  search?: string
}): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      price,
      notes,
      user:users!appointments_user_id_fkey(id, name, phone, address_street, address_number, address_neighborhood, address_city),
      pet:pets(id, name, species),
      service:services(id, name, base_price)
    `)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: true })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as unknown as AppointmentWithDetails[]
}

export async function updateAppointmentStatus(id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') {
  const supabase = await createClient()

  const updates: { status: string; completed_at?: string; cancelled_at?: string } = { status }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('appointments')
    .update(updates as never)
    .eq('id', id)

  if (error) throw error
}

// ============================================
// CUSTOMERS QUERIES
// ============================================

interface CustomerRaw {
  id: string
  name: string | null
  email: string
  phone: string | null
  address_street: string | null
  address_number: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  created_at: string
  pets: { id: string; name: string; species: string }[]
}

export async function getCustomers(search?: string): Promise<CustomerWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      phone,
      address_street,
      address_number,
      address_neighborhood,
      address_city,
      address_state,
      created_at,
      pets(id, name, species)
    `)
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  const customers = (data || []) as unknown as CustomerRaw[]

  // Get appointment counts for each customer
  const customersWithCounts = await Promise.all(
    customers.map(async (customer) => {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', customer.id)

      return {
        ...customer,
        appointments_count: count || 0,
      }
    })
  )

  return customersWithCounts
}

// ============================================
// SERVICES QUERIES
// ============================================

export async function getServices() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createService(service: {
  name: string
  description?: string
  duration_min: number
  base_price: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .insert(service as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateService(id: string, service: {
  name?: string
  description?: string
  duration_min?: number
  base_price?: number
  active?: boolean
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .update(service as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteService(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// PLANS QUERIES
// ============================================

export async function getPlans() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('type', { ascending: true })
    .order('price', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createPlan(plan: {
  name: string
  description?: string
  type: 'avulso' | 'semanal' | 'mensal'
  sessions_per_period: number
  price: number
  discount_percent?: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plans')
    .insert(plan as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlan(id: string, plan: {
  name?: string
  description?: string
  type?: 'avulso' | 'semanal' | 'mensal'
  sessions_per_period?: number
  price?: number
  discount_percent?: number
  active?: boolean
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plans')
    .update(plan as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePlan(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// CALENDAR QUERIES
// ============================================

export async function getCalendarAppointments(startDate: string, endDate: string): Promise<CalendarAppointment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      user:users!appointments_user_id_fkey(id, name, phone),
      pet:pets(id, name, species),
      service:services(id, name)
    `)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .neq('status', 'cancelled')
    .order('scheduled_time', { ascending: true })

  if (error) throw error
  return (data || []) as unknown as CalendarAppointment[]
}

export async function getBlockedSlots(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_blocked', true)

  if (error) throw error
  return data || []
}

export async function blockSlot(date: string, startTime: string, endTime: string, reason?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('availability_slots')
    .upsert({
      date,
      start_time: startTime,
      end_time: endTime,
      is_blocked: true,
      block_reason: reason,
    } as never)

  if (error) throw error
}

export async function unblockSlot(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('availability_slots')
    .update({ is_blocked: false, block_reason: null } as never)
    .eq('id', id)

  if (error) throw error
}

// ============================================
// SETTINGS QUERIES
// ============================================

interface SettingRow {
  key: string
  value: unknown
}

export async function getSettings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('settings')
    .select('*')

  if (error) throw error

  // Convert to object
  const settings: Record<string, unknown> = {}
  const settingsData = (data || []) as unknown as SettingRow[]
  settingsData.forEach((setting) => {
    settings[setting.key] = setting.value
  })

  return settings
}

export async function updateSetting(key: string, value: unknown) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    } as never)

  if (error) throw error
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStartOfWeek(): string {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

function getEndOfWeek(): string {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? 0 : 7)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}
