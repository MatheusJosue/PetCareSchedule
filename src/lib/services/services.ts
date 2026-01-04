import { createClient } from "@/lib/supabase/client"
import type { Service } from "@/types/database"

const supabase = createClient()

export async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("name")

  if (error) throw error
  return data as Service[]
}

export async function getServiceById(id: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Service
}

export async function getAllServices(includeInactive = false) {
  let query = supabase.from("services").select("*").order("name")

  if (!includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Service[]
}

// Admin functions
export async function createService(service: Omit<Service, "id" | "created_at" | "updated_at">) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("services")
    .insert(service)
    .select()
    .single()

  if (error) throw error
  return data as Service
}

export async function updateService(id: string, service: Partial<Service>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("services")
    .update(service)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Service
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function toggleServiceStatus(id: string, active: boolean) {
  return updateService(id, { active })
}
