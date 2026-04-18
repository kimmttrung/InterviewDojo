import { MentorSidebar } from '../../src/pages/mentor/MentorSidebar';
import { MentorNavbar } from './MentorNavbar';

interface Props {
  children: React.ReactNode;
}

export function MentorLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <MentorNavbar />

      {/* SIDEBAR + CONTENT */}
      <div className="flex">
        <MentorSidebar />

        <main className="flex-1 pt-16 lg:ml-64">
          <div className="p-6 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
