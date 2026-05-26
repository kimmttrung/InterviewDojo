import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });
};
