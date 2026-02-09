/**
 * ComercialTab - Refactorizado con hooks modulares
 *
 * Tab para gestionar la información comercial de una orden de pedido.
 * Incluye: cliente, proyecto, responsable, equipos, servicios y despacho.
 *
 * Refactorización: De 1920 líneas monolíticas a ~600 líneas usando 14 hooks modulares.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OrdenKanban } from "@/types/kanban";
import { Building2, FolderOpen, User, Save, Plus, ChevronDown, ChevronRight, Edit, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

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
import { useMemoizedCatalogs } from "@/hooks/comercial/useMemoizedCatalogs";
import { useClasesOrden } from "@/hooks/queries/useCatalogQueries";

// Componentes memoizados de líneas
import { ProductLineItem } from "@/components/comercial/ProductLineItem";
import { ServiceLineItem } from "@/components/comercial/ServiceLineItem";
import { DespachoSection } from "@/components/comercial/DespachoSection";
import { ReadonlyProductosServicios } from "@/components/comercial/ReadonlyProductosServicios";

// Data Gates
import { useDataGateValidation, useDataGateStatus } from "@/hooks/useDataGateValidation";
import { DataGateAlert } from "@/components/dataGates/DataGateAlert";
import type { FaseOrdenDB } from "@/types/kanban";

type AppRole = Database["public"]["Enums"]["app_role"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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
  // Pasar clienteId para que React Query cargue los proyectos automáticamente
  const comercialData = useComercialData(order.id_orden_pedido, form.formData.id_cliente);
  const display = useComercialDisplay();

  // Catálogos memoizados con Map para O(1) lookups por operador
  const memoizedCatalogs = useMemoizedCatalogs({
    planes: comercialData.planes,
    apns: comercialData.apns,
  });
  const { data: clasesOrden } = useClasesOrden();

  // Determinar si la clase de orden actual es "Renta" (requiere permanencia en equipos)
  const isClaseRenta = useMemo(() => {
    const claseOrdenId = form.formData.id_clase_orden || order.id_clase_orden?.toString();
    if (!claseOrdenId || !clasesOrden) return false;
    const claseOrden = clasesOrden.find(c => c.id_clase_orden === parseInt(claseOrdenId));
    return claseOrden?.tipo_orden?.toLowerCase() === 'renta';
  }, [form.formData.id_clase_orden, order.id_clase_orden, clasesOrden]);

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



  // Estado para el diálogo de confirmación de guardado
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Estado de carga inicial
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Contar productos y servicios confirmados en UI (memoizado para evitar .filter() en cada render)
  const { confirmedProductsCount, confirmedServicesCount, hasConfirmedProducts, hasConfirmedServices } = useMemo(() => {
    const cpc = products.productLines.filter(l => l.isConfirmed).length;
    const csc = services.serviceLines.filter(l => l.isConfirmed).length;
    return { confirmedProductsCount: cpc, confirmedServicesCount: csc, hasConfirmedProducts: cpc > 0, hasConfirmedServices: csc > 0 };
  }, [products.productLines, services.serviceLines]);

  // Memoizar solo los campos relevantes para DataGate (evita recálculos en keystrokes de campos no relevantes como OC u observaciones)
  const validationClienteId = form.formData.id_cliente || order.id_cliente;
  const validationClaseOrden = form.formData.id_clase_orden || order.id_clase_orden;
  const validationTipoServicio = form.formData.id_tipo_servicio || order.id_tipo_servicio;

  const confirmedProductDetails = useMemo(() => {
    if (!hasConfirmedProducts) return order.detalles;
    return products.productLines.filter(l => l.isConfirmed).map(l => ({
      cantidad: Number(l.cantidad),
      valor_unitario: Number(l.valorUnitario),
    }));
  }, [hasConfirmedProducts, products.productLines, order.detalles]);

  const orderForValidation = useMemo(() => ({
    ...order,
    id_cliente: validationClienteId,
    id_clase_orden: validationClaseOrden,
    id_tipo_servicio: validationTipoServicio,
    id_ingeniero_asignado: responsable.selectedResponsable || null,
    detalles: confirmedProductDetails,
  }), [
    order,
    validationClienteId,
    validationClaseOrden,
    validationTipoServicio,
    responsable.selectedResponsable,
    confirmedProductDetails,
  ]);

  // Hooks de Data Gates - Usar objeto memoizado
  const dataGateValidation = useDataGateValidation({
    order: orderForValidation,
    currentPhase: 'comercial' as FaseOrdenDB,
    hasUnsavedChanges: unsavedChanges.hasUnsavedChanges,
  });

  const dataGateStatus = useDataGateStatus({
    order: orderForValidation,
    currentPhase: 'comercial' as FaseOrdenDB,
  });

  // Determinar si el botón Guardar debe estar habilitado
  const canSave = hasConfirmedProducts || hasConfirmedServices || unsavedChanges.hasUnsavedChanges;

  // ==================== FUNCIONES DE CARGA DE DATOS ====================

  /**
   * Carga los datos iniciales de visualización (modo readonly)
   */
  const loadInitialDisplayData = async () => {
    setIsInitialLoading(true);
    try {
      // Obtener datos básicos de la orden actual con joins mínimos
      // Incluir el perfil del ingeniero asignado directamente
      const { data: orderData, error: ordErr } = await supabase
        .from("orden_pedido")
        .select(`
          *,
          cliente ( nombre_cliente, nit ),
          proyecto ( id_proyecto, nombre_proyecto ),
          ingeniero_asignado:profiles!orden_pedido_id_ingeniero_asignado_fkey ( nombre, username )
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
        ingeniero_asignado?: { nombre?: string; username?: string } | null;
      };

      // Primero intentar obtener el nombre del ingeniero desde el join directo (orden_pedido.id_ingeniero_asignado)
      // Si no existe, buscar en responsable_orden como fallback
      let ingenieroNombre = "";

      if (orderDataWithJoins.ingeniero_asignado) {
        // El ingeniero está asignado directamente en orden_pedido
        ingenieroNombre = orderDataWithJoins.ingeniero_asignado.nombre || orderDataWithJoins.ingeniero_asignado.username || "";
      } else if (ingenieroAsignado) {
        // Fallback: buscar en responsable_orden
        const ingenieroWithProfile = resp?.find(r => r.user_id === ingenieroAsignado.user_id) as typeof resp[0] & {
          profiles?: { nombre?: string; username?: string } | null;
        };
        ingenieroNombre = ingenieroWithProfile?.profiles?.nombre || ingenieroWithProfile?.profiles?.username || "";
      }

      display.updateDisplayData({
        cliente_nombre: orderDataWithJoins.cliente?.nombre_cliente || "",
        proyecto_nombre: orderDataWithJoins.proyecto?.nombre_proyecto || "",
        ingeniero_nombre: ingenieroNombre,
        orden_compra: orderData.orden_compra || "",
        observaciones: orderData.observaciones_orden || "",
      });

      // Determinar el user_id del ingeniero (desde orden_pedido o responsable_orden)
      const ingenieroUserId = orderData.id_ingeniero_asignado || ingenieroAsignado?.user_id || "";

      // Verificar si los campos deben estar bloqueados
      editMode.setIsFieldsLocked(Boolean(ingenieroUserId));

      // Establecer el responsable seleccionado para modo edición
      if (ingenieroUserId) {
        responsable.setSelectedResponsable(ingenieroUserId);
      }

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
          // Campos de pago desde orden_pedido
          pago_flete: orderData.pago_flete || "",
          id_tipo_pago: orderData.id_tipo_pago?.toString() || "",
        });
      } else {
        // Aunque no haya despacho, cargar los campos de pago de la orden
        despacho.updateMultipleFields({
          pago_flete: orderData.pago_flete || "",
          id_tipo_pago: orderData.id_tipo_pago?.toString() || "",
        });
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
    } finally {
      // Pequeño delay para evitar parpadeos en cargas rápidas
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
    }
  };

  /**
   * Carga los datos necesarios para modo edición
   */
  const loadEditModeData = async () => {
    try {
      // Cargar catálogos
      await comercialData.loadCatalogos();

      // Cargar usuarios asignables - Solo usuarios con rol "ingenieria"
      const { data: comercialesRes, error: comercialesErr } = await supabase
        .from("profiles")
        .select("user_id, nombre, username, role")
        .eq("role", "ingenieria" as AppRole)
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
        // Primero verificar si hay ingeniero asignado directamente en la orden
        const { data: ordenData, error: ordenErr } = await supabase
          .from("orden_pedido")
          .select("id_ingeniero_asignado")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .single();

        if (!ordenErr && ordenData?.id_ingeniero_asignado) {
          responsable.setSelectedResponsable(ordenData.id_ingeniero_asignado);
        } else {
          // Fallback: buscar en responsable_orden
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
    products.removeLine(confirmation.itemToDelete.id as number);
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
    setShowSaveConfirm(true);
  };

  const executeSave = async () => {
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
      
      // Cerrar el diálogo de confirmación
      setShowSaveConfirm(false);
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
      // Para órdenes nuevas, cargar datos de edición y tomar snapshot inicial
      setTimeout(() => {
        loadEditModeData().then(() => {
          unsavedChanges.setInitialStates();
        });
      }, 100);
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

  // Mostrar skeleton mientras carga
  if (isInitialLoading) {
    return <TabLoadingSkeleton />;
  }

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
                    disabled={!form.formData.id_cliente}
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
                  value={responsable.selectedResponsable || ""}
                  onValueChange={(v) => responsable.setSelectedResponsable(v)}
                  disabled={editMode.isFieldsLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario">
                      {/* Mostrar el nombre del ingeniero si está disponible */}
                      {responsable.selectedResponsable && responsable.asignables.length > 0
                        ? responsable.asignables.find(u => u.user_id === responsable.selectedResponsable)?.label || display.displayData.ingeniero_nombre || "Cargando..."
                        : responsable.selectedResponsable && display.displayData.ingeniero_nombre
                          ? display.displayData.ingeniero_nombre
                          : "Seleccionar usuario"
                      }
                    </SelectValue>
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
                <ProductLineItem
                  key={line.id_linea_detalle}
                  line={line}
                  onUpdate={products.updateLine}
                  onRemove={handleRemoveProductLine}
                  onConfirm={products.confirmLine}
                  onUnconfirm={products.unconfirmLine}
                  canConfirm={products.canConfirmLine(line.id_linea_detalle, isClaseRenta)}
                  canRemove={products.productLines.length > 1}
                  quantityError={validation.quantityErrors[line.id_linea_detalle]}
                  formatCOP={formatCOP}
                  digitsOnly={digitsOnly}
                  onQuantityChange={handleQuantityChange}
                  isClaseRenta={isClaseRenta}
                />
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
                  <ServiceLineItem
                    key={line.id_linea_detalle}
                    line={line}
                    operadores={comercialData.operadores}
                    planesFiltrados={memoizedCatalogs.getPlanesByOperador(line.operadorId)}
                    apnsFiltrados={memoizedCatalogs.getApnsByOperador(line.operadorId)}
                    onUpdate={services.updateLine}
                    onRemove={handleRemoveServicioLine}
                    onConfirm={services.confirmLine}
                    onUnconfirm={services.unconfirmLine}
                    canConfirm={services.canConfirmLine(line.id_linea_detalle)}
                    canRemove={services.serviceLines.length > 1}
                    formatCOP={formatCOP}
                    onPermanenciaChange={handlePermanenciaChange}
                  />
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
                // Modo solo lectura - componente memoizado
                <ReadonlyProductosServicios
                  productLines={products.productLines}
                  serviceLines={services.serviceLines}
                  operadores={comercialData.operadores}
                  planes={comercialData.planes}
                  apns={comercialData.apns}
                  formatCOP={formatCOP}
                />
              )}
            </CardContent>
          </Card>

          {/* ==================== INFORMACIÓN DE DESPACHO ==================== */}
          <DespachoSection
            despachoForm={despacho.despachoForm}
            isEditMode={editMode.isEditMode}
            tiposDespacho={comercialData.tiposDespacho}
            transportadoras={comercialData.transportadoras}
            tiposPago={comercialData.tiposPago}
            updateField={despacho.updateField}
            emailError={validation.emailError}
            phoneError={validation.phoneError}
            validateEmail={validation.validateEmail}
            validatePhone={validation.validatePhone}
            setEmailError={validation.setEmailError}
            setPhoneError={validation.setPhoneError}
          />

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

        </CardContent>
      </Card>

      {/* ==================== BARRA DE GUARDADO ==================== */}
      {editMode.isEditMode && (
        <div className="bg-muted/50 border rounded-lg p-4 mt-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Alerta de Data Gate compacta */}
            {!dataGateValidation.canAdvance && dataGateValidation.errors.length > 0 && (
              <DataGateAlert
                errors={dataGateValidation.errors}
                canAdvance={dataGateValidation.canAdvance}
                phaseName="Comercial"
                className="flex-1 min-w-[200px]"
              />
            )}

            {/* Indicador de productos confirmados */}
            {hasConfirmedProducts && (
              <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                <CheckCircle2 className="w-4 h-4" />
                {confirmedProductsCount} equipo(s) confirmado(s)
              </div>
            )}

            {/* Indicador de líneas de servicio confirmadas */}
            {hasConfirmedServices && (
              <div className="text-sm text-blue-600 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                <CheckCircle2 className="w-4 h-4" />
                {confirmedServicesCount} línea(s) de servicio confirmada(s)
              </div>
            )}

            <div className="flex-1" />

            {/* Botón Guardar - Siempre visible y accesible */}
            <ConfirmDialog
              title="Confirmar guardado"
              description="¿Estás seguro de que deseas guardar la información comercial de esta orden? Verifica que todos los datos sean correctos antes de confirmar."
              confirmText="Guardar"
              cancelText="Cancelar"
              onConfirm={executeSave}
              disabled={isSaving || !canSave}
            >
              <Button
                disabled={isSaving || !canSave}
                variant="default"
                size="lg"
                className="min-w-[250px]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Información Comercial"}
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      )}

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
          await executeSave();
          confirmation.setConfirmationType(null);
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
