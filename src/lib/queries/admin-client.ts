import { createClient } from "@/lib/supabase/client"

// ============================================
// TYPES
// ============================================

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
    email: string | null
    phone: string | null
    address_street: string | null
    address_number: string | null
    address_complement: string | null
    address_neighborhood: string | null
    address_city: string | null
    address_state: string | null
    address_zip: string | null
  } | null
  pet: {
    id: string
    name: string
    species: string
    breed: string | null
    size: string | null
    notes: string | null
    photo_url: string | null
  } | null
  service: { id: string; name: string; base_price: number; duration_min: number } | null
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
// APPOINTMENTS QUERIES (Client-side)
// ============================================

export async function getAppointmentsClient(filters?: {
  status?: string
  search?: string
}): Promise<AppointmentWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      price,
      notes,
      user:users!appointments_user_id_fkey(id, name, email, phone, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip),
      pet:pets(id, name, species, breed, size, notes, photo_url),
      service:services(id, name, base_price, duration_min)
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

export async function updateAppointmentStatusClient(id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') {
  const supabase = createClient()

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
// CUSTOMERS QUERIES (Client-side)
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

export async function getCustomersClient(search?: string): Promise<CustomerWithDetails[]> {
  const supabase = createClient()

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
// SERVICES QUERIES (Client-side)
// ============================================

export async function getServicesClient() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createServiceClient(service: {
  name: string
  description?: string
  duration_min: number
  base_price: number
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .insert(service as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateServiceClient(id: string, service: {
  name?: string
  description?: string
  duration_min?: number
  base_price?: number
  active?: boolean
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .update(service as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteServiceClient(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// PLANS QUERIES (Client-side)
// ============================================

export async function getPlansClient() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('type', { ascending: true })
    .order('price', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createPlanClient(plan: {
  name: string
  description?: string
  type: 'avulso' | 'semanal' | 'mensal'
  sessions_per_period: number
  price: number
  discount_percent?: number
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('plans')
    .insert(plan as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlanClient(id: string, plan: {
  name?: string
  description?: string
  type?: 'avulso' | 'semanal' | 'mensal'
  sessions_per_period?: number
  price?: number
  discount_percent?: number
  active?: boolean
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('plans')
    .update(plan as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePlanClient(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// CALENDAR QUERIES (Client-side)
// ============================================

export async function getCalendarAppointmentsClient(startDate: string, endDate: string): Promise<CalendarAppointment[]> {
  const supabase = createClient()

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

export async function getBlockedSlotsClient(startDate: string, endDate: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_blocked', true)

  if (error) throw error
  return data || []
}

export async function blockSlotClient(date: string, startTime: string, endTime: string, reason?: string) {
  const supabase = createClient()

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

export async function unblockSlotClient(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('availability_slots')
    .update({ is_blocked: false, block_reason: null } as never)
    .eq('id', id)

  if (error) throw error
}

// ============================================
// SETTINGS QUERIES (Client-side)
// ============================================

interface SettingRow {
  key: string
  value: unknown
}

export async function getSettingsClient() {
  const supabase = createClient()

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

export async function updateSettingClient(key: string, value: unknown) {
  const supabase = createClient()

  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'key' }
    )

  if (error) throw error
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export interface SubscriptionWithDetails {
  id: string
  user_id: string
  pet_id: string | null
  plan_id: string
  start_date: string
  end_date: string | null
  next_billing_date: string | null
  sessions_remaining: number
  sessions_used: number
  extra_sessions_used: number
  status: string
  payment_status: string
  payment_due_amount: number
  last_payment_date: string | null
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  } | null
  pet: {
    id: string
    name: string
    species: string
  } | null
  plan: {
    id: string
    name: string
    type: string
    sessions_per_period: number
    price: number
  } | null
}

export async function getSubscriptionsClient(status?: string): Promise<SubscriptionWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      user:users!subscriptions_user_id_fkey(id, name, email, phone),
      pet:pets!subscriptions_pet_id_fkey(id, name, species),
      plan:plans!subscriptions_plan_id_fkey(id, name, type, sessions_per_period, price)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as unknown as SubscriptionWithDetails[]
}

export async function createSubscriptionClient(subscription: {
  user_id: string
  pet_id?: string
  plan_id: string
  sessions_remaining: number
  start_date?: string
  end_date?: string
  next_billing_date?: string
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: subscription.user_id,
      pet_id: subscription.pet_id || null,
      plan_id: subscription.plan_id,
      start_date: subscription.start_date || new Date().toISOString().split('T')[0],
      end_date: subscription.end_date || null,
      next_billing_date: subscription.next_billing_date || null,
      sessions_remaining: subscription.sessions_remaining,
      sessions_used: 0,
      extra_sessions_used: 0,
      status: 'active',
      payment_status: 'paid',
      payment_due_amount: 0,
    } as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSubscriptionClient(
  id: string,
  updates: {
    sessions_remaining?: number
    status?: string
    payment_status?: string
    payment_due_amount?: number
    next_billing_date?: string | null
  }
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)

  if (error) throw error
}

export async function markSubscriptionPaidClient(
  id: string,
  renewSessions: boolean = false,
  newSessionsCount?: number
) {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    payment_status: 'paid',
    payment_due_amount: 0,
    last_payment_date: new Date().toISOString().split('T')[0],
    extra_sessions_used: 0,
    updated_at: new Date().toISOString(),
  }

  if (renewSessions && newSessionsCount !== undefined) {
    updateData.sessions_remaining = newSessionsCount
    updateData.sessions_used = 0
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData as never)
    .eq('id', id)

  if (error) throw error
}

export async function useSubscriptionSessionClient(
  subscriptionId: string,
  extraCharge: number = 0
) {
  const supabase = createClient()

  // First get current subscription
  const { data, error: fetchError } = await supabase
    .from('subscriptions')
    .select('sessions_remaining, sessions_used, extra_sessions_used, payment_due_amount')
    .eq('id', subscriptionId)
    .single()

  if (fetchError) throw fetchError

  const subscription = data as {
    sessions_remaining: number
    sessions_used: number
    extra_sessions_used: number
    payment_due_amount: number
  }

  if (subscription.sessions_remaining > 0) {
    // Use regular session
    const { error } = await supabase
      .from('subscriptions')
      .update({
        sessions_remaining: subscription.sessions_remaining - 1,
        sessions_used: subscription.sessions_used + 1,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', subscriptionId)

    if (error) throw error
  } else {
    // Extra session - add charge
    const { error } = await supabase
      .from('subscriptions')
      .update({
        extra_sessions_used: subscription.extra_sessions_used + 1,
        payment_due_amount: (subscription.payment_due_amount || 0) + extraCharge,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', subscriptionId)

    if (error) throw error
  }
}

export async function getClientSubscriptionClient(userId: string): Promise<SubscriptionWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      user:users!subscriptions_user_id_fkey(id, name, email, phone),
      plan:plans!subscriptions_plan_id_fkey(id, name, type, sessions_per_period, price)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as unknown as SubscriptionWithDetails | null
}
