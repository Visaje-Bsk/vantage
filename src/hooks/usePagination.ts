import { useState, useEffect, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchFields?: (keyof T)[];
}

export function usePagination<T>({ 
  data, 
  itemsPerPage = 10, 
  searchTerm = '', 
  searchFields = [] 
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;
    
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchFields]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data]);

  return {
    currentPage,
    totalPages,
    filteredData,
    paginatedData,
    setCurrentPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalItems: filteredData.length
  };
}