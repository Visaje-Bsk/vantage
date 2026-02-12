/**
 * DespachoSection
 *
 * Componente memoizado para la sección de información de despacho.
 * Extraído de ComercialTab para evitar re-renders innecesarios
 * cuando cambian datos del formulario principal o las líneas de producto.
 */

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Truck } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import type { DespachoFormData } from "@/hooks/comercial/useDespachoForm";
import type { Database } from "@/integrations/supabase/types";

type TipoDespachoRow = Database["public"]["Tables"]["tipo_despacho"]["Row"];
type TransportadoraRow = Database["public"]["Tables"]["transportadora"]["Row"];
type TipoPagoRow = Database["public"]["Tables"]["tipo_pago"]["Row"];

interface DespachoSectionProps {
  despachoForm: DespachoFormData;
  isEditMode: boolean;
  tiposDespacho: TipoDespachoRow[];
  transportadoras: TransportadoraRow[];
  tiposPago: TipoPagoRow[];
  updateField: (field: keyof DespachoFormData, value: string) => void;
  emailError: string;
  phoneError: string;
  validateEmail: (value: string) => { valid: boolean; error?: string };
  validatePhone: (value: string) => { valid: boolean; error?: string };
  setEmailError: (error: string) => void;
  setPhoneError: (error: string) => void;
}

const PAGO_FLETE_LABELS: Record<string, string> = {
  "no_aplica": "No Aplica",
  "pago_contraentrega": "Pago Contraentrega",
  "paga_bismark_factura_cliente": "Paga Bismark y lo factura al cliente",
  "flete_costo_negocio": "Flete es Costo del Negocio",
};

function DespachoSectionComponent({
  despachoForm,
  isEditMode,
  tiposDespacho,
  transportadoras,
  tiposPago,
  updateField,
  emailError,
  phoneError,
  validateEmail,
  validatePhone,
  setEmailError,
  setPhoneError,
}: DespachoSectionProps) {
  if (!despachoForm.id_tipo_despacho) return null;

  const tipoSeleccionado = tiposDespacho.find(t => t.id_tipo_despacho.toString() === despachoForm.id_tipo_despacho);
  const requiereDireccion = tipoSeleccionado?.requiere_direccion ?? false;
  const requiereTransportadora = tipoSeleccionado?.requiere_transportadora ?? false;

  // Opciones memoizadas para SearchableSelect
  const tipoDespachoOptions = useMemo(() =>
    tiposDespacho.map(t => ({ value: t.id_tipo_despacho.toString(), label: t.nombre_tipo })),
    [tiposDespacho]
  );
  const transportadoraOptions = useMemo(() =>
    transportadoras.map(t => ({ value: t.id_transportadora.toString(), label: t.nombre_transportadora })),
    [transportadoras]
  );
  const tipoPagoOptions = useMemo(() =>
    tiposPago.map(t => ({
      value: t.id_tipo_pago.toString(),
      label: `${t.forma_pago}${t.plazo ? ` (${t.plazo})` : ""}`,
    })),
    [tiposPago]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Información de Despacho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditMode ? (
          <div className="space-y-4">
            {/* Tipo de Despacho */}
            <div className="space-y-2">
              <Label>Tipo de Despacho</Label>
              <SearchableSelect
                options={tipoDespachoOptions}
                value={despachoForm.id_tipo_despacho}
                onValueChange={(value) => updateField("id_tipo_despacho", value)}
                placeholder="Seleccionar tipo"
                searchPlaceholder="Buscar tipo de despacho..."
                emptyMessage="No se encontraron tipos"
              />
            </div>

            {/* Campos de Dirección */}
            {requiereDireccion && (
              <>
                <div className="space-y-2">
                  <Label>Dirección de Envío</Label>
                  <Textarea
                    value={despachoForm.direccion}
                    onChange={(e) => updateField("direccion", e.target.value)}
                    placeholder="Dirección completa de entrega"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={despachoForm.ciudad}
                    onChange={(e) => updateField("ciudad", e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Contacto de Entrega</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del Contacto</Label>
                      <Input
                        value={despachoForm.nombre_contacto}
                        onChange={(e) => updateField("nombre_contacto", e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <PhoneInput
                          value={despachoForm.telefono_contacto}
                          onChange={(value) => {
                            updateField("telefono_contacto", value);
                            if (value) {
                              const phoneValidation = validatePhone(value);
                              setPhoneError(phoneValidation.error || "");
                            } else {
                              setPhoneError("");
                            }
                          }}
                          onBlur={() => {
                            const phoneValidation = validatePhone(despachoForm.telefono_contacto);
                            setPhoneError(phoneValidation.error || "");
                          }}
                          placeholder="320 242 2311"
                          error={phoneError}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Principal</Label>
                        <Input
                          type="email"
                          value={despachoForm.email_contacto}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateField("email_contacto", value);
                            if (value) {
                              const emailValidation = validateEmail(value);
                              setEmailError(emailValidation.error || "");
                            } else {
                              setEmailError("");
                            }
                          }}
                          onBlur={(e) => {
                            const emailValidation = validateEmail(e.target.value);
                            setEmailError(emailValidation.error || "");
                          }}
                          placeholder="usuario@ejemplo.com"
                          className={emailError ? "border-red-300" : ""}
                        />
                        {emailError && (
                          <p className="text-xs text-red-500">{emailError}</p>
                        )}
                      </div>
                    </div>
                    {/* Emails adicionales */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Secundario (opcional)</Label>
                        <Input
                          type="email"
                          value={despachoForm.email_contacto2}
                          onChange={(e) => updateField("email_contacto2", e.target.value)}
                          placeholder="usuario2@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Terciario (opcional)</Label>
                        <Input
                          type="email"
                          value={despachoForm.email_contacto3}
                          onChange={(e) => updateField("email_contacto3", e.target.value)}
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
                <SearchableSelect
                  options={transportadoraOptions}
                  value={despachoForm.id_transportadora}
                  onValueChange={(value) => updateField("id_transportadora", value)}
                  placeholder="Seleccionar transportadora"
                  searchPlaceholder="Buscar transportadora..."
                  emptyMessage="No se encontraron transportadoras"
                />
              </div>
            )}

            {/* Información de Pago */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Información de Pago</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Pago</Label>
                  <SearchableSelect
                    options={tipoPagoOptions}
                    value={despachoForm.id_tipo_pago}
                    onValueChange={(value) => updateField("id_tipo_pago", value)}
                    placeholder="Seleccionar tipo de pago"
                    searchPlaceholder="Buscar tipo de pago..."
                    emptyMessage="No se encontraron tipos de pago"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pago del Flete</Label>
                  <Select
                    value={despachoForm.pago_flete}
                    onValueChange={(value) => updateField("pago_flete", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_aplica">No Aplica</SelectItem>
                      <SelectItem value="pago_contraentrega">Pago Contraentrega</SelectItem>
                      <SelectItem value="paga_bismark_factura_cliente">Paga Bismark y lo factura al cliente</SelectItem>
                      <SelectItem value="flete_costo_negocio">Flete es Costo del Negocio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label>Observaciones de Despacho</Label>
              <Textarea
                placeholder="Observaciones especiales para el despacho..."
                value={despachoForm.observaciones}
                onChange={(e) => updateField("observaciones", e.target.value)}
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
                      {despachoForm.direccion || "Sin definir"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Ciudad</Label>
                    <div className="p-2 bg-muted/30 rounded text-sm">
                      {despachoForm.ciudad || "Sin definir"}
                    </div>
                  </div>
                  {(despachoForm.nombre_contacto || despachoForm.telefono_contacto || despachoForm.email_contacto) && (
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-sm font-semibold">Contacto de Entrega</h4>
                      {despachoForm.nombre_contacto && (
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Nombre</Label>
                          <div className="p-2 bg-muted/30 rounded text-sm">
                            {despachoForm.nombre_contacto}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {despachoForm.telefono_contacto && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Teléfono</Label>
                            <div className="p-2 bg-muted/30 rounded text-sm">
                              {despachoForm.telefono_contacto}
                            </div>
                          </div>
                        )}
                        {despachoForm.email_contacto && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Email Principal</Label>
                            <div className="p-2 bg-muted/30 rounded text-sm">
                              {despachoForm.email_contacto}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Emails adicionales en readonly */}
                      {(despachoForm.email_contacto2 || despachoForm.email_contacto3) && (
                        <div className="grid grid-cols-2 gap-4">
                          {despachoForm.email_contacto2 && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">Email Secundario</Label>
                              <div className="p-2 bg-muted/30 rounded text-sm">
                                {despachoForm.email_contacto2}
                              </div>
                            </div>
                          )}
                          {despachoForm.email_contacto3 && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">Email Terciario</Label>
                              <div className="p-2 bg-muted/30 rounded text-sm">
                                {despachoForm.email_contacto3}
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
                    {transportadoras.find(t => t.id_transportadora.toString() === despachoForm.id_transportadora)?.nombre_transportadora || "Sin definir"}
                  </div>
                </div>
              )}

              {/* Información de Pago - Readonly */}
              {(despachoForm.id_tipo_pago || despachoForm.pago_flete) && (
                <div className="border-t pt-3 space-y-2">
                  <h4 className="text-sm font-semibold">Información de Pago</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {despachoForm.id_tipo_pago && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Tipo de Pago</Label>
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          {(() => {
                            const tipoPago = tiposPago.find(t => t.id_tipo_pago.toString() === despachoForm.id_tipo_pago);
                            return tipoPago ? `${tipoPago.forma_pago}${tipoPago.plazo ? ` (${tipoPago.plazo})` : ""}` : "Sin definir";
                          })()}
                        </div>
                      </div>
                    )}
                    {despachoForm.pago_flete && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Pago del Flete</Label>
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          {PAGO_FLETE_LABELS[despachoForm.pago_flete] || despachoForm.pago_flete}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {despachoForm.observaciones && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Observaciones</Label>
                  <div className="p-2 bg-muted/30 rounded text-sm">
                    {despachoForm.observaciones}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const DespachoSection = memo(DespachoSectionComponent);
