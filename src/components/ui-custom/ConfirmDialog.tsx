import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Eliminar",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width={400}>
      <div className="flex flex-col items-center gap-4">
        <AlertTriangle
          size={40}
          style={{ color: "var(--color-danger)" }}
        />
        <p
          className="text-sm text-center"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {message}
        </p>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 glow-btn-secondary py-2 cursor-pointer"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 cursor-pointer"
            disabled={isLoading}
            style={{
              background: "rgba(255, 51, 51, 0.2)",
              color: "#ff6666",
              border: "1px solid rgba(255, 51, 51, 0.3)",
              borderRadius: 2,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 51, 51, 0.3)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 51, 51, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 51, 51, 0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isLoading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
