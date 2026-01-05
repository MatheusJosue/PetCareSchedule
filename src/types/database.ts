export type UserRole = "client" | "admin"

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"

export type PlanType = "avulso" | "semanal" | "mensal"

export type PetSize = "pequeno" | "medio" | "grande"

export type PetSpecies = "cachorro" | "gato" | "outro"

export type SubscriptionStatus = "active" | "paused" | "cancelled"

export type PaymentStatus = "paid" | "pending" | "overdue"

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Pet {
  id: string
  user_id: string
  name: string
  species: PetSpecies
  breed: string | null
  size: PetSize
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  duration_min: number
  base_price: number
  active: boolean
  created_at: string
}

export interface Plan {
  id: string
  name: string
  type: PlanType
  frequency: string | null
  sessions_per_period: number
  price: number
  discount_percent: number
  active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  pet_id: string
  plan_id: string | null
  service_id: string
  scheduled_date: string
  scheduled_time: string
  status: AppointmentStatus
  notes: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Relations (populated by joins)
  user?: User
  pet?: Pet
  service?: Service
  plan?: Plan
}

export interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_blocked: boolean
  block_reason: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  start_date: string
  end_date: string | null
  next_billing_date: string | null
  sessions_remaining: number
  sessions_used: number
  extra_sessions_used: number
  status: SubscriptionStatus
  payment_status: PaymentStatus
  payment_due_amount: number
  last_payment_date: string | null
  created_at: string
  updated_at: string
  // Relations
  user?: User
  plan?: Plan
}

export interface Settings {
  id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<User, "id" | "created_at" | "updated_at">>
      }
      pets: {
        Row: Pet
        Insert: Omit<Pet, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Pet, "id" | "created_at" | "updated_at">>
      }
      services: {
        Row: Service
        Insert: Omit<Service, "id" | "created_at">
        Update: Partial<Omit<Service, "id" | "created_at">>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, "id" | "created_at">
        Update: Partial<Omit<Plan, "id" | "created_at">>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Appointment, "id" | "created_at" | "updated_at">>
      }
      availability_slots: {
        Row: AvailabilitySlot
        Insert: Omit<AvailabilitySlot, "id" | "created_at">
        Update: Partial<Omit<AvailabilitySlot, "id" | "created_at">>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Subscription, "id" | "created_at" | "updated_at">>
      }
      settings: {
        Row: Settings
        Insert: Omit<Settings, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Settings, "id" | "created_at" | "updated_at">>
      }
    }
  }
}
