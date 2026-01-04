import { createClient } from "@/lib/supabase/client"
import type { Pet, PetSpecies, PetSize } from "@/types/database"

const supabase = createClient()

export interface CreatePetData {
  name: string
  species: PetSpecies
  breed?: string
  size: PetSize
  notes?: string
  photo_url?: string
}

export interface UpdatePetData extends Partial<CreatePetData> {}

export async function getPets() {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Pet[]
}

export async function getPetById(id: string) {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Pet
}

export async function createPet(pet: CreatePetData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pets")
    .insert({
      ...pet,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as Pet
}

export async function updatePet(id: string, pet: UpdatePetData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pets")
    .update(pet)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Pet
}

export async function deletePet(id: string) {
  const { error } = await supabase
    .from("pets")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function uploadPetPhoto(file: File, petId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}/${petId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from("pet-photos")
    .getPublicUrl(fileName)

  // Update pet with photo URL
  await updatePet(petId, { photo_url: publicUrl })

  return publicUrl
}
