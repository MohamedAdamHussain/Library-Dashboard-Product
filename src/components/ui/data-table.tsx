import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  toolbar?: React.ReactNode;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;

  // C6 fix: server-side pagination props (اختياري)
  // لو مررت هذه، يُستخدم Pagination الخارجي بدلاً من client-side
  serverPagination?: {
    page: number; // 1-based
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  emptyMessage = "لا توجد بيانات",
  pageSize = 10,
  onRowClick,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    // C6 fix: لو serverPagination موجود، استخدم manualPagination
    initialState: serverPagination
      ? { pagination: { pageSize: data.length || 1 } }
      : { pagination: { pageSize } },
    manualPagination: !!serverPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: serverPagination
      ? undefined
      : getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {toolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {toolbar}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 text-right font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className="text-muted-foreground/50 hover:text-foreground transition-colors"
                              aria-label="ترتيب"
                            >
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUpDown className="h-3 w-3 rotate-180" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowUpDown className="h-3 w-3" />
                              ) : (
                                <ChevronsUpDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-accent/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* C6 fix: استخدم server-side Pagination لو موجود، وإلا client-side الأصلي */}
      {serverPagination ? (
        <Pagination
          page={serverPagination.page}
          lastPage={serverPagination.lastPage}
          total={serverPagination.total}
          perPage={serverPagination.perPage}
          onPageChange={serverPagination.onPageChange}
        />
      ) : (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            عرض{" "}
            <span className="font-semibold text-foreground">
              {table.getState().pagination.pageIndex * pageSize + 1}
            </span>{" "}
            –{" "}
            <span className="font-semibold text-foreground">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * pageSize,
                data.length
              )}
            </span>{" "}
            من{" "}
            <span className="font-semibold text-foreground">{data.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            <div className="mx-1 flex items-center gap-1">
              {Array.from({
                length: Math.min(5, table.getPageCount()),
              }).map((_, i) => {
                const currentPage = table.getState().pagination.pageIndex;
                const pageCount = table.getPageCount();
                let p: number;
                if (pageCount <= 5) p = i;
                else if (currentPage <= 2) p = i;
                else if (currentPage >= pageCount - 3) p = pageCount - 5 + i;
                else p = currentPage - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => table.setPageIndex(p)}
                    className={cn(
                      "h-9 w-9 rounded-lg text-sm font-semibold transition-colors",
                      p === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {p + 1}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
