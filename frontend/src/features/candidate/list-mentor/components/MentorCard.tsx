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

// Số lượng skill tối đa hiển thị (có thể điều chỉnh)
const MAX_VISIBLE_SKILLS = 5;

export function MentorCard({ mentor }: MentorProps) {
  const navigate = useNavigate();
  const currentExp = mentor.mentorProfile?.experiences?.find((exp) => exp.isCurrent);
  const company = currentExp?.company;
  const role = currentExp?.jobRole;
  const headline =
    mentor.mentorProfile?.headline || (currentExp ? `${role?.name} @ ${company?.name}` : '');

  const skills = mentor.skills || [];
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
  const hiddenCount = Math.max(skills.length - MAX_VISIBLE_SKILLS, 0);

  return (
    <Card
      onClick={() => navigate(`/mentors/${mentor.id}`)}
      className="cursor-pointer p-4 sm:p-6 shadow border border-gray-200 relative flex flex-col h-full overflow-hidden hover:shadow-md transition duration-150 group"
    >
      {/* Header: Avatar + Name + Company */}
      <div className="flex items-start w-full">
        <Avatar className="h-16 w-16 mr-4 shrink-0">
          <AvatarImage src={mentor.avatarUrl || undefined} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {mentor.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold truncate">{mentor.name}</h3>
            {company?.name && (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0"
                title={company.name}
              >
                <Building2 className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <p className="text-base font-medium text-gray-500 leading-tight mt-1 line-clamp-2">
            {headline}
          </p>
        </div>
      </div>

      {/* Rating (mock) */}
      <div className="flex items-center mt-3">
        <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
        <span className="ml-1 text-gray-600 text-sm font-semibold">5.0</span>
        <span className="text-gray-500 text-sm font-light ml-1">(0 sessions)</span>
      </div>

      {/* Bio */}
      <p className="my-3 text-gray-500 font-medium line-clamp-2">
        {mentor.bio ||
          `Experienced ${role?.name || 'mentor'} at ${company?.name || 'Top Company'}.`}
      </p>

      {/* Skills – chỉ hiển thị tối đa MAX_VISIBLE_SKILLS, phần còn lại gộp +n */}
      <div className="mb-3 min-h-[56px]">
        <div className="flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <Badge
              key={skill.id}
              variant="secondary"
              className="bg-gray-200 text-gray-600 text-xs font-medium rounded-lg px-2 py-1 max-w-[140px] truncate"
              title={skill.name}
            >
              {skill.name}
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg px-2 py-1 shrink-0"
            >
              +{hiddenCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Nút Book now */}
      <div className="mt-auto pt-2">
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          Book now
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
