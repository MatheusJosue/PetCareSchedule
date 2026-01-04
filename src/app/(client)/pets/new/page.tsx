"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Upload, ArrowLeft, PawPrint, Camera } from "lucide-react";

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

export default function NewPetPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    species: "cachorro",
    breed: "",
    size: "medio",
    notes: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast("Arquivo muito grande. Máximo 5MB.", "error");
      return;
    }

    // Validar tipo
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
      let photo_url: string | null = null;

      // Upload da foto se existir
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

      // Salvar pet no banco
      const { error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          size: formData.size,
          notes: formData.notes || null,
          photo_url,
        } as never);

      if (error) throw error;

      addToast("Pet cadastrado com sucesso!", "success");
      router.push("/pets");
    } catch (error) {
      console.error('Error creating pet:', error);
      addToast("Erro ao cadastrar pet. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Back Button */}
      <div className="flex items-center" style={{ gap: '16px' }}>
        <Link href="/pets">
          <button
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-muted)'
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-[1.5rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Cadastrar Novo Pet
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', marginLeft: '52px' }}>
            Adicione um novo pet à sua lista
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div
        className="rounded-2xl border transition-colors duration-200"
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
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Informações do Pet
          </h2>
          <p className="text-sm" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
            Preencha os dados do seu pet para prosseguir
          </p>
        </div>
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <label className="cursor-pointer" style={{ marginBottom: '16px' }}>
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center hover:opacity-80 transition-opacity shadow-lg relative overflow-hidden">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      className="rounded-full object-cover"
                      fill
                    />
                  ) : (
                    <Camera className="h-10 w-10 text-white" />
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Clique para adicionar foto
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>JPG, PNG. Máximo 5MB</p>
            </div>

            {/* Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
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
                type="text"
                placeholder="Raça"
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
              />

              <Textarea
                placeholder="Observações (comportamento, alergias, cuidados especiais...)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex" style={{ gap: '12px', paddingTop: '16px' }}>
              <Link href="/pets" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                <Upload className="h-4 w-4" />
                Cadastrar Pet
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
