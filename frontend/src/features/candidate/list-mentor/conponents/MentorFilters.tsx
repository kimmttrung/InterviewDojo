// features/candidate/list-mentor/components/MentorFilters.tsx
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useFilterOptions } from '../hooks/useFilterOption';

interface Props {
  filters: any;
  setFilters: (filters: any) => void;
}

export function MentorFilters({ filters, setFilters }: Props) {
  const { roles, companies, skills, categories } = useFilterOptions();

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-background border rounded-lg">
      <Input
        placeholder="Search name or headline..."
        value={filters.search || ''}
        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        className="w-64"
      />

      <Select
        value={filters.roleIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, roleIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          {(roles.data || []).map((role: any) => (
            <SelectItem key={role.id} value={role.id.toString()}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.companyIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, companyIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Company" />
        </SelectTrigger>
        <SelectContent>
          {(companies.data || []).map((c: any) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.skillIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, skillIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Skill" />
        </SelectTrigger>
        <SelectContent>
          {(skills.data || []).map((s: any) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, categoryIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {(categories.data || []).map((c: any) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={() => setFilters({ page: 1, limit: 10 })}>
        Clear
      </Button>
    </div>
  );
}
