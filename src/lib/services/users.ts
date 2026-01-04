import { createClient } from "@/lib/supabase/client"
import type { User, UserRole } from "@/types/database"

const supabase = createClient()

export interface UpdateProfileData {
  name?: string
  phone?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  avatar_url?: string
}

export async function getCurrentUser() {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()

  if (error) {
    // If user doesn't exist in our table, return basic info from auth
    if (error.code === "PGRST116") {
      return {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "",
        role: "client" as UserRole,
        created_at: authUser.created_at,
      } as unknown as User
    }
    throw error
  }

  return data as User
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as User
}

export async function updateProfile(updates: UpdateProfileData) {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new Error("User not authenticated")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("users")
    .update(updates)
    .eq("id", authUser.id)
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function uploadAvatar(file: File) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName)

  // Update user profile with avatar URL
  await updateProfile({ avatar_url: publicUrl })

  return publicUrl
}

// Admin functions
export async function getAllUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as User[]
}

export async function getClientUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "client")
    .order("name")

  if (error) throw error
  return data as User[]
}

export async function updateUserRole(id: string, role: UserRole) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("users")
    .update({ role })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function getUserStats(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments, error: appointmentsError } = await (supabase as any)
    .from("appointments")
    .select("id, status")
    .eq("user_id", userId)

  if (appointmentsError) throw appointmentsError

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pets, error: petsError } = await (supabase as any)
    .from("pets")
    .select("id")
    .eq("user_id", userId)

  if (petsError) throw petsError

  const appointmentsList = appointments as { id: string; status: string }[] | null

  return {
    totalAppointments: appointmentsList?.length || 0,
    completedAppointments: appointmentsList?.filter(a => a.status === "completed").length || 0,
    cancelledAppointments: appointmentsList?.filter(a => a.status === "cancelled").length || 0,
    totalPets: (pets as { id: string }[] | null)?.length || 0,
  }
}
