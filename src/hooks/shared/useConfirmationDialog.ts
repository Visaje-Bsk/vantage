/**
 * useConfirmationDialog
 *
 * Hook para manejar múltiples tipos de diálogos de confirmación
 * Soporta confirmaciones con acciones pendientes y diferentes tipos de diálogos
 *
 * @example
 * const { confirmationType, openConfirmation, closeConfirmation } = useConfirmationDialog();
 *
 * // Abrir diálogo de confirmación con acción pendiente
 * openConfirmation("deleteItem", () => deleteItem(id));
 *
 * // En el render
 * <Dialog open={confirmationType === "deleteItem"}>
 *   <DialogContent>...</DialogContent>
 * </Dialog>
 */

import { useState, useCallback } from "react";

export type ConfirmationType = "close" | "switchMode" | "deleteEquipo" | "deleteServicio" | null;

export const useConfirmationDialog = () => {
  // Tipo de confirmación activa (null si ninguna está abierta)
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);

  // Acción pendiente a ejecutar cuando se confirme
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Item específico a eliminar (para confirmaciones de delete)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: "equipo" | "servicio" } | null>(null);

  /**
   * Abre un diálogo de confirmación
   * @param type - Tipo de confirmación a mostrar
   * @param action - Acción opcional a ejecutar cuando se confirme
   * @param deleteItem - Item opcional a eliminar (para confirmaciones de delete)
   */
  const openConfirmation = useCallback(
    (
      type: ConfirmationType,
      action?: () => void,
      deleteItem?: { id: number; type: "equipo" | "servicio" }
    ) => {
      setConfirmationType(type);
      if (action) setPendingAction(() => action);
      if (deleteItem) setItemToDelete(deleteItem);
    },
    []
  );

  /**
   * Cierra el diálogo de confirmación y limpia el estado
   */
  const closeConfirmation = useCallback(() => {
    setConfirmationType(null);
    setPendingAction(null);
    setItemToDelete(null);
  }, []);

  /**
   * Ejecuta la acción pendiente y cierra el diálogo
   */
  const confirmAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    closeConfirmation();
  }, [pendingAction, closeConfirmation]);

  return {
    confirmationType,
    pendingAction,
    itemToDelete,
    openConfirmation,
    closeConfirmation,
    confirmAction,
    setConfirmationType,
    setItemToDelete,
  };
};
