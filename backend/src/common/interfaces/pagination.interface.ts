export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const buildPaginationResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> => {
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
