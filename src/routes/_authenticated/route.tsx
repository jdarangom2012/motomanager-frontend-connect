import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Plus, Search, Server } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getApiBase, setApiBase } from "@/lib/api";
import { useGlobalSearch, useMarcarNotificacionLeida, useNotificaciones } from "@/lib/hooks";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function ApiBaseDialog() {
  const [value, setValue] = useState("");
  useEffect(() => setValue(getApiBase()), []);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Configurar URL de la API">
          <Server className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>URL base de la API</DialogTitle>
          <DialogDescription>
            El backend Django corre en tu maquina. Si usas otro host o puerto, cambialo aqui.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="api-base">API base</Label>
          <Input id="api-base" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setApiBase(value);
              window.location.reload();
            }}
          >
            Guardar y recargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SearchSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div>{children}</div>
    </div>
  );
}

function SearchItem({ label, detail, onClick }: { label: string; detail?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span className="block truncate font-medium">{label}</span>
      {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
    </button>
  );
}

function AuthenticatedLayout() {
  const { user, ready, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchResults = useGlobalSearch(search.trim());
  const notificaciones = useNotificaciones();
  const marcarLeida = useMarcarNotificacionLeida();

  useEffect(() => {
    if (ready && !isAuthenticated) navigate({ to: "/", replace: true });
  }, [ready, isAuthenticated, navigate]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        <Skeleton className="hidden h-screen w-64 rounded-none md:block" />
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const initials = (user?.full_name || user?.email || "U").slice(0, 2).toUpperCase();
  const unreadCount = notificaciones.data?.results.filter((n) => !n.leida).length ?? 0;
  const hasSearchResults =
    (searchResults.data?.clientes?.length ?? 0) +
      (searchResults.data?.motocicletas?.length ?? 0) +
      (searchResults.data?.ordenes?.length ?? 0) +
      (searchResults.data?.repuestos?.length ?? 0) >
    0;

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3">
            <SidebarTrigger />
            <div className="relative hidden min-w-0 flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                className="pl-9 pr-16"
                placeholder="Buscar placa, cliente, orden o repuesto..."
                aria-label="Busqueda global"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Ctrl K
              </kbd>
              {searchOpen && search.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-lg">
                  {search.trim().length < 2 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">Escribe al menos 2 caracteres</p>
                  ) : searchResults.isLoading ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">Buscando...</p>
                  ) : searchResults.isError ? (
                    <p className="px-3 py-6 text-center text-sm text-destructive">No se pudo buscar</p>
                  ) : !hasSearchResults ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
                  ) : (
                    <div className="max-h-[420px] overflow-auto">
                      {(searchResults.data?.clientes ?? []).length > 0 && (
                        <SearchSection title="Clientes">
                          {searchResults.data?.clientes?.map((cliente) => (
                            <SearchItem
                              key={cliente.id}
                              label={cliente.nombre}
                              detail={`${cliente.documento}${cliente.celular ? ` · ${cliente.celular}` : ""}`}
                              onClick={() => {
                                closeSearch();
                                navigate({ to: "/clientes" });
                              }}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {(searchResults.data?.motocicletas ?? []).length > 0 && (
                        <SearchSection title="Motocicletas">
                          {searchResults.data?.motocicletas?.map((moto) => (
                            <SearchItem
                              key={moto.id}
                              label={moto.placa}
                              detail={`${moto.marca} ${moto.modelo}`}
                              onClick={() => {
                                closeSearch();
                                navigate({ to: "/motocicletas" });
                              }}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {(searchResults.data?.ordenes ?? []).length > 0 && (
                        <SearchSection title="Ordenes">
                          {searchResults.data?.ordenes?.map((orden) => (
                            <SearchItem
                              key={orden.id}
                              label={orden.numero}
                              detail={`${orden.motocicleta?.placa ?? ""} · ${orden.cliente?.nombre ?? ""}`}
                              onClick={() => {
                                closeSearch();
                                navigate({ to: "/ordenes/$id", params: { id: orden.id } });
                              }}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {(searchResults.data?.repuestos ?? []).length > 0 && (
                        <SearchSection title="Repuestos">
                          {searchResults.data?.repuestos?.map((repuesto) => (
                            <SearchItem
                              key={repuesto.id}
                              label={repuesto.nombre}
                              detail={`${repuesto.codigo_interno} · Stock ${repuesto.stock}`}
                              onClick={() => {
                                closeSearch();
                                navigate({ to: "/inventario" });
                              }}
                            />
                          ))}
                        </SearchSection>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <ApiBaseDialog />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-96">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && <Badge variant="secondary">{unreadCount} nuevas</Badge>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificaciones.isLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">Cargando...</div>
                  ) : notificaciones.isError ? (
                    <div className="p-3 text-sm text-destructive">No se pudieron cargar</div>
                  ) : (notificaciones.data?.results ?? []).length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No hay notificaciones</div>
                  ) : (
                    notificaciones.data?.results.map((notificacion) => (
                      <DropdownMenuItem
                        key={notificacion.id}
                        className="flex cursor-pointer items-start gap-3"
                        onClick={() => {
                          if (!notificacion.leida) marcarLeida.mutate(notificacion.id);
                        }}
                      >
                        <span
                          className={`mt-1 h-2 w-2 rounded-full ${
                            notificacion.leida ? "bg-muted" : "bg-primary"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{notificacion.titulo}</span>
                          {notificacion.mensaje && (
                            <span className="block line-clamp-2 text-xs text-muted-foreground">
                              {notificacion.mensaje}
                            </span>
                          )}
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {formatDateTime(notificacion.created_at)}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="icon" onClick={() => navigate({ to: "/recepcion" })} className="sm:hidden" aria-label="Nueva recepcion">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => navigate({ to: "/recepcion" })} className="hidden sm:inline-flex">
                <Plus className="mr-1 h-4 w-4" /> Nueva recepcion
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full text-xs font-semibold">
                    {initials}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="truncate">{user?.full_name || user?.email}</div>
                    <div className="truncate text-xs font-normal text-muted-foreground">
                      {(user?.roles ?? []).join(", ") || "Sin rol"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate({ to: "/", replace: true });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
