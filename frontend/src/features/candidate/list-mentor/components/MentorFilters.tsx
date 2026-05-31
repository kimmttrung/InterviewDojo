import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useFilterOptions } from '../hooks/useFilterOptions';

interface Props {
  filters: any;
  setFilters: (filters: any) => void;
}

export function MentorFilters({ filters, setFilters }: Props) {
  const { roles, companies, skills, categories, industries } = useFilterOptions();

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-background border rounded-lg">
      {/* Search */}
      <Input
        placeholder="Search name or headline..."
        value={filters.search || ''}
        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        className="w-64"
      />

      {/* Industry */}
      <Select
        value={filters.industry || ''}
        onValueChange={(val) => setFilters({ ...filters, industry: val || undefined, page: 1 })}
      >
        <SelectTrigger className="w-44 bg-white">
          <SelectValue placeholder="Industry" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {(industries.data || []).map((ind: string) => (
            <SelectItem key={ind} value={ind}>
              {ind}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Role */}
      <Select
        value={filters.roleIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, roleIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44 bg-white">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {(roles.data || []).map((role: any) => (
            <SelectItem key={role.id} value={role.id.toString()}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Company */}
      <Select
        value={filters.companyIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, companyIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44 bg-white">
          <SelectValue placeholder="Company" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {(companies.data || []).map((c: any) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Skill */}
      <Select
        value={filters.skillIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, skillIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44 bg-white">
          <SelectValue placeholder="Skill" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {(skills.data || []).map((s: any) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={filters.categoryIds?.[0]?.toString() || ''}
        onValueChange={(val) =>
          setFilters({ ...filters, categoryIds: val ? [Number(val)] : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-52 bg-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {(categories.data || []).map((c: any) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear */}
      <Button variant="ghost" onClick={() => setFilters({ page: 1, limit: 10 })}>
        Clear
      </Button>
    </div>
  );
}
