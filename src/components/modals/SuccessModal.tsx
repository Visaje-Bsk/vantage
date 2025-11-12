/**
 * SuccessModal
 *
 * Modal de éxito con animación para mostrar cuando una orden se cierra exitosamente
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseDuration?: number; // en milisegundos
}

export function SuccessModal({
  isOpen,
  onClose,
  title = "¡Éxito!",
  message = "La operación se completó exitosamente",
  autoCloseDuration = 3000,
}: SuccessModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Iniciar animación
      setIsAnimating(true);

      // Auto cerrar después del tiempo especificado
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, onClose, autoCloseDuration]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {/* Icono animado */}
          <div className="relative">
            {/* Círculos de fondo pulsantes */}
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-green-200 opacity-75",
                isAnimating && "animate-ping"
              )}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-green-300 opacity-50",
                isAnimating && "animate-pulse"
              )}
            />

            {/* Icono principal */}
            <div
              className={cn(
                "relative bg-green-500 rounded-full p-6 transform transition-all duration-500",
                isAnimating ? "scale-100 rotate-0" : "scale-0 rotate-180"
              )}
            >
              <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Texto */}
          <div
            className={cn(
              "text-center space-y-2 transform transition-all duration-500 delay-200",
              isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h3 className="text-2xl font-bold text-green-900">{title}</h3>
            <p className="text-green-700 text-sm max-w-sm">{message}</p>
          </div>

          {/* Barra de progreso de auto-cierre */}
          <div className="w-full max-w-xs h-1 bg-green-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-green-500 rounded-full transition-all ease-linear",
                isAnimating && "animate-progress"
              )}
              style={{
                animation: isAnimating
                  ? `progress ${autoCloseDuration}ms linear forwards`
                  : "none",
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
