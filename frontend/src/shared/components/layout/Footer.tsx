import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const sections = [
    {
      title: 'Products',
      links: ['Pricing', 'Courses', 'Coaching', 'Experiences', 'Questions', 'Mock Interviews'],
    },
    {
      title: 'Popular Courses',
      links: [
        'Product Management',
        'Software Engineering',
        'System Design',
        'Data Science',
        'Machine Learning',
      ],
    },
    {
      title: 'Interview Prep',
      links: ['PM Questions', 'SWE Questions', 'Data Questions', 'Behavioral', 'Generative AI'],
    },
  ];

  return (
    <footer className="bg-background border-t py-6 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-primary">InterviewDojo</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get updates in your inbox with the latest tips, job listings, and more.
          </p>
          <div className="flex gap-4 pt-2">
            <Twitter className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
            <Linkedin className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
            <Github className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold mb-3 text-sm">{section.title}</h4>
            <ul className="space-y-1.5">
              {section.links.map((link) => (
                <li
                  key={link}
                  className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                >
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
        © 2026 InterviewDojo. All rights reserved.
      </div>
    </footer>
  );
}
