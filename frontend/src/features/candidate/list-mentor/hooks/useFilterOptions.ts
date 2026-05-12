// features/candidate/list-mentor/hooks/useFilterOptions.ts
import { useQuery } from '@tanstack/react-query';
import { filterOptionsService } from '../services/filter-options.service';

export const useFilterOptions = () => {
  const roles = useQuery({
    queryKey: ['filter-options', 'roles'],
    queryFn: filterOptionsService.getRoles,
  });

  const companies = useQuery({
    queryKey: ['filter-options', 'companies'],
    queryFn: filterOptionsService.getCompanies,
  });

  const skills = useQuery({
    queryKey: ['filter-options', 'skills'],
    queryFn: filterOptionsService.getSkills,
  });

  const categories = useQuery({
    queryKey: ['filter-options', 'categories'],
    queryFn: filterOptionsService.getCategories,
  });

  const industries = useQuery({
    queryKey: ['filter-options', 'industries'],
    queryFn: filterOptionsService.getIndustries,
    select: (data) => (Array.isArray(data) ? data : []),
  });

  return { roles, companies, skills, categories, industries };
};
