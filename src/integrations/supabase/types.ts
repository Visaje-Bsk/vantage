export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accesorio: {
        Row: {
          codigo_accesorio: string | null
          id_accesorio: number
          nombre_accesorio: string | null
        }
        Insert: {
          codigo_accesorio?: string | null
          id_accesorio?: number
          nombre_accesorio?: string | null
        }
        Update: {
          codigo_accesorio?: string | null
          id_accesorio?: number
          nombre_accesorio?: string | null
        }
        Relationships: []
      }
      apn: {
        Row: {
          apn: string
          id_apn: number
          id_operador: number
        }
        Insert: {
          apn: string
          id_apn?: number
          id_operador: number
        }
        Update: {
          apn?: string
          id_apn?: number
          id_operador?: number
        }
        Relationships: [
          {
            foreignKeyName: "apn_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "operador"
            referencedColumns: ["id_operador"]
          },
        ]
      }
      clase_orden: {
        Row: {
          id_clase_orden: number
          tipo_orden: string
        }
        Insert: {
          id_clase_orden?: number
          tipo_orden: string
        }
        Update: {
          id_clase_orden?: number
          tipo_orden?: string
        }
        Relationships: []
      }
      cliente: {
        Row: {
          id_cliente: number
          nit: string
          nombre_cliente: string
        }
        Insert: {
          id_cliente?: number
          nit: string
          nombre_cliente: string
        }
        Update: {
          id_cliente?: number
          nit?: string
          nombre_cliente?: string
        }
        Relationships: []
      }
      contacto_despacho: {
        Row: {
          email: string | null
          es_principal: boolean | null
          id_contacto: number
          id_direccion: number | null
          nombre_contacto: string
          telefono: string | null
        }
        Insert: {
          email?: string | null
          es_principal?: boolean | null
          id_contacto?: number
          id_direccion?: number | null
          nombre_contacto: string
          telefono?: string | null
        }
        Update: {
          email?: string | null
          es_principal?: boolean | null
          id_contacto?: number
          id_direccion?: number | null
          nombre_contacto?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacto_despacho_id_direccion_fkey"
            columns: ["id_direccion"]
            isOneToOne: false
            referencedRelation: "direccion_despacho"
            referencedColumns: ["id_direccion"]
          },
        ]
      }
      despacho_orden: {
        Row: {
          fecha_despacho: string | null
          id_contacto: number | null
          id_despacho_orden: number
          id_direccion: number | null
          id_orden_pedido: number
          id_tipo_despacho: number
          id_transportadora: number | null
          numero_guia: string | null
          observaciones: string | null
          valor_servicio_flete: number | null
        }
        Insert: {
          fecha_despacho?: string | null
          id_contacto?: number | null
          id_despacho_orden?: number
          id_direccion?: number | null
          id_orden_pedido: number
          id_tipo_despacho: number
          id_transportadora?: number | null
          numero_guia?: string | null
          observaciones?: string | null
          valor_servicio_flete?: number | null
        }
        Update: {
          fecha_despacho?: string | null
          id_contacto?: number | null
          id_despacho_orden?: number
          id_direccion?: number | null
          id_orden_pedido?: number
          id_tipo_despacho?: number
          id_transportadora?: number | null
          numero_guia?: string | null
          observaciones?: string | null
          valor_servicio_flete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despacho_orden_id_contacto_fkey"
            columns: ["id_contacto"]
            isOneToOne: false
            referencedRelation: "contacto_despacho"
            referencedColumns: ["id_contacto"]
          },
          {
            foreignKeyName: "despacho_orden_id_direccion_fkey"
            columns: ["id_direccion"]
            isOneToOne: false
            referencedRelation: "direccion_despacho"
            referencedColumns: ["id_direccion"]
          },
          {
            foreignKeyName: "despacho_orden_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: true
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "despacho_orden_id_tipo_despacho_fkey"
            columns: ["id_tipo_despacho"]
            isOneToOne: false
            referencedRelation: "tipo_despacho"
            referencedColumns: ["id_tipo_despacho"]
          },
          {
            foreignKeyName: "despacho_orden_id_transportadora_fkey"
            columns: ["id_transportadora"]
            isOneToOne: false
            referencedRelation: "transportadora"
            referencedColumns: ["id_transportadora"]
          },
        ]
      }
      detalle_orden: {
        Row: {
          cantidad: number | null
          id_accesorio: number | null
          id_equipo: number | null
          id_linea_detalle: number | null
          id_orden_detalle: number
          id_orden_pedido: number | null
          id_servicio: number | null
          plantilla: string | null
          tipo_producto:
            | Database["public"]["Enums"]["tipo_producto_enum"]
            | null
          valor_unitario: number | null
        }
        Insert: {
          cantidad?: number | null
          id_accesorio?: number | null
          id_equipo?: number | null
          id_linea_detalle?: number | null
          id_orden_detalle?: number
          id_orden_pedido?: number | null
          id_servicio?: number | null
          plantilla?: string | null
          tipo_producto?:
            | Database["public"]["Enums"]["tipo_producto_enum"]
            | null
          valor_unitario?: number | null
        }
        Update: {
          cantidad?: number | null
          id_accesorio?: number | null
          id_equipo?: number | null
          id_linea_detalle?: number | null
          id_orden_detalle?: number
          id_orden_pedido?: number | null
          id_servicio?: number | null
          plantilla?: string | null
          tipo_producto?:
            | Database["public"]["Enums"]["tipo_producto_enum"]
            | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_orden_id_accesorio_fkey"
            columns: ["id_accesorio"]
            isOneToOne: false
            referencedRelation: "accesorio"
            referencedColumns: ["id_accesorio"]
          },
          {
            foreignKeyName: "detalle_orden_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id_equipo"]
          },
          {
            foreignKeyName: "detalle_orden_id_linea_detalle_fkey"
            columns: ["id_linea_detalle"]
            isOneToOne: false
            referencedRelation: "linea_servicio"
            referencedColumns: ["id_linea_detalle"]
          },
          {
            foreignKeyName: "detalle_orden_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "detalle_orden_id_servicio_fkey"
            columns: ["id_servicio"]
            isOneToOne: false
            referencedRelation: "servicio"
            referencedColumns: ["id_servicio"]
          },
        ]
      }
      direccion_despacho: {
        Row: {
          activa: boolean | null
          ciudad: string | null
          direccion: string
          id_cliente: number
          id_direccion: number
          latitud: number | null
          longitud: number | null
          nombre_direccion: string | null
        }
        Insert: {
          activa?: boolean | null
          ciudad?: string | null
          direccion: string
          id_cliente: number
          id_direccion?: number
          latitud?: number | null
          longitud?: number | null
          nombre_direccion?: string | null
        }
        Update: {
          activa?: boolean | null
          ciudad?: string | null
          direccion?: string
          id_cliente?: number
          id_direccion?: number
          latitud?: number | null
          longitud?: number | null
          nombre_direccion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direccion_despacho_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      equipo: {
        Row: {
          codigo: string
          id_equipo: number
          nombre_equipo: string | null
        }
        Insert: {
          codigo: string
          id_equipo?: number
          nombre_equipo?: string | null
        }
        Update: {
          codigo?: string
          id_equipo?: number
          nombre_equipo?: string | null
        }
        Relationships: []
      }
      factura: {
        Row: {
          estado_factura: string | null
          fecha_factura: string | null
          fecha_trm: string | null
          id_factura: number
          id_orden_pedido: number
          id_tipo_pago: number | null
          moneda_base: string | null
          numero_factura: string | null
          trm_aplicada: number | null
        }
        Insert: {
          estado_factura?: string | null
          fecha_factura?: string | null
          fecha_trm?: string | null
          id_factura?: number
          id_orden_pedido: number
          id_tipo_pago?: number | null
          moneda_base?: string | null
          numero_factura?: string | null
          trm_aplicada?: number | null
        }
        Update: {
          estado_factura?: string | null
          fecha_factura?: string | null
          fecha_trm?: string | null
          id_factura?: number
          id_orden_pedido?: number
          id_tipo_pago?: number | null
          moneda_base?: string | null
          numero_factura?: string | null
          trm_aplicada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factura_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "factura_id_tipo_pago_fkey"
            columns: ["id_tipo_pago"]
            isOneToOne: false
            referencedRelation: "tipo_pago"
            referencedColumns: ["id_tipo_pago"]
          },
        ]
      }
      historial_orden: {
        Row: {
          accion_clave: string
          actor_user_id: string
          estatus_nuevo:
            | Database["public"]["Enums"]["estatus_orden_enum"]
            | null
          fase_anterior: Database["public"]["Enums"]["fase_orden_enum"] | null
          fase_nueva: Database["public"]["Enums"]["fase_orden_enum"]
          id_historial: number
          id_orden_pedido: number
          observaciones: string | null
          rol_actor: Database["public"]["Enums"]["app_role"]
          timestamp_accion: string
        }
        Insert: {
          accion_clave: string
          actor_user_id: string
          estatus_nuevo?:
            | Database["public"]["Enums"]["estatus_orden_enum"]
            | null
          fase_anterior?: Database["public"]["Enums"]["fase_orden_enum"] | null
          fase_nueva: Database["public"]["Enums"]["fase_orden_enum"]
          id_historial?: never
          id_orden_pedido: number
          observaciones?: string | null
          rol_actor: Database["public"]["Enums"]["app_role"]
          timestamp_accion?: string
        }
        Update: {
          accion_clave?: string
          actor_user_id?: string
          estatus_nuevo?:
            | Database["public"]["Enums"]["estatus_orden_enum"]
            | null
          fase_anterior?: Database["public"]["Enums"]["fase_orden_enum"] | null
          fase_nueva?: Database["public"]["Enums"]["fase_orden_enum"]
          id_historial?: never
          id_orden_pedido?: number
          observaciones?: string | null
          rol_actor?: Database["public"]["Enums"]["app_role"]
          timestamp_accion?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_orden_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
        ]
      }
      linea_servicio: {
        Row: {
          clase_cobro: Database["public"]["Enums"]["clase_cobro"] | null
          id_apn: number
          id_linea_detalle: number
          id_operador: number
          id_plan: number
          permanencia: string | null
        }
        Insert: {
          clase_cobro?: Database["public"]["Enums"]["clase_cobro"] | null
          id_apn: number
          id_linea_detalle?: number
          id_operador: number
          id_plan: number
          permanencia?: string | null
        }
        Update: {
          clase_cobro?: Database["public"]["Enums"]["clase_cobro"] | null
          id_apn?: number
          id_linea_detalle?: number
          id_operador?: number
          id_plan?: number
          permanencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineaservicio_id_apn_fkey"
            columns: ["id_apn"]
            isOneToOne: false
            referencedRelation: "apn"
            referencedColumns: ["id_apn"]
          },
          {
            foreignKeyName: "lineaservicio_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "operador"
            referencedColumns: ["id_operador"]
          },
          {
            foreignKeyName: "lineaservicio_id_plan_fkey"
            columns: ["id_plan"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id_plan"]
          },
        ]
      }
      operador: {
        Row: {
          id_operador: number
          nombre_operador: string
        }
        Insert: {
          id_operador?: number
          nombre_operador: string
        }
        Update: {
          id_operador?: number
          nombre_operador?: string
        }
        Relationships: []
      }
      orden_counter_month: {
        Row: {
          last_num: number
          mm: number
          yy: number
        }
        Insert: {
          last_num?: number
          mm: number
          yy: number
        }
        Update: {
          last_num?: number
          mm?: number
          yy?: number
        }
        Relationships: []
      }
      orden_pedido: {
        Row: {
          consecutivo: number
          consecutivo_code: string | null
          created_by: string
          estatus: Database["public"]["Enums"]["estatus_orden_enum"]
          fase: Database["public"]["Enums"]["fase_orden_enum"]
          fecha_creacion: string
          fecha_modificacion: string | null
          id_clase_orden: number | null
          id_cliente: number
          id_ingeniero_asignado: string | null
          id_orden_pedido: number
          id_proyecto: number | null
          id_tipo_pago: number | null
          id_tipo_servicio: number | null
          observaciones_orden: string | null
          orden_compra: string | null
          updated_by: string | null
        }
        Insert: {
          consecutivo?: number
          consecutivo_code?: string | null
          created_by?: string
          estatus?: Database["public"]["Enums"]["estatus_orden_enum"]
          fase?: Database["public"]["Enums"]["fase_orden_enum"]
          fecha_creacion?: string
          fecha_modificacion?: string | null
          id_clase_orden?: number | null
          id_cliente: number
          id_ingeniero_asignado?: string | null
          id_orden_pedido?: number
          id_proyecto?: number | null
          id_tipo_pago?: number | null
          id_tipo_servicio?: number | null
          observaciones_orden?: string | null
          orden_compra?: string | null
          updated_by?: string | null
        }
        Update: {
          consecutivo?: number
          consecutivo_code?: string | null
          created_by?: string
          estatus?: Database["public"]["Enums"]["estatus_orden_enum"]
          fase?: Database["public"]["Enums"]["fase_orden_enum"]
          fecha_creacion?: string
          fecha_modificacion?: string | null
          id_clase_orden?: number | null
          id_cliente?: number
          id_ingeniero_asignado?: string | null
          id_orden_pedido?: number
          id_proyecto?: number | null
          id_tipo_pago?: number | null
          id_tipo_servicio?: number | null
          observaciones_orden?: string | null
          orden_compra?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orden_pedido_id_ingeniero_asignado_fkey"
            columns: ["id_ingeniero_asignado"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ordenpedido_id_clase_orden_fkey"
            columns: ["id_clase_orden"]
            isOneToOne: false
            referencedRelation: "clase_orden"
            referencedColumns: ["id_clase_orden"]
          },
          {
            foreignKeyName: "ordenpedido_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "ordenpedido_id_proyecto_fkey"
            columns: ["id_proyecto"]
            isOneToOne: false
            referencedRelation: "proyecto"
            referencedColumns: ["id_proyecto"]
          },
          {
            foreignKeyName: "ordenpedido_id_tipo_pago_fkey"
            columns: ["id_tipo_pago"]
            isOneToOne: false
            referencedRelation: "tipo_pago"
            referencedColumns: ["id_tipo_pago"]
          },
          {
            foreignKeyName: "ordenpedido_id_tipo_servicio_fkey"
            columns: ["id_tipo_servicio"]
            isOneToOne: false
            referencedRelation: "tipo_servicio"
            referencedColumns: ["id_tipo_servicio"]
          },
        ]
      }
      orden_produccion: {
        Row: {
          estado_orden_produccion: string | null
          fecha_produccion: string | null
          id_orden_pedido: number
          id_orden_produccion: number
          numero_produccion: string | null
          observaciones_produccion: string | null
        }
        Insert: {
          estado_orden_produccion?: string | null
          fecha_produccion?: string | null
          id_orden_pedido: number
          id_orden_produccion?: number
          numero_produccion?: string | null
          observaciones_produccion?: string | null
        }
        Update: {
          estado_orden_produccion?: string | null
          fecha_produccion?: string | null
          id_orden_pedido?: number
          id_orden_produccion?: number
          numero_produccion?: string | null
          observaciones_produccion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenproduccion_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
        ]
      }
      permission: {
        Row: {
          category: string
          created_at: string | null
          description: string
          perm_code: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          perm_code: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          perm_code?: string
        }
        Relationships: []
      }
      plan: {
        Row: {
          id_operador: number
          id_plan: number
          nombre_plan: string
        }
        Insert: {
          id_operador: number
          id_plan?: number
          nombre_plan: string
        }
        Update: {
          id_operador?: number
          id_plan?: number
          nombre_plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "operador"
            referencedColumns: ["id_operador"]
          },
        ]
      }
      producto: {
        Row: {
          created_by: string
          id_accesorio: number | null
          id_equipo: number | null
          id_linea_detalle: number | null
          id_producto: number
          id_servicio: number | null
          nombre_producto: string | null
          tipo: Database["public"]["Enums"]["tipo_producto_enum"]
        }
        Insert: {
          created_by?: string
          id_accesorio?: number | null
          id_equipo?: number | null
          id_linea_detalle?: number | null
          id_producto?: number
          id_servicio?: number | null
          nombre_producto?: string | null
          tipo: Database["public"]["Enums"]["tipo_producto_enum"]
        }
        Update: {
          created_by?: string
          id_accesorio?: number | null
          id_equipo?: number | null
          id_linea_detalle?: number | null
          id_producto?: number
          id_servicio?: number | null
          nombre_producto?: string | null
          tipo?: Database["public"]["Enums"]["tipo_producto_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "producto_id_accesorio_fkey"
            columns: ["id_accesorio"]
            isOneToOne: false
            referencedRelation: "accesorio"
            referencedColumns: ["id_accesorio"]
          },
          {
            foreignKeyName: "producto_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id_equipo"]
          },
          {
            foreignKeyName: "producto_id_linea_detalle_fkey"
            columns: ["id_linea_detalle"]
            isOneToOne: false
            referencedRelation: "linea_servicio"
            referencedColumns: ["id_linea_detalle"]
          },
          {
            foreignKeyName: "producto_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: true
            referencedRelation: "equipo"
            referencedColumns: ["id_equipo"]
          },
          {
            foreignKeyName: "producto_id_servicio_fkey"
            columns: ["id_servicio"]
            isOneToOne: false
            referencedRelation: "servicio"
            referencedColumns: ["id_servicio"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          nombre: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          nombre?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          nombre?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      proyecto: {
        Row: {
          descripcion_proyecto: string | null
          id_cliente: number
          id_proyecto: number
          nit_cliente: string
          nombre_proyecto: string
        }
        Insert: {
          descripcion_proyecto?: string | null
          id_cliente: number
          id_proyecto?: number
          nit_cliente: string
          nombre_proyecto: string
        }
        Update: {
          descripcion_proyecto?: string | null
          id_cliente?: number
          id_proyecto?: number
          nit_cliente?: string
          nombre_proyecto?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "proyecto_nit_cliente_fkey"
            columns: ["nit_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["nit"]
          },
        ]
      }
      rbac_event: {
        Row: {
          actor: string | null
          allowed_after: boolean
          allowed_before: boolean | null
          created_at: string | null
          id: string
          perm_code: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          actor?: string | null
          allowed_after: boolean
          allowed_before?: boolean | null
          created_at?: string | null
          id?: string
          perm_code: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          actor?: string | null
          allowed_after?: boolean
          allowed_before?: boolean | null
          created_at?: string | null
          id?: string
          perm_code?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      remision: {
        Row: {
          estado_remision: string | null
          fecha_remision: string | null
          id_orden_pedido: number
          id_remision: number
          numero_remision: string | null
        }
        Insert: {
          estado_remision?: string | null
          fecha_remision?: string | null
          id_orden_pedido: number
          id_remision?: number
          numero_remision?: string | null
        }
        Update: {
          estado_remision?: string | null
          fecha_remision?: string | null
          id_orden_pedido?: number
          id_remision?: number
          numero_remision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remision_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
        ]
      }
      responsable_orden: {
        Row: {
          id_orden_pedido: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id_orden_pedido: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id_orden_pedido?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsableorden_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "orden_pedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "responsableorden_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rol: {
        Row: {
          id_rol: number
          tipo_rol: string
        }
        Insert: {
          id_rol?: number
          tipo_rol: string
        }
        Update: {
          id_rol?: number
          tipo_rol?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          perm_code: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          allowed?: boolean
          perm_code: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          allowed?: boolean
          perm_code?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_perm_code_fkey"
            columns: ["perm_code"]
            isOneToOne: false
            referencedRelation: "permission"
            referencedColumns: ["perm_code"]
          },
        ]
      }
      servicio: {
        Row: {
          codigo_servicio: string | null
          id_servicio: number
          nombre_servicio: string | null
          ticon: number | null
        }
        Insert: {
          codigo_servicio?: string | null
          id_servicio?: number
          nombre_servicio?: string | null
          ticon?: number | null
        }
        Update: {
          codigo_servicio?: string | null
          id_servicio?: number
          nombre_servicio?: string | null
          ticon?: number | null
        }
        Relationships: []
      }
      tipo_despacho: {
        Row: {
          id_tipo_despacho: number
          nombre_tipo: string
          requiere_direccion: boolean | null
          requiere_transportadora: boolean | null
        }
        Insert: {
          id_tipo_despacho?: number
          nombre_tipo: string
          requiere_direccion?: boolean | null
          requiere_transportadora?: boolean | null
        }
        Update: {
          id_tipo_despacho?: number
          nombre_tipo?: string
          requiere_direccion?: boolean | null
          requiere_transportadora?: boolean | null
        }
        Relationships: []
      }
      tipo_pago: {
        Row: {
          aprobado_cartera: boolean | null
          forma_pago: string
          id_tipo_pago: number
          plazo: string | null
        }
        Insert: {
          aprobado_cartera?: boolean | null
          forma_pago: string
          id_tipo_pago?: number
          plazo?: string | null
        }
        Update: {
          aprobado_cartera?: boolean | null
          forma_pago?: string
          id_tipo_pago?: number
          plazo?: string | null
        }
        Relationships: []
      }
      tipo_servicio: {
        Row: {
          id_tipo_servicio: number
          nombre_tipo_servicio: string | null
        }
        Insert: {
          id_tipo_servicio?: number
          nombre_tipo_servicio?: string | null
        }
        Update: {
          id_tipo_servicio?: number
          nombre_tipo_servicio?: string | null
        }
        Relationships: []
      }
      transportadora: {
        Row: {
          fecha_transportadora: string | null
          id_transportadora: number
          nombre_transportadora: string | null
          observaciones_envio: string | null
        }
        Insert: {
          fecha_transportadora?: string | null
          id_transportadora?: number
          nombre_transportadora?: string | null
          observaciones_envio?: string | null
        }
        Update: {
          fecha_transportadora?: string | null
          id_transportadora?: number
          nombre_transportadora?: string | null
          observaciones_envio?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_uid: { Args: never; Returns: string }
      can_change_estatus: {
        Args: {
          new_estatus: Database["public"]["Enums"]["estatus_orden_enum"]
          op_id: number
        }
        Returns: boolean
      }
      can_move_fase: {
        Args: {
          op_id: number
          to_fase: Database["public"]["Enums"]["fase_orden_enum"]
        }
        Returns: boolean
      }
      can_update_orden: { Args: { op_id: number }; Returns: boolean }
      has_permission: { Args: { perm_code: string }; Returns: boolean }
      has_role: {
        Args: { r: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      next_monthly_num: { Args: { _ts?: string }; Returns: number }
      upsert_comercial_tab: {
        Args: {
          p_deleted_equipos: number[]
          p_deleted_servicios: number[]
          p_despacho_data: Json
          p_equipos: Json
          p_orden_data: Json
          p_orden_id: number
          p_responsable_role: string
          p_responsable_user_id: string
          p_servicios: Json
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "comercial"
        | "inventarios"
        | "produccion"
        | "logistica"
        | "facturacion"
        | "financiera"
        | "ingenieria"
      clase_cobro: "mensual" | "anual"
      estado_orden_enum:
        | "borrador"
        | "validacion_comercial"
        | "inventarios_pendiente"
        | "produccion_pendiente"
        | "logistica_pendiente"
        | "enviada"
        | "facturacion_pendiente"
        | "facturada"
        | "financiera_pendiente"
        | "cerrada"
        | "anulada"
      estatus_orden_enum:
        | "borrador"
        | "abierta"
        | "enviada"
        | "facturada"
        | "cerrada"
        | "anulada"
      fase_orden_enum:
        | "comercial"
        | "inventarios"
        | "produccion"
        | "logistica"
        | "facturacion"
        | "financiera"
      tipo_producto_enum: "equipo" | "linea_servicio"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "admin",
        "comercial",
        "inventarios",
        "produccion",
        "logistica",
        "facturacion",
        "financiera",
        "ingenieria",
      ],
      clase_cobro: ["mensual", "anual"],
      estado_orden_enum: [
        "borrador",
        "validacion_comercial",
        "inventarios_pendiente",
        "produccion_pendiente",
        "logistica_pendiente",
        "enviada",
        "facturacion_pendiente",
        "facturada",
        "financiera_pendiente",
        "cerrada",
        "anulada",
      ],
      estatus_orden_enum: [
        "borrador",
        "abierta",
        "enviada",
        "facturada",
        "cerrada",
        "anulada",
      ],
      fase_orden_enum: [
        "comercial",
        "inventarios",
        "produccion",
        "logistica",
        "facturacion",
        "financiera",
      ],
      tipo_producto_enum: ["equipo", "linea_servicio"],
    },
  },
} as const
