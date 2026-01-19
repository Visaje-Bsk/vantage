/**
 * ComercialTab - Refactorizado con hooks modulares
 *
 * Tab para gestionar la información comercial de una orden de pedido.
 * Incluye: cliente, proyecto, responsable, equipos, servicios y despacho.
 *
 * Refactorización: De 1920 líneas monolíticas a ~600 líneas usando 14 hooks modulares.
 */

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OrdenKanban } from "@/types/kanban";
import { Building2, FolderOpen, User, Save, Plus, ChevronDown, ChevronRight, Trash2, Edit, Lock, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import EquipoSelector from "@/components/catalogs/EquipoSelector";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { PhoneInput } from "@/components/ui/phone-input";

// Hooks compartidos
import { useCurrencyFormatter } from "@/hooks/shared/useCurrencyFormatter";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useConfirmationDialog } from "@/hooks/shared/useConfirmationDialog";
import { useEditMode } from "@/hooks/shared/useEditMode";

// Hooks comerciales
import { useComercialForm } from "@/hooks/comercial/useComercialForm";
import { useProductLines } from "@/hooks/comercial/useProductLines";
import { useServiceLines } from "@/hooks/comercial/useServiceLines";
import { useDespachoForm } from "@/hooks/comercial/useDespachoForm";
import { useResponsableSelection, ROLE_PRIORITY } from "@/hooks/comercial/useResponsableSelection";
import { useComercialValidation } from "@/hooks/comercial/useComercialValidation";
import { useComercialData } from "@/hooks/comercial/useComercialData";
import { useComercialDisplay } from "@/hooks/comercial/useComercialDisplay";
import { useUnsavedChanges } from "@/hooks/comercial/useUnsavedChanges";
import { useComercialSave } from "@/hooks/comercial/useComercialSave";

// Data Gates
import { useDataGateValidation, useDataGateStatus } from "@/hooks/useDataGateValidation";
import { DataGateAlert } from "@/components/dataGates/DataGateAlert";
import type { FaseOrdenDB } from "@/types/kanban";

type AppRole = Database["public"]["Enums"]["app_role"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ClaseCobro = Database["public"]["Enums"]["clase_cobro"];

interface ComercialTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onRequestClose?: () => void;
  onTabChange?: (canChange: boolean) => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export function ComercialTab({ order, onUpdateOrder, onRequestClose, onTabChange, onUnsavedChangesChange }: ComercialTabProps) {
  // ==================== HOOKS DE ESTADO ====================

  // Hooks compartidos
  const { formatCOP, digitsOnly } = useCurrencyFormatter();
  const { isLoading: loading } = useLoadingState();
  const confirmation = useConfirmationDialog();
  const editMode = useEditMode();

  // Hooks de formularios
  const form = useComercialForm(order);
  const products = useProductLines();
  const services = useServiceLines();
  const despacho = useDespachoForm();
  const responsable = useResponsableSelection();

  // Hooks de datos y visualización
  const comercialData = useComercialData(order.id_orden_pedido);
  const display = useComercialDisplay();

  // Hooks de validación
  const validation = useComercialValidation();

  // Hook de guardado
  const { saveComercialData, isSaving } = useComercialSave(order.id_orden_pedido);

  // Hook de cambios sin guardar
  const unsavedChanges = useUnsavedChanges({
    isEditMode: editMode.isEditMode,
    formData: form.formData,
    productLines: products.productLines,
    serviceLines: services.serviceLines,
    despachoForm: despacho.despachoForm,
    selectedResponsable: responsable.selectedResponsable,
    deletedEquipoIds: products.deletedEquipoIds,
    deletedServicioIds: services.deletedServiceIds,
  });

  // Hooks de Data Gates
  const dataGateValidation = useDataGateValidation({
    order: {
      ...order,
      // Agregar datos del formulario para validación
      id_cliente: form.formData.id_cliente || order.id_cliente,
      id_tipo_servicio: order.id_tipo_servicio,
      id_ingeniero_asignado: responsable.selectedResponsable || null,
    },
    currentPhase: 'comercial' as FaseOrdenDB,
    hasUnsavedChanges: unsavedChanges.hasUnsavedChanges,
  });

  const dataGateStatus = useDataGateStatus({
    order: {
      ...order,
      id_cliente: form.formData.id_cliente,
      id_clase_orden: form.formData.id_clase_orden,
      id_tipo_servicio: form.formData.id_tipo_servicio,
      id_ingeniero_asignado: responsable.selectedResponsable || null,
    },
    currentPhase: 'comercial' as FaseOrdenDB,
  });

  // ==================== FUNCIONES DE CARGA DE DATOS ====================

  /**
   * Carga los datos iniciales de visualización (modo readonly)
   */
  const loadInitialDisplayData = async () => {
    try {
      // Obtener datos básicos de la orden actual con joins mínimos
      const { data: orderData, error: ordErr } = await supabase
        .from("orden_pedido")
        .select(`
          *,
          cliente ( nombre_cliente, nit ),
          proyecto ( id_proyecto, nombre_proyecto )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .single();
      if (ordErr) throw ordErr;

      // Obtener información de despacho existente
      const { data: despachoData, error: despachoErr } = await supabase
        .from("despacho_orden")
        .select(`
          *,
          tipo_despacho ( nombre_tipo, requiere_direccion, requiere_transportadora ),
          transportadora ( nombre_transportadora ),
          direccion_despacho ( direccion, ciudad ),
          contacto_despacho ( nombre_contacto, telefono, email, email2, email3 )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .maybeSingle();
      if (despachoErr && despachoErr.code !== "PGRST116") throw despachoErr;

      // Obtener responsables de la orden
      const { data: resp, error: respErr } = await supabase
        .from("responsable_orden")
        .select(`
          user_id,
          role,
          profiles!inner ( nombre, username )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .neq("role", "admin" as AppRole);
      if (respErr) throw respErr;

      // Seleccionar responsable por prioridad
      const ingenieroAsignado = responsable.selectByPriority(
        (resp ?? []).map(r => ({ user_id: r.user_id, role: r.role as AppRole }))
      );

      // Actualizar datos de visualización
      const orderDataWithJoins = orderData as typeof orderData & {
        cliente?: { nombre_cliente: string; nit: string } | null;
        proyecto?: { nombre_proyecto: string } | null;
      };

      const ingenieroWithProfile = resp?.find(r => r.user_id === ingenieroAsignado?.user_id) as typeof resp[0] & {
        profiles?: { nombre?: string; username?: string } | null;
      };

      const ingenieroNombre = ingenieroWithProfile?.profiles?.nombre || ingenieroWithProfile?.profiles?.username || "";

      display.updateDisplayData({
        cliente_nombre: orderDataWithJoins.cliente?.nombre_cliente || "",
        proyecto_nombre: orderDataWithJoins.proyecto?.nombre_proyecto || "",
        ingeniero_nombre: ingenieroNombre,
        orden_compra: orderData.orden_compra || "",
        observaciones: orderData.observaciones_orden || "",
      });

      // Verificar si los campos deben estar bloqueados
      editMode.setIsFieldsLocked(Boolean(ingenieroAsignado));

      // Actualizar formData básico
      // Si no tiene proyecto asignado, usar "no_aplica"
      const proyectoId = orderData.id_proyecto
        ? orderData.id_proyecto.toString()
        : "no_aplica";

      form.resetForm({
        id_cliente: orderData.id_cliente?.toString() || "",
        id_proyecto: proyectoId,
        observaciones_orden: orderData.observaciones_orden || "",
        orden_compra: orderData.orden_compra || "",
      });

      // Cargar proyecto si falta el nombre
      if (orderData.id_proyecto && !orderDataWithJoins.proyecto?.nombre_proyecto) {
        try {
          const { data: proyectoData, error: projErr } = await supabase
            .from("proyecto")
            .select("nombre_proyecto")
            .eq("id_proyecto", orderData.id_proyecto)
            .single();
          if (!projErr && proyectoData) {
            display.updateDisplayData({ proyecto_nombre: proyectoData.nombre_proyecto });
          }
        } catch (error) {
          console.error("Error loading project name:", error);
        }
      }

      // Configurar datos de despacho existente
      if (despachoData) {
        const despachoWithJoins = despachoData as typeof despachoData & {
          direccion_despacho?: { direccion?: string; ciudad?: string } | null;
          contacto_despacho?: { nombre_contacto?: string; telefono?: string; email?: string; email2?: string; email3?: string } | null;
        };

        despacho.setDespachoOrdenId(despachoData.id_despacho_orden);
        despacho.updateMultipleFields({
          id_tipo_despacho: despachoData.id_tipo_despacho?.toString() || "",
          id_transportadora: despachoData.id_transportadora?.toString() || "",
          direccion: despachoWithJoins.direccion_despacho?.direccion || "",
          ciudad: despachoWithJoins.direccion_despacho?.ciudad || "",
          nombre_contacto: despachoWithJoins.contacto_despacho?.nombre_contacto || "",
          telefono_contacto: despachoWithJoins.contacto_despacho?.telefono || "",
          email_contacto: despachoWithJoins.contacto_despacho?.email || "",
          email_contacto2: despachoWithJoins.contacto_despacho?.email2 || "",
          email_contacto3: despachoWithJoins.contacto_despacho?.email3 || "",
          observaciones: despachoData.observaciones || "",
        });
      } else {
        despacho.clearForm();
      }

      // Cargar catálogos básicos para modo readonly
      await comercialData.loadCatalogos();

      // Cargar detalle existente
      const { productLines: loadedProducts, serviceLines: loadedServices } = await comercialData.loadDetalleOrden();
      products.setLines(loadedProducts);
      services.setLines(loadedServices);
      if (loadedServices.length > 1 || loadedServices[0].operadorId) {
        display.setShowLineasDetalle(true);
      }

      // Cargar proyectos si hay cliente asignado
      if (orderData.id_cliente) {
        await comercialData.loadProyectos(orderData.id_cliente.toString());
      }

    } catch (error) {
      console.error("Error loading initial display data:", error);
      toast.error("No se pudo cargar la información básica");
    }
  };

  /**
   * Carga los datos necesarios para modo edición
   */
  const loadEditModeData = async () => {
    try {
      // Cargar catálogos
      await comercialData.loadCatalogos();

      // Cargar usuarios asignables
      const { data: comercialesRes, error: comercialesErr } = await supabase
        .from("profiles")
        .select("user_id, nombre, username, role")
        .neq("role", "comercial" as AppRole)
        .neq("role", "admin" as AppRole)
        .order("nombre", { ascending: true, nullsFirst: false })
        .order("username", { ascending: true });

      if (comercialesErr) throw comercialesErr;

      responsable.setAsignableUsers(
        (comercialesRes ?? []).map((u: ProfileRow) => ({
          user_id: u.user_id,
          label: u.nombre ?? u.username ?? "(sin nombre)",
          role: u.role as AppRole,
        }))
      );

      // Cargar proyectos si ya hay cliente seleccionado
      if (form.formData.id_cliente && comercialData.proyectos.length === 0) {
        await comercialData.loadProyectos(form.formData.id_cliente);
      }

      // Cargar responsable actual si no está establecido
      if (!responsable.selectedResponsable) {
        const { data: respAsignados, error: respErr } = await supabase
          .from("responsable_orden")
          .select("user_id, role")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .neq("role", "admin" as AppRole);

        if (!respErr && respAsignados && respAsignados.length > 0) {
          responsable.selectByPriority(
            respAsignados.map(r => ({ user_id: r.user_id, role: r.role as AppRole }))
          );
        }
      }

    } catch (error) {
      console.error("Error loading edit mode data:", error);
      toast.error("No se pudo cargar los datos para edición");
    }
  };

  // ==================== HANDLERS DE MODO EDICIÓN ====================

  const handleEditToggle = () => {
    if (!editMode.isEditMode) {
      // Entrar en modo edición
      loadEditModeData().then(() => {
        // Capturar snapshot del estado inicial
        unsavedChanges.setInitialStates();
      });
      editMode.enterEditMode();
    } else {
      // Salir de modo edición - verificar cambios sin guardar
      if (unsavedChanges.hasUnsavedChanges) {
        confirmation.setConfirmationType("switchMode");
      } else {
        editMode.exitEditMode();
      }
    }
  };

  const handleCancelEdit = () => {
    if (unsavedChanges.hasUnsavedChanges) {
      confirmation.setConfirmationType("switchMode");
    } else {
      editMode.exitEditMode();
      loadInitialDisplayData();
    }
  };

  const confirmDiscardChanges = () => {
    editMode.exitEditMode();
    // Limpiar IDs de elementos a eliminar
    products.clearDeletedIds();
    services.clearDeletedIds();
    // Limpiar errores de validación
    validation.clearAllErrors();
    // Recargar datos originales
    loadInitialDisplayData();
  };

  // ==================== HANDLERS DE PRODUCTOS ====================

  const handleAddProductLine = () => {
    products.addLine();
  };

  const handleRemoveProductLine = (id: number) => {
    if (products.productLines.length > 1) {
      const lineToRemove = products.productLines.find(line => line.id_linea_detalle === id);

      // Si la línea existe en BD, necesita confirmación
      if (lineToRemove?.id_orden_detalle) {
        confirmation.setItemToDelete({ id, type: "equipo" });
        confirmation.setConfirmationType("deleteEquipo");
      } else {
        // Línea nueva, eliminar directamente
        products.removeLine(id);
      }
    }
  };

  const confirmDeleteEquipo = () => {
    if (!confirmation.itemToDelete || confirmation.itemToDelete.type !== "equipo") return;
    products.removeLine(confirmation.itemToDelete.id);
    confirmation.setItemToDelete(null);
  };

  const handleQuantityChange = (id: number, value: string) => {
    // Permitir solo números enteros
    const cleanValue = value.replace(/[^0-9]/g, "");

    // Actualizar el valor
    products.updateLine(id, "cantidad", cleanValue);

    // Validar si hay valor
    if (cleanValue) {
      const validationResult = validation.validateQuantity(cleanValue);
      if (!validationResult.valid && validationResult.error) {
        validation.setQuantityError(id, validationResult.error);
      } else {
        validation.setQuantityError(id, "");
      }
    } else {
      validation.setQuantityError(id, "");
    }
  };

  // ==================== HANDLERS DE SERVICIOS ====================

  const handleAddServicioLine = () => {
    services.addLine();
    display.setShowLineasDetalle(true);
  };

  const handleRemoveServicioLine = (id: number) => {
    if (services.serviceLines.length > 1) {
      const lineToRemove = services.serviceLines.find(line => line.id_linea_detalle === id);

      // Si la línea existe en BD, necesita confirmación
      if (lineToRemove?.id_orden_detalle) {
        confirmation.setItemToDelete({ id, type: "servicio" });
        confirmation.setConfirmationType("deleteServicio");
      } else {
        // Línea nueva, eliminar directamente
        services.removeLine(id);
      }
    }
  };

  const confirmDeleteServicio = () => {
    if (!confirmation.itemToDelete || confirmation.itemToDelete.type !== "servicio") return;
    services.removeLine(confirmation.itemToDelete.id);
    confirmation.setItemToDelete(null);
  };

  const handlePermanenciaChange = (id: number, raw: string) => {
    const digits = digitsOnly(raw);
    if (!digits) {
      services.updateLine(id, "permanencia", "");
      return;
    }
    let valueNum = Number(digits);
    if (Number.isNaN(valueNum)) {
      services.updateLine(id, "permanencia", "");
      return;
    }
    valueNum = Math.min(Math.max(valueNum, 1), 36);
    services.updateLine(id, "permanencia", String(valueNum));
  };

  // ==================== HANDLER DE GUARDADO ====================

  const handleSave = async () => {
    // Validar líneas de productos
    const productValidation = validation.validateProductLines(products.productLines);
    if (!productValidation.valid) {
      toast.error(productValidation.error);
      return;
    }

    // Validar líneas de servicios
    const serviceValidation = validation.validateServiceLines(services.serviceLines);
    if (!serviceValidation.valid) {
      toast.error(serviceValidation.error);
      return;
    }

    // Validar errores de cantidad existentes
    if (Object.keys(validation.quantityErrors).length > 0) {
      toast.error("Por favor corrige los errores de cantidad antes de guardar");
      return;
    }

    // Validar emails si tienen valor
    const emailsToValidate = [
      { value: despacho.despachoForm.email_contacto, field: "email_contacto" },
      { value: despacho.despachoForm.email_contacto2, field: "email_contacto2" },
      { value: despacho.despachoForm.email_contacto3, field: "email_contacto3" },
    ];

    for (const { value, field } of emailsToValidate) {
      if (value) {
        const emailValidation = validation.validateEmail(value);
        if (!emailValidation.valid) {
          toast.error(`Por favor corrige el ${field === "email_contacto" ? "email principal" : field === "email_contacto2" ? "email secundario" : "email terciario"} antes de guardar`);
          validation.setEmailError(emailValidation.error || "");
          return;
        }
      }
    }
    validation.setEmailError("");

    // Validar teléfono si tiene valor
    if (despacho.despachoForm.telefono_contacto) {
      const phoneValidation = validation.validatePhone(despacho.despachoForm.telefono_contacto);
      if (!phoneValidation.valid) {
        toast.error("Por favor corrige el teléfono antes de guardar");
        validation.setPhoneError(phoneValidation.error || "");
        return;
      }
    }

    // Obtener el rol del responsable seleccionado
    const selectedUser = responsable.getSelectedUser();
    const selectedRole = selectedUser?.role ?? ("inventarios" as AppRole);

    // Guardar datos
    const result = await saveComercialData({
      formData: form.formData,
      productLines: products.productLines,
      serviceLines: services.serviceLines,
      despachoForm: despacho.despachoForm,
      selectedResponsable: responsable.selectedResponsable,
      selectedResponsableRole: selectedRole,
      deletedEquipoIds: products.deletedEquipoIds,
      deletedServicioIds: services.deletedServiceIds,
    });

    if (result) {
      // Actualizar despacho_orden_id si se creó uno nuevo
      if (result.despacho_id) {
        despacho.setDespachoOrdenId(result.despacho_id);
      }

      // Limpiar listas de eliminados
      products.clearDeletedIds();
      services.clearDeletedIds();

      // Verificar si la orden debe cambiar de estatus: borrador → abierta
      // Condición: tiene cliente, ingeniero asignado y al menos un producto/servicio
      const isOrderComplete =
        form.formData.id_cliente &&
        responsable.selectedResponsable &&
        (products.productLines.some(line => line.selectedEquipo) ||
         services.serviceLines.some(line => line.operadorId));

      let newEstatus = order.estatus;
      if (order.estatus === 'borrador' && isOrderComplete) {
        // Cambiar estatus a 'abierta'
        const { error: estatusError } = await supabase
          .from('orden_pedido')
          .update({ estatus: 'abierta' })
          .eq('id_orden_pedido', order.id_orden_pedido);

        if (!estatusError) {
          newEstatus = 'abierta';
          // Registrar en historial
          // Nota: Se requiere actor_user_id y rol_actor, pero no tenemos el usuario actual
          // Por ahora, omitimos este registro hasta tener el contexto del usuario
          // await supabase.from('historial_orden').insert({
          //   accion_clave: 'estatus_actualizado',
          //   actor_user_id: 'current_user_id', // Reemplazar con ID del usuario actual
          //   rol_actor: 'current_role', // Reemplazar con rol del usuario actual
          //   fase_anterior: order.fase,
          //   fase_nueva: order.fase,
          //   estatus_nuevo: 'abierta',
          //   observaciones: 'Orden completada y activada. Estatus cambiado de "borrador" a "abierta".',
          // });
          toast.success('Orden activada correctamente');
        }
      }

      // Actualizar UI local
      onUpdateOrder(order.id_orden_pedido, {
        fecha_modificacion: new Date().toISOString(),
        estatus: newEstatus,
      });

      // Recargar detalle
      const { productLines: reloadedProducts, serviceLines: reloadedServices } = await comercialData.loadDetalleOrden();
      products.setLines(reloadedProducts);
      services.setLines(reloadedServices);

      // Si se asignó un ingeniero, bloquear campos
      if (responsable.selectedResponsable) {
        editMode.setIsFieldsLocked(true);
      }

      // Actualizar datos de visualización
      await loadInitialDisplayData();

      // Actualizar estados iniciales después de guardar
      unsavedChanges.setInitialStates();

      // Limpiar errores de validación
      validation.clearAllErrors();

      // Salir del modo edición
      editMode.exitEditMode();
    }
  };

  // ==================== OTROS HANDLERS ====================

  const handleClienteChange = (clienteId: string) => {
    form.updateField("id_cliente", clienteId);
    form.updateField("id_proyecto", "");
    comercialData.loadProyectos(clienteId);
  };

  // ==================== EFFECTS ====================

  // Carga inicial de datos
  useEffect(() => {
    loadInitialDisplayData();

    // Determinar modo inicial basado en fecha_modificacion
    const isNewOrder = !order.fecha_modificacion;
    if (isNewOrder) {
      editMode.setIsEditMode(true);
      // Para órdenes nuevas, cargar datos de edición después
      setTimeout(() => loadEditModeData(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos cuando entra en modo edición
  useEffect(() => {
    if (editMode.isEditMode) {
      loadEditModeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode.isEditMode]);

  // Notificar al padre cuando cambian los cambios sin guardar
  useEffect(() => {
    onUnsavedChangesChange?.(unsavedChanges.hasUnsavedChanges);
  }, [unsavedChanges.hasUnsavedChanges, onUnsavedChangesChange]);

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Información Comercial
            </span>
            <div className="flex items-center gap-2">
              {editMode.isFieldsLocked && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  Campos bloqueados
                </div>
              )}
              {!editMode.isEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {/* Data Gates Validation */}
        <DataGateAlert 
          errors={dataGateValidation.errors}
          canAdvance={dataGateValidation.canAdvance}
          phaseName="Comercial"
        />
        
        <CardContent className="space-y-6">
          {!editMode.isEditMode ? (
            // ==================== MODO READONLY ====================
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Cliente
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {display.displayData.cliente_nombre || "Sin asignar"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Proyecto
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {display.displayData.proyecto_nombre || (
                      <span className="text-muted-foreground italic">No aplica</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ingeniero asignado</Label>
                <div className="p-3 bg-muted/50 rounded-md text-sm">
                  {display.displayData.ingeniero_nombre || "Sin asignar"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Código OC</Label>
                <div className="p-3 bg-muted/50 rounded-md text-sm">
                  {display.displayData.orden_compra || "Sin definir"}
                </div>
              </div>
            </div>
          ) : (
            // ==================== MODO EDICIÓN ====================
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Cliente
                  </Label>
                  <Select
                    value={form.formData.id_cliente}
                    onValueChange={handleClienteChange}
                    disabled={editMode.isFieldsLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {comercialData.clientes.map((c) => (
                        <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>
                          {c.nombre_cliente} — {c.nit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Proyecto
                  </Label>
                  <Select
                    value={form.formData.id_proyecto}
                    onValueChange={(value) => form.updateField("id_proyecto", value)}
                    disabled={!form.formData.id_cliente || editMode.isFieldsLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_aplica" className="text-muted-foreground italic">
                        No aplica
                      </SelectItem>
                      {comercialData.proyectos.map((p) => (
                        <SelectItem key={p.id_proyecto} value={p.id_proyecto.toString()}>
                          {p.nombre_proyecto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ingeniero asignado</Label>
                <Select
                  value={responsable.selectedResponsable}
                  onValueChange={(v) => responsable.setSelectedResponsable(v)}
                  disabled={editMode.isFieldsLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsable.asignables.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código OC</Label>
                <Input
                  type="text"
                  placeholder="Código de Orden de Compra"
                  value={form.formData.orden_compra}
                  onChange={(e) => form.updateField("orden_compra", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ==================== PRODUCTOS Y SERVICIOS ==================== */}
          <Card>
            <CardHeader><CardTitle className="text-base">Productos y Servicios</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {editMode.isEditMode ? (
                // Modo edición - formularios interactivos
                <>
              {products.productLines.map((line) => (
                <div key={line.id_linea_detalle} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-12 md:col-span-1 flex md:justify-start justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveProductLine(line.id_linea_detalle)}
                      disabled={products.productLines.length === 1}
                      aria-label="Eliminar línea"
                      title="Eliminar línea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 col-span-12 md:col-span-5">
                    <Label>Equipos</Label>
                    <EquipoSelector
                      value={line.selectedEquipo}
                      onChange={(val) => products.updateLine(line.id_linea_detalle, "selectedEquipo", val)}
                      placeholder="Buscar por código o nombre..."
                    />
                  </div>
                  <div className="space-y-2 col-span-6 md:col-span-2">
                    <Label>
                      Cantidad {line.selectedEquipo?.id_equipo && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={line.cantidad}
                      onChange={(e) => handleQuantityChange(line.id_linea_detalle, e.target.value)}
                      className={
                        (line.selectedEquipo?.id_equipo && (!line.cantidad || Number(line.cantidad) <= 0)) ||
                        (line.cantidad && !line.selectedEquipo?.id_equipo) ||
                        validation.quantityErrors[line.id_linea_detalle]
                          ? "border-red-300"
                          : ""
                      }
                      min={1}
                      max={9999}
                    />
                    {validation.quantityErrors[line.id_linea_detalle] && (
                      <p className="text-xs text-red-500">{validation.quantityErrors[line.id_linea_detalle]}</p>
                    )}
                  </div>
                  <div className="space-y-2 col-span-6 md:col-span-2">
                    <Label>
                      Valor Unitario {line.selectedEquipo?.id_equipo && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="$0"
                      value={formatCOP(line.valorUnitario)}
                      onChange={(e) => {
                        const digits = digitsOnly(e.target.value);
                        products.updateLine(line.id_linea_detalle, "valorUnitario", digits);
                      }}
                      className={
                        (line.selectedEquipo?.id_equipo && (!line.valorUnitario || Number(line.valorUnitario) <= 0)) ||
                        (line.valorUnitario && !line.selectedEquipo?.id_equipo)
                          ? "border-red-300"
                          : ""
                      }
                    />
                  </div>

                  {/* Plantilla section */}
                  <div className="col-span-12 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`plantilla-${line.id_linea_detalle}`}
                        checked={line.plantilla}
                        onCheckedChange={(checked) => products.updateLine(line.id_linea_detalle, "plantilla", checked)}
                      />
                      <Label htmlFor={`plantilla-${line.id_linea_detalle}`}>Plantilla</Label>
                    </div>
                    {line.plantilla && (
                      <Input
                        type="text"
                        placeholder="Información de plantilla..."
                        value={line.plantillaText}
                        onChange={(e) => products.updateLine(line.id_linea_detalle, "plantillaText", e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
                  <Button variant="outline" size="sm" onClick={handleAddProductLine}>
                    <Plus className="w-4 h-4 mr-2" /> Agregar Equipo
                  </Button>

                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => display.setShowLineasDetalle(!display.showLineasDetalle)}
                  >
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Líneas de Servicio</span>
                      {display.showLineasDetalle ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {display.showLineasDetalle && (
              <CardContent className="space-y-4">
                {services.serviceLines.map((line) => (
                  <div key={line.id_linea_detalle} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-1 flex justify-end pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveServicioLine(line.id_linea_detalle)}
                        disabled={services.serviceLines.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="col-span-11 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Operador */}
                        <div className="space-y-2">
                          <Label>Operador</Label>
                          <Select
                            value={line.operadorId}
                            onValueChange={(value) => services.updateLine(line.id_linea_detalle, "operadorId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {comercialData.operadores.map((op) => (
                                <SelectItem key={op.id_operador} value={op.id_operador.toString()}>
                                  {op.nombre_operador}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Plan */}
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Select
                            value={line.planId}
                            onValueChange={(value) => services.updateLine(line.id_linea_detalle, "planId", value)}
                            disabled={!line.operadorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {comercialData.planes
                                .filter(p => p.id_operador.toString() === line.operadorId)
                                .map((plan) => (
                                  <SelectItem key={plan.id_plan} value={plan.id_plan.toString()}>
                                    {plan.nombre_plan}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* APN */}
                        <div className="space-y-2">
                          <Label>APN</Label>
                          <Select
                            value={line.apnId}
                            onValueChange={(value) => services.updateLine(line.id_linea_detalle, "apnId", value)}
                            disabled={!line.operadorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar APN" />
                            </SelectTrigger>
                            <SelectContent>
                              {comercialData.apns
                                .filter(apn => apn.id_operador.toString() === line.operadorId)
                                .map((apn) => (
                                  <SelectItem key={apn.id_apn} value={apn.id_apn.toString()}>
                                    {apn.apn}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clase de Cobro */}
                        <div className="space-y-2">
                          <Label>Clase de Cobro</Label>
                          <Select
                            value={line.claseCobro}
                            onValueChange={(value) => services.updateLine(line.id_linea_detalle, "claseCobro", value as ClaseCobro)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mensual">Mensual</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Valor Mensual */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2 md:col-span-1">
                          <Label>Valor Mensual</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="$0"
                            value={formatCOP(line.valorMensual)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, "");
                              services.updateLine(line.id_linea_detalle, "valorMensual", digits);
                            }}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                          <Label>Permanencia (meses)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={36}
                            placeholder="0"
                            value={line.permanencia}
                            onChange={(e) => handlePermanenciaChange(line.id_linea_detalle, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddServicioLine}
                  className="mt-2"
                >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Línea de Servicio
                    </Button>
                  </CardContent>
                )}
                </>
              ) : (
                // Modo solo lectura - mostrar información existente
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Equipos Configurados</h4>
                    {products.productLines.length > 0 && products.productLines.some(line => line.selectedEquipo) ? (
                      <div className="space-y-2">
                        {products.productLines
                          .filter(line => line.selectedEquipo)
                          .map((line, idx) => (
                          <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Equipo:</span> {line.selectedEquipo?.nombre_equipo}
                              </div>
                              <div>
                                <span className="font-medium">Código:</span> {line.selectedEquipo?.codigo}
                              </div>
                              <div>
                                <span className="font-medium">Cantidad:</span> {line.cantidad || "0"}
                              </div>
                              <div>
                                <span className="font-medium">Valor:</span> {formatCOP(line.valorUnitario)}
                              </div>
                            </div>
                            {line.plantilla && line.plantillaText && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs border-l-2 border-blue-500">
                                <span className="font-medium">Plantilla:</span> {line.plantillaText}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                        No hay equipos configurados
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Líneas de Servicio</h4>
                    {services.serviceLines.length > 0 && services.serviceLines.some(line => line.operadorId) ? (
                      <div className="space-y-2">
                        {services.serviceLines
                          .filter(line => line.operadorId)
                          .map((line, idx) => {
                            const operadorNombre = comercialData.operadores.length > 0
                              ? comercialData.operadores.find(op => op.id_operador.toString() === line.operadorId)?.nombre_operador
                              : null;
                            const planNombre = comercialData.planes.length > 0
                              ? comercialData.planes.find(p => p.id_plan.toString() === line.planId)?.nombre_plan
                              : null;
                            const apnNombre = comercialData.apns.length > 0
                              ? comercialData.apns.find(a => a.id_apn.toString() === line.apnId)?.apn
                              : null;

                            return (
                              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Operador:</span> {operadorNombre || `ID: ${line.operadorId}`}
                                  </div>
                                  <div>
                                    <span className="font-medium">Plan:</span> {planNombre || `ID: ${line.planId}`}
                                  </div>
                                  <div>
                                    <span className="font-medium">APN:</span> {apnNombre || `ID: ${line.apnId}`}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-2">
                                  <div>
                                    <span className="font-medium">Permanencia:</span> {line.permanencia} meses
                                  </div>
                                  <div>
                                    <span className="font-medium">Clase Cobro:</span> {line.claseCobro}
                                  </div>
                                  <div>
                                    <span className="font-medium">Valor:</span> {formatCOP(line.valorMensual)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                        No hay líneas de servicio configuradas
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ==================== INFORMACIÓN DE DESPACHO ==================== */}
          {despacho.despachoForm.id_tipo_despacho && (() => {
            const tipoSeleccionado = comercialData.tiposDespacho.find(t => t.id_tipo_despacho.toString() === despacho.despachoForm.id_tipo_despacho);
            const requiereDireccion = tipoSeleccionado?.requiere_direccion ?? false;
            const requiereTransportadora = tipoSeleccionado?.requiere_transportadora ?? false;

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Información de Despacho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode.isEditMode ? (
                    <div className="space-y-4">
                      {/* Tipo de Despacho */}
                      <div className="space-y-2">
                        <Label>Tipo de Despacho</Label>
                        <Select
                          value={despacho.despachoForm.id_tipo_despacho}
                          onValueChange={(value) => despacho.updateField("id_tipo_despacho", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {comercialData.tiposDespacho.map((tipo) => (
                              <SelectItem key={tipo.id_tipo_despacho} value={tipo.id_tipo_despacho.toString()}>
                                {tipo.nombre_tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Campos de Dirección */}
                      {requiereDireccion && (
                        <>
                          <div className="space-y-2">
                            <Label>Dirección de Envío</Label>
                            <Textarea
                              value={despacho.despachoForm.direccion}
                              onChange={(e) => despacho.updateField("direccion", e.target.value)}
                              placeholder="Dirección completa de entrega"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Ciudad</Label>
                            <Input
                              value={despacho.despachoForm.ciudad}
                              onChange={(e) => despacho.updateField("ciudad", e.target.value)}
                              placeholder="Ciudad"
                            />
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Contacto de Entrega</h4>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Nombre del Contacto</Label>
                                <Input
                                  value={despacho.despachoForm.nombre_contacto}
                                  onChange={(e) => despacho.updateField("nombre_contacto", e.target.value)}
                                  placeholder="Nombre completo"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Teléfono</Label>
                                  <PhoneInput
                                    value={despacho.despachoForm.telefono_contacto}
                                    onChange={(value) => {
                                      despacho.updateField("telefono_contacto", value);
                                      if (value) {
                                        const phoneValidation = validation.validatePhone(value);
                                        validation.setPhoneError(phoneValidation.error || "");
                                      } else {
                                        validation.setPhoneError("");
                                      }
                                    }}
                                    onBlur={() => {
                                      const phoneValidation = validation.validatePhone(despacho.despachoForm.telefono_contacto);
                                      validation.setPhoneError(phoneValidation.error || "");
                                    }}
                                    placeholder="320 242 2311"
                                    error={validation.phoneError}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email Principal</Label>
                                  <Input
                                    type="email"
                                    value={despacho.despachoForm.email_contacto}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      despacho.updateField("email_contacto", value);
                                      if (value) {
                                        const emailValidation = validation.validateEmail(value);
                                        validation.setEmailError(emailValidation.error || "");
                                      } else {
                                        validation.setEmailError("");
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const emailValidation = validation.validateEmail(e.target.value);
                                      validation.setEmailError(emailValidation.error || "");
                                    }}
                                    placeholder="usuario@ejemplo.com"
                                    className={validation.emailError ? "border-red-300" : ""}
                                  />
                                  {validation.emailError && (
                                    <p className="text-xs text-red-500">{validation.emailError}</p>
                                  )}
                                </div>
                              </div>
                              {/* Emails adicionales */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Email Secundario (opcional)</Label>
                                  <Input
                                    type="email"
                                    value={despacho.despachoForm.email_contacto2}
                                    onChange={(e) => despacho.updateField("email_contacto2", e.target.value)}
                                    placeholder="usuario2@ejemplo.com"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email Terciario (opcional)</Label>
                                  <Input
                                    type="email"
                                    value={despacho.despachoForm.email_contacto3}
                                    onChange={(e) => despacho.updateField("email_contacto3", e.target.value)}
                                    placeholder="usuario3@ejemplo.com"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Transportadora */}
                      {requiereTransportadora && (
                        <div className="space-y-2">
                          <Label>Transportadora</Label>
                          <Select
                            value={despacho.despachoForm.id_transportadora}
                            onValueChange={(value) => despacho.updateField("id_transportadora", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar transportadora" />
                            </SelectTrigger>
                            <SelectContent>
                              {comercialData.transportadoras.map((transportadora) => (
                                <SelectItem key={transportadora.id_transportadora} value={transportadora.id_transportadora.toString()}>
                                  {transportadora.nombre_transportadora}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Observaciones */}
                      <div className="space-y-2">
                        <Label>Observaciones de Despacho</Label>
                        <Textarea
                          placeholder="Observaciones especiales para el despacho..."
                          value={despacho.despachoForm.observaciones}
                          onChange={(e) => despacho.updateField("observaciones", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    // Vista readonly
                    <div className="space-y-3">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Tipo de Despacho</Label>
                          <div className="p-2 bg-muted/30 rounded text-sm">
                            {tipoSeleccionado?.nombre_tipo || "Sin definir"}
                          </div>
                        </div>

                        {requiereDireccion && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">Dirección</Label>
                              <div className="p-2 bg-muted/30 rounded text-sm">
                                {despacho.despachoForm.direccion || "Sin definir"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">Ciudad</Label>
                              <div className="p-2 bg-muted/30 rounded text-sm">
                                {despacho.despachoForm.ciudad || "Sin definir"}
                              </div>
                            </div>
                            {(despacho.despachoForm.nombre_contacto || despacho.despachoForm.telefono_contacto || despacho.despachoForm.email_contacto) && (
                              <div className="border-t pt-3 space-y-2">
                                <h4 className="text-sm font-semibold">Contacto de Entrega</h4>
                                {despacho.despachoForm.nombre_contacto && (
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Nombre</Label>
                                    <div className="p-2 bg-muted/30 rounded text-sm">
                                      {despacho.despachoForm.nombre_contacto}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  {despacho.despachoForm.telefono_contacto && (
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Teléfono</Label>
                                      <div className="p-2 bg-muted/30 rounded text-sm">
                                        {despacho.despachoForm.telefono_contacto}
                                      </div>
                                    </div>
                                  )}
                                  {despacho.despachoForm.email_contacto && (
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Email Principal</Label>
                                      <div className="p-2 bg-muted/30 rounded text-sm">
                                        {despacho.despachoForm.email_contacto}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Emails adicionales en readonly */}
                                {(despacho.despachoForm.email_contacto2 || despacho.despachoForm.email_contacto3) && (
                                  <div className="grid grid-cols-2 gap-4">
                                    {despacho.despachoForm.email_contacto2 && (
                                      <div className="space-y-1">
                                        <Label className="text-sm font-medium">Email Secundario</Label>
                                        <div className="p-2 bg-muted/30 rounded text-sm">
                                          {despacho.despachoForm.email_contacto2}
                                        </div>
                                      </div>
                                    )}
                                    {despacho.despachoForm.email_contacto3 && (
                                      <div className="space-y-1">
                                        <Label className="text-sm font-medium">Email Terciario</Label>
                                        <div className="p-2 bg-muted/30 rounded text-sm">
                                          {despacho.despachoForm.email_contacto3}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {requiereTransportadora && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Transportadora</Label>
                            <div className="p-2 bg-muted/30 rounded text-sm">
                              {comercialData.transportadoras.find(t => t.id_transportadora.toString() === despacho.despachoForm.id_transportadora)?.nombre_transportadora || "Sin definir"}
                            </div>
                          </div>
                        )}

                        {despacho.despachoForm.observaciones && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Observaciones</Label>
                            <div className="p-2 bg-muted/30 rounded text-sm">
                              {despacho.despachoForm.observaciones}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* ==================== OBSERVACIONES COMERCIALES ==================== */}
          <div className="space-y-2">
            <Label>Observaciones Comerciales</Label>
            {!editMode.isEditMode ? (
              <div className="p-3 bg-muted/50 rounded-md text-sm min-h-[100px]">
                {display.displayData.observaciones || "Sin observaciones"}
              </div>
            ) : (
              <Textarea
                value={form.formData.observaciones_orden}
                onChange={(e) => form.updateField("observaciones_orden", e.target.value)}
                placeholder="Observaciones comerciales, condiciones especiales, acuerdos..."
                rows={4}
              />
            )}
          </div>

          {editMode.isEditMode && (
            <div className="flex items-center justify-between gap-3">
              <DataGateAlert 
                errors={dataGateValidation.errors}
                canAdvance={dataGateValidation.canAdvance}
                phaseName="Comercial"
              />
              <Button onClick={handleSave} disabled={isSaving || !dataGateValidation.canAdvance} variant="default" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Información Comercial"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== MODALES DE CONFIRMACIÓN ==================== */}

      {/* Modal de cambios sin guardar */}
      <ConfirmationDialog
        open={confirmation.confirmationType === "switchMode"}
        onOpenChange={(open) => !open && confirmation.setConfirmationType(null)}
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar. ¿Deseas guardarlos antes de salir?"
        confirmText="Guardar y salir"
        cancelText="Cancelar"
        showThirdOption
        thirdOptionText="Salir sin guardar"
        onConfirm={async () => {
          await handleSave();
        }}
        onThirdOption={confirmDiscardChanges}
        onCancel={() => confirmation.setConfirmationType(null)}
      />

      {/* Modal de eliminar equipo */}
      <ConfirmationDialog
        open={confirmation.confirmationType === "deleteEquipo"}
        onOpenChange={(open) => {
          if (!open) {
            confirmation.setConfirmationType(null);
            confirmation.setItemToDelete(null);
          }
        }}
        title="Eliminar equipo"
        description="¿Estás seguro de que deseas eliminar este equipo? Esta acción se completará al guardar los cambios."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteEquipo}
        onCancel={() => {
          confirmation.setConfirmationType(null);
          confirmation.setItemToDelete(null);
        }}
      />

      {/* Modal de eliminar servicio */}
      <ConfirmationDialog
        open={confirmation.confirmationType === "deleteServicio"}
        onOpenChange={(open) => {
          if (!open) {
            confirmation.setConfirmationType(null);
            confirmation.setItemToDelete(null);
          }
        }}
        title="Eliminar línea de servicio"
        description="¿Estás seguro de que deseas eliminar esta línea de servicio? Esta acción se completará al guardar los cambios."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteServicio}
        onCancel={() => {
          confirmation.setConfirmationType(null);
          confirmation.setItemToDelete(null);
        }}
      />
    </div>
  );
}
