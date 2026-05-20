import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
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
            {company?.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-5 w-5 rounded-full object-contain"
              />
            )}
          </div>
          <p className="text-base font-medium text-gray-500 leading-tight mt-1">{headline}</p>
        </div>
      </div>

      {/* Rating (tạm thời hiển thị cứng, bạn có thể thêm API sau) */}
      <div className="flex items-center mt-3">
        <svg
          className="h-5 w-5 text-yellow-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
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
        <svg
          width="14"
          height="14"
          viewBox="0 0 18 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 ml-1.5"
        >
          <path
            d="M10.6667 1.1665L16.5 6.99984M16.5 6.99984L10.6667 12.8332M16.5 6.99984H1.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </Button>
    </Card>
  );
}
