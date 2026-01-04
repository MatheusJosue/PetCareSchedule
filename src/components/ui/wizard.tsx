"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProps {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
}

export function WizardStep({
  number,
  title,
  isActive,
  isCompleted,
  onClick,
}: StepProps) {
  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
          isActive && "bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white shadow-lg shadow-purple-400/30",
          isCompleted && "bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white shadow-lg shadow-purple-400/30",
          !isActive && !isCompleted && "border-2"
        )}
        style={
          !isActive && !isCompleted
            ? {
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-muted)",
              }
            : undefined
        }
      >
        {isCompleted ? <Check className="w-5 h-5" /> : number}
      </div>
      <p
        className="text-xs font-medium mt-2 text-center max-w-[80px]"
        style={{ color: isActive || isCompleted ? "var(--text-primary)" : "var(--text-muted)" }}
      >
        {title}
      </p>
    </div>
  );
}

interface WizardProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  onStepClick?: (step: number) => void;
  children: React.ReactNode;
}

export function WizardContainer({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  children,
}: WizardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Progress Steps */}
      <div
        className="rounded-2xl border"
        style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Step indicator text */}
        <p
          className="text-sm font-medium text-center"
          style={{ marginBottom: "20px", color: "var(--text-muted)" }}
        >
          Passo {currentStep} de {totalSteps}
        </p>

        {/* Steps */}
        <div className="flex items-center justify-between">
          {steps.map((title, index) => (
            <React.Fragment key={index}>
              <WizardStep
                number={index + 1}
                title={title}
                isActive={currentStep === index + 1}
                isCompleted={currentStep > index + 1}
                onClick={() => {
                  // Only allow going back to completed steps
                  if (currentStep > index + 1) {
                    onStepClick?.(index + 1);
                  }
                }}
              />
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-3 rounded-full transition-all duration-300"
                  )}
                  style={{
                    background:
                      // Paint the line if the left step (index + 1) is completed
                      // This means currentStep > index + 1
                      currentStep > index + 1
                        ? "linear-gradient(to right, #7c3aed, #a855f7)"
                        : "var(--border-primary)",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress Bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            marginTop: "24px",
            background: "var(--border-primary)",
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">{children}</div>
    </div>
  );
}

export function WizardSummary({
  data,
}: {
  data: Record<string, string | number | boolean>;
}) {
  return (
    <div
      className="rounded-2xl border sticky bottom-4 lg:static"
      style={{
        padding: "20px",
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <h3
        className="font-semibold"
        style={{ marginBottom: "16px", color: "var(--text-primary)" }}
      >
        Resumo do Agendamento
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="capitalize" style={{ color: "var(--text-muted)" }}>
              {key}:
            </span>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
