import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paginated } from "@/lib/api";

type PaginationControlsProps<T> = {
  data?: Paginated<T> | undefined;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

const DEFAULT_PAGE_SIZE = 20;

export function PaginationControls<T>({
  data,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  isLoading,
}: PaginationControlsProps<T>) {
  if (!data || data.count === 0) return null;

  const visibleCount = data.results.length || pageSize;
  const from = data.count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min((page - 1) * pageSize + visibleCount, data.count);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Mostrando {from}-{to} de {data.count}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={isLoading || !data.previous}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="min-w-16 text-center text-xs font-medium text-foreground">Pagina {page}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={isLoading || !data.next}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
