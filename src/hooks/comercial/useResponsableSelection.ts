/**
 * useResponsableSelection
 *
 * Hook para manejar la selección de responsable/ingeniero asignado a la orden
 * Gestiona la lista de usuarios asignables y la selección actual
 *
 * Características:
 * - Filtra usuarios asignables (excluye admin y comercial)
 * - Mantiene la selección del responsable actual
 * - Provee sistema de prioridad de roles para carga inicial
 *
 * @example
 * const { selectedResponsable, asignables, setSelectedResponsable, loadAsignables } = useResponsableSelection();
 * await loadAsignables();
 * setSelectedResponsable("user-uuid-123");
 */

import { useState, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Interfaz para un usuario asignable
export interface AsignableUser {
  user_id: string;
  label: string;
  role: AppRole;
}

// Prioridad de roles para selección automática
// Menor índice = mayor prioridad
export const ROLE_PRIORITY: AppRole[] = [
  "ingenieria",
  "inventarios",
  "produccion",
  "logistica",
  "facturacion",
  "financiera",
  "comercial",
];

export const useResponsableSelection = () => {
  // Usuario responsable seleccionado (UUID)
  const [selectedResponsable, setSelectedResponsable] = useState<string | null>(null);

  // Lista de usuarios asignables
  const [asignables, setAsignables] = useState<AsignableUser[]>([]);

  /**
   * Establece la lista de usuarios asignables
   * @param users - Array de usuarios asignables
   */
  const setAsignableUsers = useCallback((users: AsignableUser[]) => {
    setAsignables(users);
  }, []);

  /**
   * Limpia la selección y la lista de asignables
   */
  const clearSelection = useCallback(() => {
    setSelectedResponsable(null);
    setAsignables([]);
  }, []);

  /**
   * Obtiene el usuario seleccionado de la lista de asignables
   * @returns Usuario seleccionado o undefined si no existe
   */
  const getSelectedUser = useCallback((): AsignableUser | undefined => {
    return asignables.find((u) => u.user_id === selectedResponsable);
  }, [asignables, selectedResponsable]);

  /**
   * Selecciona automáticamente un responsable de una lista según prioridad de roles
   * @param responsables - Lista de responsables con role
   * @returns El responsable seleccionado o null
   */
  const selectByPriority = useCallback(
    (responsables: Array<{ user_id: string; role: AppRole }>): { user_id: string; role: AppRole } | null => {
      if (!responsables || responsables.length === 0) return null;

      // Ordenar por prioridad de rol
      const sorted = responsables.sort((a, b) => {
        const priorityA = ROLE_PRIORITY.indexOf(a.role);
        const priorityB = ROLE_PRIORITY.indexOf(b.role);
        return priorityA - priorityB;
      });

      const selected = sorted[0];
      setSelectedResponsable(selected.user_id);
      return selected;
    },
    []
  );

  return {
    selectedResponsable,
    asignables,
    setSelectedResponsable,
    setAsignableUsers,
    clearSelection,
    getSelectedUser,
    selectByPriority,
  };
};
