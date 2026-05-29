import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { ArrowRight, Building2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MentorProps {
  mentor: {
    id: number;
    name: string;
    avatarUrl?: string;
    bio?: string;
    mentorProfile?: {
      headline: string;
      experiences?: Array<{
        isCurrent: boolean;
        company: { id: number; name: string; logoUrl?: string };
        jobRole: { id: number; name: string };
      }>;
    };
    skills?: Array<{
      id: number;
      name: string;
      type: string;
      level: string;
      experienceMonths: number;
    }>;
  };
}

export function MentorCard({ mentor }: MentorProps) {
  const navigate = useNavigate();
  const currentExp = mentor.mentorProfile?.experiences?.find((exp) => exp.isCurrent);
  const company = currentExp?.company;
  const role = currentExp?.jobRole;
  const headline =
    mentor.mentorProfile?.headline || (currentExp ? `${role?.name} @ ${company?.name}` : '');

  const topSkills = mentor.skills?.slice(0, 5) || [];
  const moreSkillsCount = (mentor.skills?.length || 0) - topSkills.length;

  return (
    <Card
      onClick={() => navigate(`/mentors/${mentor.id}`)}
      className="cursor-pointer p-4 sm:p-6 shadow border border-gray-200 relative flex flex-col overflow-hidden hover:shadow-md transition duration-150 group"
    >
      {/* Avatar và tên */}
      <div className="flex items-start w-full">
        <Avatar className="h-16 w-16 mr-4 shrink-0">
          <AvatarImage src={mentor.avatarUrl || undefined} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {mentor.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{mentor.name}</h3>
            {company?.name && (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                title={company.name}
              >
                <Building2 className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <p className="text-base font-medium text-gray-500 leading-tight mt-1">{headline}</p>
        </div>
      </div>

      {/* Rating (tạm thời hiển thị cứng, bạn có thể thêm API sau) */}
      <div className="flex items-center mt-3">
        <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
        <span className="ml-1 text-gray-600 text-sm font-semibold">5.0</span>
        <span className="text-gray-500 text-sm font-light ml-1">(0 sessions)</span>
      </div>

      {/* Mô tả ngắn */}
      <p className="my-3 text-gray-500 font-medium line-clamp-2">
        {mentor.bio ||
          `Experienced ${role?.name || 'mentor'} at ${company?.name || 'Top Company'}.`}
      </p>

      {/* Kỹ năng */}
      <div className="mb-3 flex flex-wrap gap-2 items-center text-gray-700 font-medium text-sm">
        {topSkills.map((skill) => (
          <Badge
            key={skill.id}
            variant="secondary"
            className="bg-gray-200 text-gray-600 text-xs font-medium rounded-lg px-2 py-1"
          >
            {skill.name}
          </Badge>
        ))}
        {moreSkillsCount > 0 && (
          <Badge
            variant="secondary"
            className="bg-gray-200 text-gray-600 text-xs font-medium rounded-lg px-2 py-1"
          >
            + {moreSkillsCount} more
          </Badge>
        )}
      </div>

      {/* Nút Book now */}
      <Button className="w-full mt-auto bg-indigo-600 hover:bg-indigo-700 text-white">
        Book now
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    </Card>
  );
}
