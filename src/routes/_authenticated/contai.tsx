import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/states";
import { useExportarContai } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { ExportacionContaiRequest, FileGenerated } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/contai")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exportacion Contai | MotoManager" },
      { name: "description", content: "Genera archivos Excel o CSV para cargar en Contai desde el taller." },
      { property: "og:title", content: "Exportacion Contai | MotoManager" },
      { property: "og:description", content: "Genera archivos Excel o CSV para cargar en Contai desde el taller." },
    ],
  }),
  component: ContaiPage,
});

const TIPOS: ExportacionContaiRequest["tipo"][] = [
  "paquete_completo",
  "ventas",
  "compras",
  "pagos",
  "inventario",
];

function ContaiPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [formato, setFormato] = useState<ExportacionContaiRequest["formato"]>("xlsx");
  const [tipo, setTipo] = useState<ExportacionContaiRequest["tipo"]>("paquete_completo");
  const [file, setFile] = useState<FileGenerated | null>(null);
  const exportar = useExportarContai();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await exportar.mutateAsync({ fecha_desde: desde, fecha_hasta: hasta, formato, tipo });
      setFile(result);
      toast.success("Exportacion generada");
      if (result?.file_url) window.open(result.file_url, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo generar la exportacion");
    }
  }

  return (
    <div>
      <PageHeader
        title="Exportacion Contai"
        subtitle="Genera el paquete contable en Excel o CSV para cargarlo en Contai."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Parametros de exportacion</CardTitle>
          <CardDescription>Todos los campos son obligatorios segun el contrato del backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="desde">Fecha desde *</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hasta">Fecha hasta *</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ExportacionContaiRequest["tipo"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Formato *</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as ExportacionContaiRequest["formato"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (xlsx)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!desde || !hasta || exportar.isPending}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {exportar.isPending ? "Generando..." : "Generar exportacion"}
              </Button>
            </div>
          </form>

          {file && (
            <div className="mt-6 flex items-center justify-between rounded-md border bg-muted/40 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.filename}</p>
                <p className="text-xs text-muted-foreground">{file.mime_type}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Descargar
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
