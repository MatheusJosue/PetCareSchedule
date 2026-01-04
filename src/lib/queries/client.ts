import { createClient } from "@/lib/supabase/server"

// ============================================
// TYPES
// ============================================

interface PetData {
  id: string
  name: string
  species: "cachorro" | "gato" | "outro"
  breed: string | null
  size: "pequeno" | "medio" | "grande"
  notes: string | null
  photo_url: string | null
}

interface AppointmentData {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  price: number
  notes: string | null
  pet: { id: string; name: string; species: string } | null
  service: { id: string; name: string; base_price: number } | null
}

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
}

interface ServiceData {
  id: string
  name: string
  description: string | null
  duration_min: number
  base_price: number
}

// ============================================
// DASHBOARD QUERIES
// ============================================

export async function getClientDashboard(userId: string) {
  const supabase = await createClient()

  // Get pets count
  const { count: petsCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get upcoming appointments
  const today = new Date().toISOString().split('T')[0]

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      price,
      pet:pets(id, name, species),
      service:services(id, name, base_price)
    `)
    .eq('user_id', userId)
    .gte('scheduled_date', today)
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(5)

  if (error) throw error

  const appointmentsData = (appointments || []) as unknown as AppointmentData[]
  const pendingCount = appointmentsData.filter(a => a.status === 'pending').length
  const confirmedCount = appointmentsData.filter(a => a.status === 'confirmed').length

  return {
    petsCount: petsCount || 0,
    pendingCount,
    confirmedCount,
    upcomingAppointments: appointmentsData
  }
}

// ============================================
// PETS QUERIES
// ============================================

export async function getUserPets(userId: string): Promise<PetData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pets')
    .select('id, name, species, breed, size, notes, photo_url')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as PetData[]
}

export async function getPetById(userId: string, petId: string): Promise<PetData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pets')
    .select('id, name, species, breed, size, notes, photo_url')
    .eq('id', petId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as PetData
}

export async function createPet(userId: string, pet: {
  name: string
  species: "cachorro" | "gato" | "outro"
  breed?: string
  size: "pequeno" | "medio" | "grande"
  notes?: string
  photo_url?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pets')
    .insert({
      user_id: userId,
      ...pet
    } as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePet(userId: string, petId: string, pet: {
  name?: string
  species?: "cachorro" | "gato" | "outro"
  breed?: string
  size?: "pequeno" | "medio" | "grande"
  notes?: string
  photo_url?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pets')
    .update(pet as never)
    .eq('id', petId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePet(userId: string, petId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId)
    .eq('user_id', userId)

  if (error) throw error
}

// ============================================
// APPOINTMENTS QUERIES
// ============================================

export async function getUserAppointments(userId: string): Promise<AppointmentData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      price,
      notes,
      pet:pets(id, name, species),
      service:services(id, name, base_price)
    `)
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: true })

  if (error) throw error
  return (data || []) as unknown as AppointmentData[]
}

export async function createAppointment(userId: string, appointment: {
  pet_id: string
  service_id: string
  scheduled_date: string
  scheduled_time: string
  notes?: string
  price: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      status: 'pending',
      ...appointment
    } as never)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelAppointment(userId: string, appointmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    } as never)
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])

  if (error) throw error
}

// ============================================
// PROFILE QUERIES
// ============================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      phone,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zip
    `)
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as UserProfile
}

export async function updateUserProfile(userId: string, profile: {
  name?: string
  phone?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zip?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .update(profile as never)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// SERVICES QUERIES (for booking)
// ============================================

export async function getActiveServices(): Promise<ServiceData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, duration_min, base_price')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as ServiceData[]
}

// ============================================
// AVAILABILITY QUERIES
// ============================================

export async function getAvailableSlots(date: string, serviceId: string) {
  const supabase = await createClient()

  // Get service duration
  const { data: service } = await supabase
    .from('services')
    .select('duration_min')
    .eq('id', serviceId)
    .single()

  if (!service) throw new Error('Serviço não encontrado')

  interface BlockedSlot {
    start_time: string
    end_time: string
  }

  interface ExistingAppointment {
    scheduled_time: string
    service: { duration_min?: number } | null
  }

  // Get blocked slots for the date
  const { data: blockedSlotsData } = await supabase
    .from('availability_slots')
    .select('start_time, end_time')
    .eq('date', date)
    .eq('is_blocked', true)

  const blockedSlots = (blockedSlotsData || []) as unknown as BlockedSlot[]

  // Get existing appointments for the date
  const { data: existingAppointmentsData } = await supabase
    .from('appointments')
    .select('scheduled_time, service:services(duration_min)')
    .eq('scheduled_date', date)
    .neq('status', 'cancelled')

  const existingAppointments = (existingAppointmentsData || []) as unknown as ExistingAppointment[]

  // Generate available time slots (8:00 - 18:00, 30 min intervals)
  const slots: string[] = []
  const startHour = 8
  const endHour = 18

  for (let hour = startHour; hour < endHour; hour++) {
    for (const min of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`

      // Check if slot is blocked
      const isBlocked = blockedSlots.some(blocked => {
        return time >= blocked.start_time && time < blocked.end_time
      })

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptTime = apt.scheduled_time
        const aptDuration = apt.service?.duration_min || 60
        const aptEndTime = addMinutes(aptTime, aptDuration)
        return time >= aptTime && time < aptEndTime
      })

      if (!isBlocked && !hasConflict) {
        slots.push(time)
      }
    }
  }

  return slots
}

// Helper function
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newHour = Math.floor(totalMinutes / 60)
  const newMin = totalMinutes % 60
  return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`
}
