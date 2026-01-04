"use client"

import React from "react"
import { Modal, Button, ModalBody, ModalHeader, ModalFooter } from "react-bootstrap"
import { MdClose } from "react-icons/md"

interface ModalBootstrapProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger" | "success"
  showFooter?: boolean
  size?: "sm" | "lg" | "xl"
}

export function ModalBootstrap({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  showFooter = true,
  size = "lg",
}: ModalBootstrapProps) {
  const variantStyles = {
    default: {
      button: "bg-gradient-to-r from-purple-600 to-pink-600 border-0",
      hoverButton: "bg-gradient-to-r from-purple-700 to-pink-700",
    },
    danger: {
      button: "bg-red-600 border-0",
      hoverButton: "bg-red-700",
    },
    success: {
      button: "bg-green-600 border-0",
      hoverButton: "bg-green-700",
    },
  }

  const buttonStyles = variantStyles[variant]

  return (
    <Modal show={isOpen} onHide={onClose} size={size} centered className="glass-modal">
      <ModalHeader closeButton className="glass-card border-0 bg-transparent backdrop-blur-xl">
        <div className="w-full">
          {title && <Modal.Title className="text-gray-900 font-bold text-lg">{title}</Modal.Title>}
          {description && <p className="text-sm text-gray-600 mt-1 mb-0">{description}</p>}
        </div>
      </ModalHeader>

      <ModalBody className="glass-card border-0 bg-transparent p-6 backdrop-blur-xl">
        {children}
      </ModalBody>

      {showFooter && (
        <ModalFooter className="glass-card border-0 bg-transparent p-4 backdrop-blur-xl">
          <Button
            variant="outline-secondary"
            onClick={onClose}
            className="rounded-lg border border-white/40 text-gray-700 hover:bg-white/40 hover:backdrop-blur-sm"
          >
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              onClick={onConfirm}
              className={`rounded-lg text-white font-semibold transition-all duration-200 ${buttonStyles.button} hover:${buttonStyles.hoverButton}`}
            >
              {confirmText}
            </Button>
          )}
        </ModalFooter>
      )}
    </Modal>
  )
}
