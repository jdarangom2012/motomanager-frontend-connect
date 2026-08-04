import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, Mail, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import {
  useCreateFactura,
  useCreatePago,
  useEnviarFacturaEmail,
  useFacturas,
  useGenerarPdfFactura,
  useOrdenes,
  usePagos,
} from "@/lib/hooks";
import { ApiError, downloadProtectedFile } from "@/lib/api";
import { estadoLabel, formatDateTime, formatMoney } from "@/lib/format";
import type { PagoMetodo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/facturas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Facturas y pagos | MotoManager" },
      { name: "description", content: "Emision de facturas PDF no electronicas y registro de pagos del taller." },
      { property: "og:title", content: "Facturas y pagos | MotoManager" },
      {
        property: "og:description",
        content: "Emision de facturas PDF no electronicas y registro de pagos del taller.",
      },
    ],
  }),
  component: FacturasPage,
});

const METODOS: PagoMetodo[] = ["efectivo", "transferencia", "nequi", "daviplata", "tarjeta", "credito", "otro"];

function FacturasPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [facturasPage, setFacturasPage] = useState(1);
  const [pagosPage, setPagosPage] = useState(1);
  const [openFactura, setOpenFactura] = useState(false);
  const [ordenId, setOrdenId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [openPago, setOpenPago] = useState(false);
  const [pagoFacturaId, setPagoFacturaId] = useState("");
  const [metodo, setMetodo] = useState<PagoMetodo>("efectivo");
  const [valor, setValor] = useState("");
  const [referencia, setReferencia] = useState("");

  const facturas = useFacturas({
    fecha_desde: desde || undefined,
    fecha_hasta: hasta || undefined,
    page: facturasPage,
  });
  const pagos = usePagos({ fecha_desde: desde || undefined, fecha_hasta: hasta || undefined, page: pagosPage });
  const ordenes = useOrdenes("");
  const createFactura = useCreateFactura();
  const createPago = useCreatePago();
  const generarPdf = useGenerarPdfFactura();
  const enviarEmail = useEnviarFacturaEmail();

  const items = facturas.data?.results ?? [];
  const pagosItems = pagos.data?.results ?? [];

  async function submitFactura(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createFactura.mutateAsync({
        orden_id: ordenId,
        ...(observaciones ? { observaciones } : {}),
      });
      toast.success("Factura creada");
      setOpenFactura(false);
      setOrdenId("");
      setObservaciones("");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo crear la factura");
    }
  }

  async function submitPago(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPago.mutateAsync({
        factura_id: pagoFacturaId,
        metodo,
        valor: Number(valor),
        ...(referencia ? { referencia } : {}),
      });
      toast.success("Pago registrado");
      setOpenPago(false);
      setValor("");
      setReferencia("");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo registrar el pago");
    }
  }

  async function pdf(id: string) {
    try {
      const file = await generarPdf.mutateAsync(id);
      if (file?.file_url) {
        const blob = await downloadProtectedFile(file.file_url);
        const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: file.mime_type || "application/pdf" }));
        window.open(blobUrl, "_blank", "noopener");
        window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
      }
      toast.success("PDF generado");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo generar el PDF");
    }
  }

  async function emailFactura(id: string) {
    try {
      const result = await enviarEmail.mutateAsync({ id });
      toast.success(`Factura enviada a ${result.destinatario}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo enviar el correo");
    }
  }

  function abrirPago(facturaId: string) {
    setPagoFacturaId(facturaId);
    setMetodo("efectivo");
    setValor("");
    setReferencia("");
    setOpenPago(true);
  }

  return (
    <div>
      <PageHeader
        title="Facturas y pagos"
        subtitle="Facturacion PDF no electronica y aplicacion de pagos sobre saldos."
        actions={
          <Dialog open={openFactura} onOpenChange={setOpenFactura}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva factura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva factura</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitFactura} className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Orden de trabajo *</Label>
                  <Select value={ordenId} onValueChange={setOrdenId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una orden" />
                    </SelectTrigger>
                    <SelectContent>
                      {(ordenes.data?.results ?? []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.numero} - {o.cliente?.nombre} ({o.motocicleta?.placa})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    El backend genera el detalle desde la orden si no se envian lineas.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="obs">Observaciones</Label>
                  <Input id="obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenFactura(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!ordenId || createFactura.isPending}>
                    {createFactura.isPending ? "Creando..." : "Crear factura"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="grid gap-1">
          <Label htmlFor="desde" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id="desde"
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setFacturasPage(1);
              setPagosPage(1);
            }}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="hasta" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="hasta"
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setFacturasPage(1);
              setPagosPage(1);
            }}
          />
        </div>
      </div>

      <Tabs defaultValue="facturas">
        <TabsList className="mb-4">
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas">
          {facturas.isLoading ? (
            <TableSkeleton />
          ) : facturas.isError ? (
            <ErrorState error={facturas.error} onRetry={() => facturas.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState message="No hay facturas en el rango seleccionado" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead className="hidden md:table-cell">Cliente</TableHead>
                      <TableHead className="hidden lg:table-cell">Orden</TableHead>
                      <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.numero}</TableCell>
                        <TableCell className="hidden md:table-cell">{f.cliente?.nombre ?? "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{f.orden_numero ?? "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDateTime(f.fecha)}</TableCell>
                        <TableCell>{formatMoney(f.total)}</TableCell>
                        <TableCell className={Number(f.saldo) > 0 ? "font-medium text-destructive" : undefined}>
                          {formatMoney(f.saldo)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={Number(f.saldo) > 0 ? "secondary" : "outline"}>
                            {estadoLabel(f.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => pdf(f.id)} disabled={generarPdf.isPending}>
                              <FileDown className="mr-1 h-3.5 w-3.5" /> PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => emailFactura(f.id)}
                              disabled={enviarEmail.isPending}
                            >
                              <Mail className="mr-1 h-3.5 w-3.5" /> Email
                            </Button>
                            <Button size="sm" onClick={() => abrirPago(f.id)} disabled={Number(f.saldo) <= 0}>
                              <Wallet className="mr-1 h-3.5 w-3.5" /> Pago
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls
                  data={facturas.data}
                  page={facturasPage}
                  onPageChange={setFacturasPage}
                  isLoading={facturas.isFetching}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pagos">
          {pagos.isLoading ? (
            <TableSkeleton />
          ) : pagos.isError ? (
            <ErrorState error={pagos.error} onRetry={() => pagos.refetch()} />
          ) : pagosItems.length === 0 ? (
            <EmptyState message="No hay pagos registrados en el rango seleccionado" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Referencia</TableHead>
                      <TableHead className="hidden lg:table-cell">Factura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosItems.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDateTime(p.fecha)}</TableCell>
                        <TableCell className="capitalize">{p.metodo}</TableCell>
                        <TableCell className="font-medium">{formatMoney(p.valor)}</TableCell>
                        <TableCell className="hidden md:table-cell">{p.referencia ?? "-"}</TableCell>
                        <TableCell className="hidden font-mono text-xs lg:table-cell">
                          {items.find((f) => f.id === p.factura_id)?.numero ?? p.factura_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls
                  data={pagos.data}
                  page={pagosPage}
                  onPageChange={setPagosPage}
                  isLoading={pagos.isFetching}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openPago} onOpenChange={setOpenPago}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPago} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Metodo *</Label>
              <Select value={metodo} onValueChange={(v) => setMetodo(v as PagoMetodo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                min="0"
                step="1"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ref">Referencia</Label>
              <Input id="ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenPago(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!valor || Number(valor) <= 0 || createPago.isPending}>
                {createPago.isPending ? "Guardando..." : "Registrar pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
