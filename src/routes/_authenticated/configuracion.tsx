import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useConfiguracionEmpresa, useUpdateConfiguracionEmpresa } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { ConfiguracionEmpresaWrite } from "@/lib/types";

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
  const update = useUpdateConfiguracionEmpresa();
  const [form, setForm] = useState<ConfiguracionEmpresaWrite>({});

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
    </div>
  );
}
