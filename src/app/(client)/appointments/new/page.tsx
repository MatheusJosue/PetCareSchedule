"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  PawPrint,
  Scissors,
  Calendar,
  Check,
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  Dog,
  Cat,
  Droplets,
  Sparkles,
  Plus,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Pet {
  id: string;
  name: string;
  species: "cachorro" | "gato" | "outro";
  breed: string | null;
  size: "pequeno" | "medio" | "grande";
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  base_price: number;
}

// Generate available dates (next 14 days)
const generateAvailableDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Skip Sundays
    if (date.getDay() !== 0) {
      dates.push(date.toISOString().split("T")[0]);
    }
  }
  return dates;
};

// Generate time slots
const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const availableDates = generateAvailableDates();

export default function NewAppointmentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  // Verificar se o endereço está completo
  const hasCompleteAddress = Boolean(
    profile?.address_street &&
    profile?.address_number &&
    profile?.address_city &&
    profile?.address_state
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Buscar pets e serviços
  useEffect(() => {
    async function fetchData() {
      if (authLoading) return;
      if (!user) {
        setIsFetching(false);
        return;
      }

      try {
        // Buscar pets do usuário
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('id, name, species, breed, size')
          .eq('user_id', user.id)
          .order('name');

        if (petsError) throw petsError;
        setPets((petsData || []) as Pet[]);

        // Buscar serviços ativos
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, description, duration_min, base_price')
          .eq('active', true)
          .order('name');

        if (servicesError) throw servicesError;
        setServices((servicesData || []) as Service[]);
      } catch (error) {
        console.error('Error fetching data:', error);
        addToast("Erro ao carregar dados", "error");
      } finally {
        setIsFetching(false);
      }
    }

    fetchData();
  }, [user, authLoading]);

  // Ícone do serviço baseado no nome
  const getServiceIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('banho') && nameLower.includes('tosa')) {
      return <Sparkles className="h-6 w-6" />;
    }
    if (nameLower.includes('banho')) {
      return <Droplets className="h-6 w-6" />;
    }
    if (nameLower.includes('tosa')) {
      return <Scissors className="h-6 w-6" />;
    }
    return <PawPrint className="h-6 w-6" />;
  };

  const steps = [
    { number: 1, title: "Pet", icon: <PawPrint className="h-4 w-4" /> },
    { number: 2, title: "Serviço", icon: <Scissors className="h-4 w-4" /> },
    { number: 3, title: "Data/Hora", icon: <Calendar className="h-4 w-4" /> },
    { number: 4, title: "Confirmar", icon: <Check className="h-4 w-4" /> },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPets.length > 0;
      case 2:
        return selectedServices.length > 0;
      case 3:
        return selectedDate !== null && selectedTime !== null;
      default:
        return true;
    }
  };

  // Toggle pet selection
  const togglePetSelection = (pet: Pet) => {
    setSelectedPets(prev => {
      const isSelected = prev.some(p => p.id === pet.id);
      if (isSelected) {
        return prev.filter(p => p.id !== pet.id);
      } else {
        return [...prev, pet];
      }
    });
  };

  // Select all pets
  const selectAllPets = () => {
    if (selectedPets.length === pets.length) {
      setSelectedPets([]);
    } else {
      setSelectedPets([...pets]);
    }
  };

  // Toggle service selection
  const toggleServiceSelection = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Select all services
  const selectAllServices = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices([...services]);
    }
  };

  // Calculate total price (sum of all services × number of pets)
  const getTotalPrice = () => {
    if (selectedServices.length === 0) return 0;
    const servicesTotal = selectedServices.reduce((sum, s) => sum + s.base_price, 0);
    return servicesTotal * selectedPets.length;
  };

  // Calculate total duration (sum of all services × number of pets)
  const getTotalDuration = () => {
    if (selectedServices.length === 0) return 0;
    const servicesTotal = selectedServices.reduce((sum, s) => sum + s.duration_min, 0);
    return servicesTotal * selectedPets.length;
  };

  // Get services price total (without multiplying by pets)
  const getServicesPriceTotal = () => {
    return selectedServices.reduce((sum, s) => sum + s.base_price, 0);
  };

  // Get services duration total (without multiplying by pets)
  const getServicesDurationTotal = () => {
    return selectedServices.reduce((sum, s) => sum + s.duration_min, 0);
  };

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutos`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = async () => {
    if (!user || selectedServices.length === 0 || !selectedDate || !selectedTime || selectedPets.length === 0) {
      addToast("Preencha todos os campos", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Criar um agendamento para cada combinação de pet + serviço
      const appointments: Array<{
        user_id: string;
        pet_id: string;
        service_id: string;
        scheduled_date: string;
        scheduled_time: string;
        status: 'pending';
        price: number;
        notes: null;
        admin_notes: null;
      }> = [];

      for (const pet of selectedPets) {
        for (const service of selectedServices) {
          appointments.push({
            user_id: user.id,
            pet_id: pet.id,
            service_id: service.id,
            scheduled_date: selectedDate,
            scheduled_time: selectedTime,
            status: 'pending',
            price: service.base_price,
            notes: null,
            admin_notes: null,
          });
        }
      }

      const { error } = await supabase
        .from('appointments')
        .insert(appointments as never[]);

      if (error) throw error;

      const totalAppointments = selectedPets.length * selectedServices.length;
      const petNames = selectedPets.map(p => p.name).join(', ');
      addToast(`${totalAppointments} agendamento${totalAppointments > 1 ? 's' : ''} solicitado${totalAppointments > 1 ? 's' : ''} com sucesso para ${petNames}!`, "success");
      router.push("/appointments");
    } catch (error) {
      console.error('Error creating appointment:', error);
      addToast("Erro ao criar agendamento. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Bloquear acesso se endereço não estiver completo
  if (!authLoading && !hasCompleteAddress) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="flex items-center" style={{ gap: '16px' }}>
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-muted)'
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[1.5rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Novo Agendamento
            </h1>
          </div>
        </div>

        {/* Address Required Message */}
        <div
          className="rounded-2xl border text-center"
          style={{
            padding: '48px 24px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
            style={{ marginBottom: '20px', background: 'var(--accent-yellow-bg)' }}
          >
            <AlertCircle className="h-8 w-8" style={{ color: 'var(--accent-yellow)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Endereço não cadastrado
          </h2>
          <p style={{ marginBottom: '8px', color: 'var(--text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Para realizar um agendamento, precisamos do seu endereço completo para o atendimento domiciliar.
          </p>
          <p className="text-sm" style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
            Complete seu perfil com rua, número, cidade e estado.
          </p>
          <div className="flex items-center justify-center" style={{ gap: '12px' }}>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link href="/profile">
              <Button>
                <MapPin className="h-4 w-4" />
                Completar endereço
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex items-center" style={{ gap: '16px' }}>
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-muted)'
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[1.5rem] font-bold" style={{ color: 'var(--text-primary)' }}>
            Novo Agendamento
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Passo {currentStep} de 4</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full transition-all flex-shrink-0",
                currentStep >= step.number && "shadow-lg shadow-purple-400/30"
              )}
              style={{
                background: currentStep >= step.number
                  ? 'linear-gradient(to right, #7c3aed, #a855f7)'
                  : 'var(--bg-tertiary)',
                color: currentStep >= step.number ? 'white' : 'var(--text-muted)'
              }}
            >
              {currentStep > step.number ? (
                <Check className="h-5 w-5" />
              ) : (
                step.icon
              )}
            </div>
            {/* Line after the step (except last step) */}
            {index < steps.length - 1 && (
              <div
                className="h-1 w-12 sm:w-20 transition-all"
                style={{
                  background: currentStep > step.number
                    ? 'linear-gradient(to right, #7c3aed, #a855f7)'
                    : 'var(--bg-tertiary)'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
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
            {currentStep === 1 && "Selecione o Pet"}
            {currentStep === 2 && "Selecione o Serviço"}
            {currentStep === 3 && "Selecione Data e Hora"}
            {currentStep === 4 && "Confirme seu Agendamento"}
          </h2>
        </div>
        <div style={{ padding: '24px' }}>
          {/* Step 1: Select Pet(s) */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Loading state */}
              {isFetching && (
                <div className="grid sm:grid-cols-2" style={{ gap: '16px' }}>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border animate-pulse"
                      style={{ padding: '16px', background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                    >
                      <div className="flex items-center" style={{ gap: '16px' }}>
                        <div className="h-14 w-14 rounded-xl" style={{ background: 'var(--bg-secondary)' }} />
                        <div className="flex-1">
                          <div className="h-5 w-24 rounded" style={{ background: 'var(--bg-secondary)', marginBottom: '8px' }} />
                          <div className="h-4 w-32 rounded" style={{ background: 'var(--bg-secondary)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No pets message */}
              {!isFetching && pets.length === 0 && (
                <div
                  className="rounded-2xl border text-center"
                  style={{
                    padding: '32px',
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <PawPrint className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <p className="font-medium" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Você ainda não tem pets cadastrados
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Cadastre um pet para poder agendar serviços
                  </p>
                  <Link href="/pets/new">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Cadastrar Pet
                    </Button>
                  </Link>
                </div>
              )}

              {/* Select all button */}
              {!isFetching && pets.length > 1 && (
                <button
                  onClick={selectAllPets}
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--accent-purple)', textAlign: 'left' }}
                >
                  {selectedPets.length === pets.length ? 'Desmarcar todos' : 'Selecionar todos os pets'}
                </button>
              )}

              {/* Pet cards */}
              {!isFetching && pets.length > 0 && (
                <div className="grid sm:grid-cols-2" style={{ gap: '16px' }}>
                  {pets.map((pet) => {
                    const isSelected = selectedPets.some(p => p.id === pet.id);
                    return (
                      <button
                        key={pet.id}
                        onClick={() => togglePetSelection(pet)}
                        className={cn(
                          "flex items-center rounded-xl border-2 transition-all text-left"
                        )}
                        style={{
                          padding: '16px',
                          gap: '16px',
                          background: isSelected ? 'var(--accent-purple-bg)' : 'var(--bg-tertiary)',
                          borderColor: isSelected ? 'var(--accent-purple)' : 'var(--border-primary)'
                        }}
                      >
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-lg shadow-purple-400/20">
                          {pet.species === "cachorro" ? (
                            <Dog className="h-7 w-7" />
                          ) : pet.species === "gato" ? (
                            <Cat className="h-7 w-7" />
                          ) : (
                            <PawPrint className="h-7 w-7" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pet.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pet.breed || 'Sem raça definida'}</p>
                        </div>
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? "border-[#7c3aed] bg-[#7c3aed]" : "border-gray-300"
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected count */}
              {selectedPets.length > 0 && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''} selecionado{selectedPets.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Select Service */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Loading state */}
              {isFetching && (
                <div className="grid sm:grid-cols-2" style={{ gap: '16px' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border animate-pulse"
                      style={{ padding: '16px', background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                    >
                      <div className="h-12 w-12 rounded-xl" style={{ background: 'var(--bg-secondary)', marginBottom: '12px' }} />
                      <div className="h-5 w-24 rounded" style={{ background: 'var(--bg-secondary)', marginBottom: '8px' }} />
                      <div className="h-4 w-full rounded" style={{ background: 'var(--bg-secondary)' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* No services message */}
              {!isFetching && services.length === 0 && (
                <div
                  className="rounded-2xl border text-center"
                  style={{
                    padding: '32px',
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <Scissors className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <p className="font-medium" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Nenhum serviço disponível
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Não há serviços cadastrados no momento
                  </p>
                </div>
              )}

              {/* Service cards */}
              {!isFetching && services.length > 0 && (
                <>
                  {/* Info about multiple pets */}
                  {selectedPets.length > 1 && (
                    <div
                      className="rounded-xl text-sm"
                      style={{
                        padding: '12px 16px',
                        background: 'var(--accent-blue-bg)',
                        color: 'var(--accent-blue)'
                      }}
                    >
                      O valor será multiplicado por {selectedPets.length} pets
                    </div>
                  )}

                  {/* Select all services button */}
                  {services.length > 1 && (
                    <button
                      onClick={selectAllServices}
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'var(--accent-purple)', textAlign: 'left' }}
                    >
                      {selectedServices.length === services.length ? 'Desmarcar todos' : 'Selecionar todos os serviços'}
                    </button>
                  )}

                  <div className="grid sm:grid-cols-2" style={{ gap: '16px' }}>
                    {services.map((service) => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleServiceSelection(service)}
                          className={cn(
                            "flex flex-col rounded-xl border-2 transition-all text-left"
                          )}
                          style={{
                            padding: '16px',
                            background: isSelected ? 'var(--accent-purple-bg)' : 'var(--bg-tertiary)',
                            borderColor: isSelected ? 'var(--accent-purple)' : 'var(--border-primary)'
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] flex items-center justify-center text-white shadow-lg shadow-cyan-400/20">
                              {getServiceIcon(service.name)}
                            </div>
                            <div
                              className={cn(
                                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                isSelected ? "border-[#7c3aed] bg-[#7c3aed]" : "border-gray-300"
                              )}
                            >
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </div>
                          </div>
                          <p className="font-semibold" style={{ marginTop: '12px', color: 'var(--text-primary)' }}>
                            {service.name}
                          </p>
                          <p className="text-sm" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                            {service.description || 'Serviço profissional'}
                          </p>
                          <div
                            className="flex items-center border-t"
                            style={{ gap: '16px', marginTop: '12px', paddingTop: '12px', borderColor: 'var(--border-primary)' }}
                          >
                            <span className="flex items-center text-sm" style={{ gap: '4px', color: 'var(--text-muted)' }}>
                              <Clock className="h-4 w-4" />
                              {formatDuration(service.duration_min)}
                            </span>
                            <span className="flex items-center text-sm font-semibold" style={{ gap: '4px', color: 'var(--accent-green)' }}>
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(service.base_price)}
                              {selectedPets.length > 1 && (
                                <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>/pet</span>
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected count */}
                  {selectedServices.length > 0 && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} selecionado{selectedServices.length > 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Select Date/Time */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Date Selection */}
              <div>
                <p className="text-sm font-medium" style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  Selecione a data
                </p>
                <div className="flex overflow-x-auto pb-2" style={{ gap: '8px' }}>
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center rounded-xl border-2 min-w-[80px] transition-all"
                      style={{
                        padding: '12px 16px',
                        background: selectedDate === date ? 'var(--accent-purple-bg)' : 'var(--bg-tertiary)',
                        borderColor: selectedDate === date ? 'var(--accent-purple)' : 'var(--border-primary)'
                      }}
                    >
                      <span className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(date).split(",")[0]}
                      </span>
                      <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {new Date(date).getDate()}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(date).toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-medium" style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    Selecione o horário
                  </p>
                  <div className="grid grid-cols-4" style={{ gap: '8px' }}>
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className="rounded-xl border-2 font-medium transition-all"
                        style={{
                          padding: '12px',
                          background: selectedTime === time ? 'var(--accent-purple-bg)' : 'var(--bg-tertiary)',
                          borderColor: selectedTime === time ? 'var(--accent-purple)' : 'var(--border-primary)',
                          color: selectedTime === time ? 'var(--accent-purple)' : 'var(--text-secondary)'
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 &&
            selectedPets.length > 0 &&
            selectedServices.length > 0 &&
            selectedDate &&
            selectedTime && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  className="rounded-xl"
                  style={{
                    padding: '20px',
                    background: 'var(--accent-purple-bg)',
                    border: '1px solid var(--accent-purple)'
                  }}
                >
                  <p className="text-sm font-medium" style={{ marginBottom: '16px', color: 'var(--accent-purple)' }}>
                    Resumo do Agendamento
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="flex items-start" style={{ gap: '12px' }}>
                      <PawPrint className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Pet{selectedPets.length > 1 ? 's' : ''}
                        </p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {selectedPets.map(p => p.name).join(', ')}
                        </p>
                        {selectedPets.length > 1 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                            {selectedPets.length} pets selecionados
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start" style={{ gap: '12px' }}>
                      <Scissors className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Serviço{selectedServices.length > 1 ? 's' : ''}
                        </p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {selectedServices.map(s => s.name).join(', ')}
                        </p>
                        {selectedServices.length > 1 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                            {selectedServices.length} serviços selecionados
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center" style={{ gap: '12px' }}>
                      <Calendar className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Data e Hora</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(selectedDate).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}{" "}
                          às {selectedTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center" style={{ gap: '12px' }}>
                      <Clock className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Duração estimada
                        </p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatDuration(getTotalDuration())}
                          {(selectedPets.length > 1 || selectedServices.length > 1) && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                              ({formatDuration(getServicesDurationTotal())} × {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between border-t"
                    style={{ marginTop: '16px', paddingTop: '16px', borderColor: 'var(--accent-purple)' }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Valor total</span>
                      {(selectedPets.length > 1 || selectedServices.length > 1) && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatCurrency(getServicesPriceTotal())} × {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
                      {formatCurrency(getTotalPrice())}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-xl"
                  style={{
                    padding: '16px',
                    background: 'var(--accent-yellow-bg)',
                    border: '1px solid var(--accent-yellow)'
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <strong>Atenção:</strong> {selectedPets.length > 1 ? 'Seus agendamentos serão confirmados' : 'Seu agendamento será confirmado'}
                    {' '}após análise da nossa equipe. Você receberá uma notificação
                    assim que {selectedPets.length > 1 ? 'forem confirmados' : 'for confirmado'}.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConfirm} isLoading={isLoading}>
            <Check className="h-4 w-4" />
            Confirmar Agendamento
          </Button>
        )}
      </div>
    </div>
  );
}
