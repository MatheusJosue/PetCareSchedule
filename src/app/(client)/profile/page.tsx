"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { User, MapPin, Phone, Mail, Save, AlertCircle } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address_zip: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
}

// Cidade e estado fixos para atendimento
const FIXED_CITY = "Jundiaí";
const FIXED_STATE = "SP";

export default function ProfilePage() {
  const { addToast } = useToast();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address_zip: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: FIXED_CITY,
    address_state: FIXED_STATE,
  });

  // Buscar dados do usuário
  useEffect(() => {
    async function fetchUserData() {
      if (authLoading) return;

      if (!user) {
        setIsFetching(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          const userData = data as UserProfile;
          setFormData({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            address_zip: userData.address_zip || "",
            address_street: userData.address_street || "",
            address_number: userData.address_number || "",
            address_complement: userData.address_complement || "",
            address_neighborhood: userData.address_neighborhood || "",
            address_city: FIXED_CITY,
            address_state: FIXED_STATE,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        addToast("Erro ao carregar dados do perfil", "error");
      } finally {
        setIsFetching(false);
      }
    }

    fetchUserData();
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      addToast("Você precisa estar logado", "error");
      return;
    }

    if (!formData.name.trim()) {
      addToast("Nome é obrigatório", "error");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address_zip: formData.address_zip || null,
          address_street: formData.address_street || null,
          address_number: formData.address_number || null,
          address_complement: formData.address_complement || null,
          address_neighborhood: formData.address_neighborhood || null,
          address_city: formData.address_city || null,
          address_state: formData.address_state || null,
        } as never)
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar o profile no contexto de autenticação
      await refreshProfile();

      addToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast("Erro ao atualizar perfil. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCepBlur = async () => {
    const cep = formData.address_zip.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        addToast("CEP não encontrado", "error");
        return;
      }

      // Verificar se o CEP é de Jundiaí
      if (data.localidade?.toLowerCase() !== "jundiaí" && data.localidade?.toLowerCase() !== "jundiai") {
        addToast("Atendemos apenas em Jundiaí - SP", "error");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        address_street: data.logradouro || prev.address_street,
        address_neighborhood: data.bairro || prev.address_neighborhood,
        address_city: FIXED_CITY,
        address_state: FIXED_STATE,
      }));
      addToast("Endereço preenchido automaticamente!", "success");
    } catch {
      addToast("Erro ao buscar CEP", "error");
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Loading state
  if (isFetching || authLoading) {
    return (
      <div
        className="w-full"
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* Header Skeleton */}
        <div>
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="h-8 w-32 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
          <div className="h-4 w-64 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)', marginTop: '8px' }} />
        </div>
        {/* Personal Info Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            height: '200px'
          }}
        />
        {/* Address Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            height: '350px'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center" style={{ gap: "12px" }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
            <User className="h-5 w-5 text-white" />
          </div>
          <h1
            className="text-[1.75rem] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Meu Perfil
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          Gerencie suas informações pessoais e endereço de atendimento
        </p>
      </div>

      {/* Address Incomplete Warning */}
      {!formData.address_street || !formData.address_number ? (
        <div
          className="rounded-2xl flex items-center"
          style={{
            padding: "16px 20px",
            gap: "12px",
            background: "var(--accent-yellow-bg)",
            border: "1px solid var(--border-primary)",
            borderLeftWidth: "4px",
            borderLeftColor: "var(--accent-yellow)",
          }}
        >
          <AlertCircle
            className="h-5 w-5 flex-shrink-0"
            style={{ color: "var(--accent-yellow)" }}
          />
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Endereço incompleto
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Você precisa completar seu endereço antes de agendar serviços.
            </p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* Personal Info */}
        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            className="flex items-center border-b"
            style={{
              padding: "20px 24px",
              gap: "12px",
              borderColor: "var(--border-primary)",
            }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-purple-bg)" }}
            >
              <User
                className="h-4 w-4"
                style={{ color: "var(--accent-purple)" }}
              />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Dados Pessoais
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Suas informações de contato
              </p>
            </div>
          </div>
          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Input
              label="Nome completo"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Seu nome"
              required
            />

            <div className="grid sm:grid-cols-2" style={{ gap: "16px" }}>
              <div className="relative">
                <Input
                  label="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  leftIcon={<Mail className="h-5 w-5" />}
                  disabled
                />
              </div>

              <div className="relative">
                <Input
                  label="Telefone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: formatPhone(e.target.value),
                    })
                  }
                  leftIcon={<Phone className="h-5 w-5" />}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            className="flex items-center border-b"
            style={{
              padding: "20px 24px",
              gap: "12px",
              borderColor: "var(--border-primary)",
            }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-cyan-bg)" }}
            >
              <MapPin
                className="h-4 w-4"
                style={{ color: "var(--accent-cyan)" }}
              />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Endereço
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Local para atendimento domiciliar
              </p>
            </div>
          </div>
          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div className="grid sm:grid-cols-3" style={{ gap: "16px" }}>
              <Input
                label="CEP"
                value={formData.address_zip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address_zip: formatCep(e.target.value),
                  })
                }
                onBlur={handleCepBlur}
                placeholder="00000-000"
                required
              />
            </div>

            <Input
              label="Rua / Avenida"
              value={formData.address_street}
              onChange={(e) =>
                setFormData({ ...formData, address_street: e.target.value })
              }
              placeholder="Nome da rua"
              required
            />

            <div className="grid sm:grid-cols-3" style={{ gap: "16px" }}>
              <Input
                label="Número"
                value={formData.address_number}
                onChange={(e) =>
                  setFormData({ ...formData, address_number: e.target.value })
                }
                placeholder="123"
                required
              />

              <div className="sm:col-span-2">
                <Input
                  label="Complemento"
                  value={formData.address_complement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address_complement: e.target.value,
                    })
                  }
                  placeholder="Apto, bloco, etc."
                />
              </div>
            </div>

            <Input
              label="Bairro"
              value={formData.address_neighborhood}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address_neighborhood: e.target.value,
                })
              }
              placeholder="Nome do bairro"
              required
            />

            <div className="grid sm:grid-cols-2" style={{ gap: "16px" }}>
              <Input
                label="Cidade"
                value={formData.address_city}
                onChange={() => {}}
                disabled
              />

              <Input
                label="Estado"
                value={formData.address_state}
                onChange={() => {}}
                disabled
              />
            </div>

            <p className="text-sm" style={{ color: "var(--text-muted)", marginTop: "-8px" }}>
              Atualmente atendemos apenas em Jundiaí - SP
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} size="lg">
            <Save />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
