import { createClient } from "@/lib/supabase/client"
import type { Plan, Subscription, SubscriptionStatus } from "@/types/database"

const supabase = createClient()

export async function getPlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("price")

  if (error) throw error
  return data as Plan[]
}

export async function getPlanById(id: string) {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Plan
}

export async function getCurrentSubscription() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      plan:plans(*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // No subscription found
    throw error
  }

  return data as Subscription & { plan: Plan }
}

export async function subscribeToPlan(planId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // Get the plan to determine period
  const plan = await getPlanById(planId)

  // Calculate end date based on plan type
  const startDate = new Date()
  const endDate = new Date()

  if (plan.type === "mensal") {
    endDate.setMonth(endDate.getMonth() + 1)
  } else if (plan.type === "semanal") {
    endDate.setDate(endDate.getDate() + 7)
  } else {
    // avulso - single session, no recurring
    endDate.setDate(endDate.getDate() + 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_id: planId,
      status: "active",
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
    })
    .select(`
      *,
      plan:plans(*)
    `)
    .single()

  if (error) throw error
  return data as Subscription & { plan: Plan }
}

export async function cancelSubscription() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("status", "active")
    .select()
    .single()

  if (error) throw error
  return data as Subscription
}

// Admin functions
export async function getAllPlans(includeInactive = false) {
  let query = supabase.from("plans").select("*").order("price")

  if (!includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Plan[]
}

export async function createPlan(plan: Omit<Plan, "id" | "created_at" | "updated_at">) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("plans")
    .insert(plan)
    .select()
    .single()

  if (error) throw error
  return data as Plan
}

export async function updatePlan(id: string, plan: Partial<Plan>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("plans")
    .update(plan)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Plan
}

export async function deletePlan(id: string) {
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function getAllSubscriptions(status?: SubscriptionStatus) {
  let query = supabase
    .from("subscriptions")
    .select(`
      *,
      plan:plans(*),
      user:users(id, full_name, email)
    `)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data
}
