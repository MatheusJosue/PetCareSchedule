"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Plus, PawPrint, Edit, Trash2, Dog, Cat } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: "cachorro" | "gato" | "outro";
  breed: string | null;
  size: "pequeno" | "medio" | "grande";
  notes: string | null;
  photo_url: string | null;
}

const sizeLabels: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export default function PetsPage() {
  const { addToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);

  // Buscar pets do usuário
  useEffect(() => {
    async function fetchPets() {
      // Aguardar auth carregar
      if (authLoading) return;

      // Se não tem usuário, para de carregar
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pets')
          .select('id, name, species, breed, size, notes, photo_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPets((data || []) as Pet[]);
      } catch (error) {
        console.error('Error fetching pets:', error);
        addToast("Erro ao carregar pets", "error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPets();
  }, [user, authLoading]);

  const handleDelete = async () => {
    if (!deletingPet || !user) return;

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', deletingPet.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPets(pets.filter((p) => p.id !== deletingPet.id));
      addToast("Pet removido com sucesso!", "success");
    } catch (error) {
      console.error('Error deleting pet:', error);
      addToast("Erro ao remover pet", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingPet(null);
    }
  };

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '16px' }}>
        <div>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Meus Pets
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Gerencie os pets cadastrados para agendamento
          </p>
        </div>
        <Link href="/pets/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            Adicionar Pet
          </Button>
        </Link>
      </div>

      {/* Pets Grid */}
      {isLoading || authLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border animate-pulse"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                padding: '16px'
              }}
            >
              <div className="flex" style={{ gap: '16px' }}>
                <div
                  className="w-16 h-16 rounded-full flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
                <div className="flex-1">
                  <div
                    className="h-5 w-24 rounded"
                    style={{ background: 'var(--bg-tertiary)', marginBottom: '8px' }}
                  />
                  <div
                    className="h-4 w-32 rounded"
                    style={{ background: 'var(--bg-tertiary)' }}
                  />
                </div>
              </div>
              <div className="flex" style={{ gap: '8px', marginTop: '12px' }}>
                <div
                  className="h-9 flex-1 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
                <div
                  className="h-9 w-9 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : pets.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-200"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                padding: '16px'
              }}
            >
              <div className="flex" style={{ gap: '16px' }}>
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center overflow-hidden shadow-lg">
                    {pet.photo_url ? (
                      <Image
                        src={pet.photo_url}
                        alt={pet.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : pet.species === "cachorro" ? (
                      <Dog className="h-7 w-7 text-white" />
                    ) : pet.species === "gato" ? (
                      <Cat className="h-7 w-7 text-white" />
                    ) : (
                      <PawPrint className="h-7 w-7 text-white" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between" style={{ marginBottom: '4px' }}>
                    <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                      {pet.name}
                    </h3>
                    <span
                      className="text-xs font-semibold rounded-full flex-shrink-0"
                      style={{
                        padding: '2px 8px',
                        background: 'var(--accent-blue-bg)',
                        color: 'var(--accent-blue)',
                        marginLeft: '8px'
                      }}
                    >
                      {sizeLabels[pet.size]}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                    {pet.breed || 'Sem raça definida'}
                  </p>
                  {pet.notes && (
                    <p className="text-xs line-clamp-1" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                      {pet.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center" style={{ gap: '8px', marginTop: '12px' }}>
                <Link href={`/pets/${pet.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Edit />
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setDeletingPet(pet);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl border text-center transition-colors duration-200"
          style={{
            padding: '48px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
            style={{ marginBottom: '20px', background: 'var(--accent-purple-bg)' }}
          >
            <PawPrint className="h-8 w-8" style={{ color: 'var(--accent-purple)' }} />
          </div>
          <h3 className="text-[16px] font-semibold" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Nenhum pet cadastrado
          </h3>
          <p className="text-[14px] max-w-sm mx-auto" style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
            Cadastre seu primeiro pet para poder agendar serviços
          </p>
          <Link href="/pets/new">
            <Button>
              <Plus className="h-4 w-4" />
              Adicionar Pet
            </Button>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remover Pet"
        description={`Tem certeza que deseja remover ${deletingPet?.name}?`}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Esta ação não pode ser desfeita. Todos os agendamentos associados a
          este pet também serão removidos.
        </p>
        <ModalActions>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Remover
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
