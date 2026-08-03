import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import {
  useConfiguracionEmpresa,
  useCreateServicioTaller,
  useServiciosTaller,
  useUpdateConfiguracionEmpresa,
  useUpdateEmpresaActiva,
  useUpdateServicioTaller,
} from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { ConfiguracionEmpresaWrite, EmpresaWrite, ServicioTaller, ServicioTallerWrite } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/configuracion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Configuracion | MotoManager" },
      { name: "description", content: "Prefijos de documentos, IVA por defecto y datos de soporte del taller." },
      { property: "og:title", content: "Configuracion | MotoManager" },
      { property: "og:description", content: "Prefijos de documentos, IVA por defecto y datos de soporte del taller." },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { user } = useAuth();
  const query = useConfiguracionEmpresa();
  const servicios = useServiciosTaller();
  const createServicio = useCreateServicioTaller();
  const updateServicio = useUpdateServicioTaller();
  const update = useUpdateConfiguracionEmpresa();
  const updateEmpresa = useUpdateEmpresaActiva();
  const [form, setForm] = useState<ConfiguracionEmpresaWrite>({});
  const [empresaForm, setEmpresaForm] = useState<EmpresaWrite>({});
  const [servicioEditando, setServicioEditando] = useState<ServicioTaller | null>(null);
  const [servicioForm, setServicioForm] = useState<ServicioTallerWrite>({
    nombre: "",
    descripcion: "",
    duracion_minutos: 60,
    precio_base: 0,
    is_active: true,
  });

  useEffect(() => {
    if (user?.empresa) {
      setEmpresaForm({
        nombre: user.empresa.nombre ?? "",
        nit: user.empresa.nit ?? "",
        ciudad: user.empresa.ciudad ?? "",
        telefono: user.empresa.telefono ?? "",
        correo: user.empresa.correo ?? "",
        logo_url: user.empresa.logo_url ?? "",
        moneda: user.empresa.moneda ?? "COP",
        timezone: user.empresa.timezone ?? "America/Bogota",
      });
    }
  }, [user?.empresa]);

  useEffect(() => {
    if (query.data) {
      setForm({
        impuesto_iva_default: query.data.impuesto_iva_default ?? 0,
        prefijo_recepcion: query.data.prefijo_recepcion ?? "",
        prefijo_cotizacion: query.data.prefijo_cotizacion ?? "",
        prefijo_orden: query.data.prefijo_orden ?? "",
        prefijo_factura: query.data.prefijo_factura ?? "",
        soporte_texto: query.data.soporte_texto ?? "",
      });
    }
  }, [query.data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync(form);
      toast.success("Configuracion actualizada");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo guardar");
    }
  }

  async function submitEmpresa(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateEmpresa.mutateAsync(empresaForm);
      toast.success("Datos de empresa actualizados");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo guardar la empresa");
    }
  }

  function resetServicioForm() {
    setServicioEditando(null);
    setServicioForm({
      nombre: "",
      descripcion: "",
      duracion_minutos: 60,
      precio_base: 0,
      is_active: true,
    });
  }

  function editarServicio(servicio: ServicioTaller) {
    setServicioEditando(servicio);
    setServicioForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? "",
      duracion_minutos: servicio.duracion_minutos ?? 60,
      precio_base: servicio.precio_base ?? 0,
      is_active: servicio.is_active !== false,
    });
  }

  async function submitServicio(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = {
        ...servicioForm,
        precio_base: servicioForm.precio_base === "" ? null : Number(servicioForm.precio_base ?? 0),
        duracion_minutos: Number(servicioForm.duracion_minutos || 60),
      };
      if (servicioEditando) {
        await updateServicio.mutateAsync({ id: servicioEditando.id, body });
        toast.success("Servicio actualizado");
      } else {
        await createServicio.mutateAsync(body);
        toast.success("Servicio creado");
      }
      resetServicioForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo guardar el servicio");
    }
  }

  return (
    <div>
      <PageHeader title="Configuracion" subtitle="Parametros de facturacion, prefijos de documentos y soporte." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Configuracion de empresa</CardTitle>
            <CardDescription>GET / PATCH /configuracion/empresa/</CardDescription>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <TableSkeleton rows={4} />
            ) : query.isError ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="iva">IVA por defecto (%)</Label>
                  <Input
                    id="iva"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.impuesto_iva_default ?? 0}
                    onChange={(e) => setForm({ ...form, impuesto_iva_default: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-rec">Prefijo recepcion</Label>
                  <Input
                    id="p-rec"
                    value={form.prefijo_recepcion ?? ""}
                    onChange={(e) => setForm({ ...form, prefijo_recepcion: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-cot">Prefijo cotizacion</Label>
                  <Input
                    id="p-cot"
                    value={form.prefijo_cotizacion ?? ""}
                    onChange={(e) => setForm({ ...form, prefijo_cotizacion: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-ord">Prefijo orden</Label>
                  <Input
                    id="p-ord"
                    value={form.prefijo_orden ?? ""}
                    onChange={(e) => setForm({ ...form, prefijo_orden: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-fac">Prefijo factura</Label>
                  <Input
                    id="p-fac"
                    value={form.prefijo_factura ?? ""}
                    onChange={(e) => setForm({ ...form, prefijo_factura: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="soporte">Texto de soporte</Label>
                  <Textarea
                    id="soporte"
                    rows={3}
                    value={form.soporte_texto ?? ""}
                    onChange={(e) => setForm({ ...form, soporte_texto: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={update.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {update.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Entorno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Empresa</span>
              <span className="font-medium">{user?.empresa?.nombre ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Moneda</span>
              <span className="font-medium">{user?.empresa?.moneda ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zona horaria</span>
              <span className="font-medium">{user?.empresa?.timezone ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">SMTP</span>
              <Badge variant={query.data?.smtp_configurado ? "secondary" : "destructive"}>
                {query.data?.smtp_configurado ? "Configurado" : "Sin configurar"}
              </Badge>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">API base</p>
              <p className="break-all font-mono text-xs">{getApiBase()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Datos y logotipo del negocio</CardTitle>
          <CardDescription>Estos datos se usan en cotizaciones, facturas y correos enviados al cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitEmpresa} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="empresa-nombre">Nombre del negocio</Label>
              <Input
                id="empresa-nombre"
                value={empresaForm.nombre ?? ""}
                onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa-nit">NIT / Documento</Label>
              <Input
                id="empresa-nit"
                value={empresaForm.nit ?? ""}
                onChange={(e) => setEmpresaForm({ ...empresaForm, nit: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa-correo">Correo del negocio</Label>
              <Input
                id="empresa-correo"
                type="email"
                value={empresaForm.correo ?? ""}
                onChange={(e) => setEmpresaForm({ ...empresaForm, correo: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa-telefono">Telefono</Label>
              <Input
                id="empresa-telefono"
                value={empresaForm.telefono ?? ""}
                onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa-ciudad">Ciudad</Label>
              <Input
                id="empresa-ciudad"
                value={empresaForm.ciudad ?? ""}
                onChange={(e) => setEmpresaForm({ ...empresaForm, ciudad: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa-logo">Logo URL o ruta local</Label>
              <Input
                id="empresa-logo"
                value={empresaForm.logo_url ?? ""}
                placeholder="logo/LogoMotoManager.png"
                onChange={(e) => setEmpresaForm({ ...empresaForm, logo_url: e.target.value })}
              />
            </div>
            {empresaForm.logo_url &&
              (/^(https?:|data:|\/assets\/)/.test(empresaForm.logo_url) ? (
              <div className="sm:col-span-2">
                <div className="inline-flex items-center gap-3 rounded-md border p-3">
                  <span className="text-sm text-muted-foreground">Vista previa</span>
                  <img src={empresaForm.logo_url} alt="Logo del negocio" className="h-12 max-w-48 object-contain" />
                </div>
              </div>
            ) : null)}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={updateEmpresa.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateEmpresa.isPending ? "Guardando..." : "Guardar datos del negocio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Servicios del taller</CardTitle>
            <CardDescription>Catalogo usado en Agenda y Portal cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {servicios.isLoading ? (
              <TableSkeleton rows={4} />
            ) : servicios.isError ? (
              <ErrorState error={servicios.error} onRetry={() => servicios.refetch()} />
            ) : (servicios.data ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aun no hay servicios creados
              </div>
            ) : (
              servicios.data?.map((servicio) => (
                <div key={servicio.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{servicio.nombre}</p>
                      <Badge variant={servicio.is_active === false ? "outline" : "secondary"}>
                        {servicio.is_active === false ? "Inactivo" : "Activo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {servicio.duracion_minutos ?? 0} min · {formatMoney(servicio.precio_base ?? 0)}
                    </p>
                    {servicio.descripcion && <p className="mt-1 text-sm text-muted-foreground">{servicio.descripcion}</p>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => editarServicio(servicio)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{servicioEditando ? "Editar servicio" : "Nuevo servicio"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitServicio} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="servicio-nombre">Nombre *</Label>
                <Input
                  id="servicio-nombre"
                  value={servicioForm.nombre}
                  onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                  placeholder="Ej. Cambio de aceite"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="servicio-duracion">Duracion (min)</Label>
                  <Input
                    id="servicio-duracion"
                    type="number"
                    min="1"
                    value={servicioForm.duracion_minutos}
                    onChange={(e) => setServicioForm({ ...servicioForm, duracion_minutos: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="servicio-precio">Precio base</Label>
                  <Input
                    id="servicio-precio"
                    type="number"
                    min="0"
                    step="100"
                    value={servicioForm.precio_base ?? 0}
                    onChange={(e) => setServicioForm({ ...servicioForm, precio_base: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="servicio-descripcion">Descripcion</Label>
                <Textarea
                  id="servicio-descripcion"
                  rows={3}
                  value={servicioForm.descripcion ?? ""}
                  onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={servicioForm.is_active !== false}
                  onChange={(e) => setServicioForm({ ...servicioForm, is_active: e.target.checked })}
                />
                Servicio activo
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={!servicioForm.nombre.trim() || createServicio.isPending || updateServicio.isPending}
                >
                  {servicioEditando ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {servicioEditando ? "Guardar servicio" : "Crear servicio"}
                </Button>
                {servicioEditando && (
                  <Button type="button" variant="outline" onClick={resetServicioForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
