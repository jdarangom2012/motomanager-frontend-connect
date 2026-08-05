import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, Server } from "lucide-react";
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
import { useAuth } from "@/lib/auth";
import { ApiError, getApiBase, setApiBase } from "@/lib/api";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso interno | MotoManager" },
      {
        name: "description",
        content: "Ingreso al sistema de gestion de talleres de motocicletas MotoManager de NautilusTech.",
      },
      { property: "og:title", content: "Acceso interno | MotoManager" },
      {
        property: "og:description",
        content: "Ingreso al sistema de gestion de talleres de motocicletas MotoManager de NautilusTech.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiBase, setApiBaseValue] = useState("");

  useEffect(() => setApiBaseValue(getApiBase()), []);
  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [ready, isAuthenticated, navigate]);

  const disabled = !email.trim() || !password.trim() || loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) setError(err.message);
      else if (err instanceof ApiError && (err.status === 400 || err.status === 401))
        setError("Credenciales invalidas. Revisa los datos e intenta nuevamente.");
      else setError(err instanceof Error ? err.message : "Error inesperado al iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="rounded-xl border bg-card p-8 shadow-xl">
          <img
            src="/assets/brand/LogoMotoManager.png"
            alt="MotoManager"
            width={1536}
            height={512}
            className="mx-auto h-auto w-[210px] max-w-full object-contain"
          />
          <h1 className="mt-6 text-center text-lg font-semibold tracking-tight">Acceso interno</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo o usuario</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="pl-9"
                  placeholder="admin@taller.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={disabled}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solicita soporte al administrador</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Server className="h-3.5 w-3.5" /> API
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>URL base de la API</DialogTitle>
                    <DialogDescription>
                      MotoManager consume el backend Django real. Por defecto: http://localhost:8000/api/v1
                    </DialogDescription>
                  </DialogHeader>
                  <Input value={apiBase} onChange={(e) => setApiBaseValue(e.target.value)} />
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setApiBase(apiBase);
                        window.location.reload();
                      }}
                    >
                      Guardar y recargar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Desarrollado por</span>
          <a
            href="https://nautilustech.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir sitio web de NautilusTech"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <img
              src="/assets/brand/LogoNautilusTech.png"
              alt="NautilusTech"
              loading="lazy"
              className="h-20 w-20 rounded-sm object-contain opacity-90 transition-opacity hover:opacity-100"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
