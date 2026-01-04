"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Save, ArrowLeft, PawPrint, Camera } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: "cachorro" | "gato" | "outro";
  breed: string | null;
  size: "pequeno" | "medio" | "grande";
  notes: string | null;
  photo_url: string | null;
}

const speciesOptions = [
  { value: "cachorro", label: "Cachorro" },
  { value: "gato", label: "Gato" },
  { value: "outro", label: "Outro" },
];

const sizeOptions = [
  { value: "pequeno", label: "Pequeno (até 10kg)" },
  { value: "medio", label: "Médio (10-25kg)" },
  { value: "grande", label: "Grande (acima de 25kg)" },
];

export default function EditPetPage() {
  const { addToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    species: "cachorro",
    breed: "",
    size: "medio",
    notes: "",
    photoUrl: null as string | null,
  });

  // Buscar dados do pet
  useEffect(() => {
    async function fetchPet() {
      if (authLoading) return;

      if (!user) {
        setIsFetching(false);
        router.push("/login");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          addToast("Pet não encontrado", "error");
          router.push("/pets");
          return;
        }

        const pet = data as Pet;
        setFormData({
          name: pet.name,
          species: pet.species,
          breed: pet.breed || "",
          size: pet.size,
          notes: pet.notes || "",
          photoUrl: pet.photo_url,
        });
      } catch (error) {
        console.error('Error fetching pet:', error);
        addToast("Erro ao carregar pet", "error");
        router.push("/pets");
      } finally {
        setIsFetching(false);
      }
    }

    fetchPet();
  }, [user, authLoading, petId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("Arquivo muito grande. Máximo 5MB.", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      addToast("Selecione uma imagem válida.", "error");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast("Nome do pet é obrigatório", "error");
      return;
    }

    if (!user) {
      addToast("Você precisa estar logado", "error");
      return;
    }

    setIsLoading(true);

    try {
      let photo_url = formData.photoUrl;

      // Upload da nova foto se existir
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('pet-photos')
            .getPublicUrl(fileName);
          photo_url = publicUrl;
        }
      }

      // Atualizar pet no banco
      const { error } = await supabase
        .from('pets')
        .update({
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          size: formData.size,
          notes: formData.notes || null,
          photo_url,
        } as never)
        .eq('id', petId)
        .eq('user_id', user.id);

      if (error) throw error;

      addToast("Pet atualizado com sucesso!", "success");
      router.push("/pets");
    } catch (error) {
      console.error('Error updating pet:', error);
      addToast("Erro ao atualizar pet. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isFetching || authLoading) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
            <div>
              <div className="h-6 w-32 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)', marginBottom: '8px' }} />
              <div className="h-4 w-48 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
          </div>
        </div>
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            padding: '24px',
            height: '400px'
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex items-center" style={{ gap: '16px' }}>
        <Link href="/pets">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Editar {formData.name}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Atualize as informações do pet
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div
        className="rounded-2xl border"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div
          className="border-b"
          style={{ padding: '20px 24px', borderColor: 'var(--border-primary)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Informações do Pet
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Atualize os dados do seu pet
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Photo Upload */}
          <div className="flex flex-col items-center" style={{ marginBottom: '24px' }}>
            <label className="cursor-pointer" style={{ marginBottom: '12px' }}>
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center hover:opacity-80 transition-opacity shadow-lg relative overflow-hidden">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    className="rounded-full object-cover"
                    fill
                  />
                ) : formData.photoUrl ? (
                  <Image
                    src={formData.photoUrl}
                    alt="Pet"
                    className="rounded-full object-cover"
                    fill
                  />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Clique para alterar foto
            </p>
            <p className="text-xs" style={{ color: 'var(--text-hint)' }}>
              JPG, PNG. Máximo 5MB
            </p>
          </div>

          {/* Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Nome do pet"
              type="text"
              placeholder="Nome do pet"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
              <Select
                label="Espécie"
                options={speciesOptions}
                value={formData.species}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    species: e.target.value as "cachorro" | "gato" | "outro",
                  })
                }
              />

              <Select
                label="Porte"
                options={sizeOptions}
                value={formData.size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size: e.target.value as "pequeno" | "medio" | "grande",
                  })
                }
              />
            </div>

            <Input
              label="Raça"
              type="text"
              placeholder="Raça do pet"
              value={formData.breed}
              onChange={(e) =>
                setFormData({ ...formData, breed: e.target.value })
              }
            />

            <Textarea
              label="Observações"
              placeholder="Comportamento, alergias, cuidados especiais..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div
            className="flex border-t"
            style={{
              paddingTop: '24px',
              marginTop: '24px',
              borderColor: 'var(--border-primary)',
              gap: '12px'
            }}
          >
            <Link href="/pets" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
