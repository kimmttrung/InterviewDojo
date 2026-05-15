// components/MentorProfileSection.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import type { MentorDetail } from '../types/mentor-detail.types';

interface Props {
  mentor: MentorDetail;
}

export function MentorProfileSection({ mentor }: Props) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage src={mentor.avatarUrl || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-slate-900">{mentor.name}</h1>
          {mentor.mentorProfile?.headline && (
            <p className="mt-1 text-lg text-slate-600">{mentor.mentorProfile.headline}</p>
          )}
          {mentor.bio && <p className="mt-3 text-slate-700 leading-relaxed">{mentor.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
            {mentor.linkedInLink && (
              <a
                href={mentor.linkedInLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
            )}
            {mentor.githubLink && (
              <a
                href={mentor.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
            )}
            <span>{mentor.experienceYears} years experience</span>
          </div>
        </div>
      </div>
      {mentor.mentorProfile?.introductionVideoUrl && (
        <div className="mt-6 overflow-hidden rounded-2xl border bg-black shadow-md">
          <video
            controls
            className="max-h-[400px] w-full"
            src={mentor.mentorProfile.introductionVideoUrl}
          >
            <track kind="captions" />
          </video>
        </div>
      )}
    </section>
  );
}
