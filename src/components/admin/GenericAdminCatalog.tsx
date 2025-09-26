import React, { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Search, Plus } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => ReactNode;
}

interface GenericAdminCatalogProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchFields: (keyof T)[];
  searchPlaceholder?: string;
  onAdd?: () => void;
  renderActions?: (item: T) => ReactNode;
  renderModal?: () => ReactNode;
  showModal?: boolean;
  onModalChange?: (open: boolean) => void;
}

export function GenericAdminCatalog<T extends Record<string, any>>({
  title,
  data,
  columns,
  loading = false,
  searchFields,
  searchPlaceholder = "Buscar...",
  onAdd,
  renderActions,
  renderModal,
  showModal = false,
  onModalChange,
}: GenericAdminCatalogProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    currentPage, 
    totalPages, 
    paginatedData, 
    setCurrentPage, 
    totalItems 
  } = usePagination({
    data,
    itemsPerPage: 10,
    searchTerm,
    searchFields
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {onAdd && (
          <Dialog open={showModal} onOpenChange={onModalChange}>
            <DialogTrigger asChild>
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </DialogTrigger>
            {renderModal && renderModal()}
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {title} ({totalItems}) 
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Página {currentPage} de {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={String(column.key)}>{column.header}</TableHead>
                    ))}
                    {renderActions && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={String(column.key)}>
                          {column.render ? column.render(item[column.key], item) : item[column.key]}
                        </TableCell>
                      ))}
                      {renderActions && (
                        <TableCell className="text-right space-x-2">
                          {renderActions(item)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell 
                        colSpan={columns.length + (renderActions ? 1 : 0)} 
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm ? 'No se encontraron registros' : 'No hay registros'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {currentPage > 2 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(currentPage - 1)}
                            className="cursor-pointer"
                          >
                            {currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationLink isActive>
                          {currentPage}
                        </PaginationLink>
                      </PaginationItem>
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="cursor-pointer"
                          >
                            {currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {currentPage < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(totalPages)}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}