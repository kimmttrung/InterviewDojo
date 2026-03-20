import { useState } from "react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    ChevronDown,
    Search,
    Bookmark,
    MessageCircle,
    PlusCircle,
    Lock,
    Brain,
    Video,
    Code,
    Flame,
    PlayCircle,
    ChevronRight,
    ChevronLeft,
} from "lucide-react";

// --- MOCK DATA: 10 CÂU HỎI ---
const ALL_QUESTIONS = [
    { id: 1, askedAt: "Meta", timeAgo: "12 days ago", title: "Given a string s, return true if the s can be palindrome after deleting at most one character from it.", tags: ["Software Engineer", "DSA"], answers: 6, codeSnippet: "#include <iostream> bool palindrome(std::string &str, int left... ", hasVideo: false },
    { id: 2, askedAt: "Anthropic, Google", timeAgo: "1 month ago", title: "How do you approach GenAI safety in consumer products?", tags: ["Product Manager", "AI"], answers: 7, codeSnippet: "I'd start by clarifying what the business outcome we are driving...", hasVideo: true },
    { id: 3, askedAt: "Amazon", timeAgo: "2 days ago", title: "Design a rate limiter for a distributed system with multiple regions.", tags: ["Backend Engineer", "System Design"], answers: 24, codeSnippet: "To design a rate limiter, we can use the Token Bucket algorithm...", hasVideo: true },
    { id: 4, askedAt: "Apple", timeAgo: "1 week ago", title: "Tell me about a time you had to deal with a difficult stakeholder.", tags: ["All Roles", "Behavioral"], answers: 15, codeSnippet: "I once worked with a lead designer who was strictly against...", hasVideo: false },
    { id: 5, askedAt: "Microsoft", timeAgo: "5 days ago", title: "Implement an LRU Cache with O(1) time complexity for get and put operations.", tags: ["Software Engineer", "Coding"], answers: 32, codeSnippet: "class LRUCache { constructor(capacity) { this.capacity = capacity... ", hasVideo: true },
    { id: 6, askedAt: "Uber", timeAgo: "3 days ago", title: "How would you design the backend for a real-time ride-sharing app?", tags: ["System Design", "Backend"], answers: 11, codeSnippet: "We need a Geospatial index like H3 or Google S2 to track drivers...", hasVideo: false },
    { id: 7, askedAt: "Google", timeAgo: "15 days ago", title: "What happens exactly when you type 'google.com' in your browser and press Enter?", tags: ["Software Engineer", "Networking"], answers: 45, codeSnippet: "DNS resolution starts first. The browser checks its cache...", hasVideo: false },
    { id: 8, askedAt: "TikTok", timeAgo: "9 days ago", title: "Design a notification system that can handle 100 million users daily.", tags: ["System Design", "Scalability"], answers: 19, codeSnippet: "We should use a message queue like Kafka to buffer requests...", hasVideo: true },
    { id: 9, askedAt: "Stripe", timeAgo: "2 weeks ago", title: "Find the median of two sorted arrays of different sizes in logarithmic time.", tags: ["Software Engineer", "DSA"], answers: 28, codeSnippet: "Binary search on the smaller array to find the correct partition...", hasVideo: false },
    { id: 10, askedAt: "OpenAI", timeAgo: "1 month ago", title: "Explain the attention mechanism in Transformers for non-technical stakeholders.", tags: ["ML Engineer", "Product"], answers: 5, codeSnippet: "Think of it as a spotlight that focuses on specific words...", hasVideo: true },
];

export default function QuestionBank() {
    // Logic Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(ALL_QUESTIONS.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentQuestions = ALL_QUESTIONS.slice(startIndex, startIndex + itemsPerPage);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 bg-white min-h-screen">
                
                {/* BREADCRUMBS */}
                <nav className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="hover:text-indigo-600 cursor-pointer transition">Home</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900 font-medium">Questions</span>
                </nav>

                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Interview Questions
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Review this list of {ALL_QUESTIONS.length} interview questions verified by experts.
                        </p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg h-11 font-semibold shadow-md shadow-indigo-100 transition-all">
                        + Share interview
                    </Button>
                </div>

                {/* FILTER BAR */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                        <FilterDropdown label="Role" />
                        <Button variant="outline" className="rounded-lg text-slate-400 border-slate-200 hover:bg-slate-50">
                            <Lock className="w-3 h-3 mr-2" /> Company <ChevronDown className="ml-2 w-4 h-4" />
                        </Button>
                        <FilterDropdown label="Category" />
                        
                        {/* THE CUSTOM FILTER - NỀN TRẮNG ĐẶC (OPAQUE) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-lg border-indigo-600 text-indigo-600 ring-1 ring-indigo-600 bg-white hover:bg-indigo-50 transition-colors font-semibold">
                                    Filter <ChevronDown className="ml-2 w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="start" 
                                className="w-64 p-2 space-y-1 bg-white border border-slate-200 shadow-2xl z-50 rounded-xl"
                            >
                                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                                    <Brain className="w-4 h-4 text-pink-500" /> 
                                    <span className="font-medium text-slate-700">Expert answers</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                                    <Video className="w-4 h-4 text-purple-500" /> 
                                    <span className="font-medium text-slate-700">Videos</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                                    <Code className="w-4 h-4 text-blue-500" /> 
                                    <span className="font-medium text-slate-700">Code editor</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                                    <Bookmark className="w-4 h-4 text-indigo-500" /> 
                                    <span className="font-medium text-slate-700">Saved</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button variant="outline" className="rounded-lg border-slate-200 hover:border-indigo-400 transition-colors">
                        <Flame className="w-4 h-4 text-orange-500 mr-2" /> Hot <ChevronDown className="ml-2 w-4 h-4" />
                    </Button>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* LEFT COLUMN: LIST */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            <FeaturedSmallCard title="Popular machine learning questions" icon={<Brain className="text-orange-500"/>} bgColor="bg-orange-50" />
                            <FeaturedSmallCard title="Top coding questions to practice" icon={<Code className="text-blue-500"/>} bgColor="bg-blue-50" />
                        </div>

                        {/* LIST CÂU HỎI THEO TRANG */}
                        <div className="space-y-6">
                            {currentQuestions.map((q) => (
                                <QuestionCard key={q.id} {...q} />
                            ))}
                        </div>

                        {/* PHÂN TRANG UI */}
                        <div className="flex items-center justify-center gap-2 pt-10 pb-20">
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <Button
                                    key={i}
                                    variant={currentPage === i + 1 ? "default" : "ghost"}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-lg ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                                >
                                    {i + 1}
                                </Button>
                            ))}

                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24 space-y-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Search for questions..." className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/10 transition-all" />
                            </div>

                            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4">Popular roles</h3>
                                <div className="flex flex-wrap gap-2">
                                    {["Product Manager", "Software Engineer", "TPM", "Data Engineer", "Data Scientist"].map(role => (
                                        <Badge key={role} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg border-none cursor-pointer font-medium">
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-800">Interviewed recently?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed italic">
                                    Help the community and earn points by sharing your interview details.
                                </p>
                                <Button variant="outline" className="w-full h-11 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all font-semibold">
                                    + Share experience
                                </Button>
                            </Card>

                            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4">Trending companies</h3>
                                <div className="space-y-4">
                                    {["Meta", "Google", "Amazon", "Microsoft", "DoorDash", "Apple"].map(c => (
                                        <CompanyRow key={c} name={c} logo={c[0]} />
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// --- SUB COMPONENTS (GIỮ NGUYÊN STYLE ĐẸP) ---

function FilterDropdown({ label }: { label: string }) {
    return (
        <Button variant="outline" className="rounded-lg border-slate-200 text-slate-700 font-medium hover:border-indigo-300">
            {label} <ChevronDown className="ml-2 w-4 h-4 text-slate-400" />
        </Button>
    );
}

function FeaturedSmallCard({ title, icon, bgColor }: { title: string, icon: React.ReactNode, bgColor: string }) {
    return (
        <Card className="flex items-center gap-4 p-4 min-w-[320px] rounded-2xl border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all group">
            <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <span className="text-sm font-bold text-slate-700 leading-tight">{title}</span>
        </Card>
    );
}

function QuestionCard({ askedAt, timeAgo, title, tags, answers, hasVideo, codeSnippet }: any) {
    return (
        <Card className="p-6 border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all rounded-2xl group cursor-pointer relative overflow-hidden">
            <div className="flex justify-between gap-6">
                <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        <span className="text-indigo-600 text-lg">∞</span>
                        <span>Asked at <span className="text-slate-900">{askedAt}</span></span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                        {title}
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {tags.map((t: string) => (
                            <Badge key={t} variant="outline" className="text-slate-500 rounded-md border-slate-200 font-medium bg-white">
                                {t}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                        <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                            <Bookmark className="w-4 h-4" /> Save
                        </button>
                        <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                            <MessageCircle className="w-4 h-4" /> {answers} answers
                        </button>
                        <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                            <PlusCircle className="w-4 h-4" /> I was asked this
                        </button>
                    </div>
                </div>

                {hasVideo && (
                    <div className="relative w-44 h-28 rounded-2xl overflow-hidden shadow-lg shrink-0 group/video">
                        <img src={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80`} className="w-full h-full object-cover transition-transform group-hover/video:scale-110" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                <PlayCircle className="w-8 h-8 text-white fill-indigo-600" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ANSWER SNIPPET BOX */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
                <div className="flex -space-x-2 shrink-0">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                            <img src={`https://i.pravatar.cc/150?u=${i + askedAt}`} />
                        </div>
                    ))}
                </div>
                <p className="text-[13px] text-slate-500 font-mono line-clamp-1 italic flex-1 truncate">
                    "{codeSnippet}"
                </p>
                <ChevronDown className="w-4 h-4 text-slate-300" />
            </div>
        </Card>
    );
}

function CompanyRow({ name, logo }: { name: string, logo: string }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-indigo-600 text-sm border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                    {logo}
                </div>
                <span className="text-sm font-bold text-slate-700">{name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
        </div>
    );
}