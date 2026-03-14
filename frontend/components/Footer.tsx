import { Github, Twitter, Linkedin, Youtube } from "lucide-react";

export function Footer() {
    const sections = [
        {
            title: "Products",
            links: ["Pricing", "Courses", "Coaching", "Experiences", "Questions", "Mock Interviews"],
        },
        {
            title: "Popular Courses",
            links: ["Product Management", "Software Engineering", "System Design", "Data Science", "Machine Learning"],
        },
        {
            title: "Interview Prep",
            links: ["PM Questions", "SWE Questions", "Data Questions", "Behavioral", "Generative AI"],
        },
    ];

    return (
        <footer className="bg-background border-t py-12 px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-xl text-primary">InterviewDojo</h3>
                    <p className="text-sm text-muted-foreground">
                        Get updates in your inbox with the latest tips, job listings, and more.
                    </p>
                    <div className="flex gap-4">
                        <Twitter className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
                        <Linkedin className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
                        <Github className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
                    </div>
                </div>
                {sections.map((section) => (
                    <div key={section.title}>
                        <h4 className="font-semibold mb-4">{section.title}</h4>
                        <ul className="space-y-2">
                            {section.links.map((link) => (
                                <li key={link} className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                                    {link}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                © 2026 InterviewDojo. All rights reserved.
            </div>
        </footer>
    );
}