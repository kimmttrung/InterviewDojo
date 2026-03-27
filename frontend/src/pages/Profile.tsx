import { useState } from "react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "../../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    User, Target, Briefcase, GraduationCap,
    Settings, Award, Database, Palette,
    Code2, Cpu, Cloud, Shield, Terminal, Zap, Save, X
} from "lucide-react";

// 1. MOCK DATA
const MOCK_USER = {
    name: "Alex Nguyen",
    email: "alex.nguyen@example.com",
    bio: "Đam mê xây dựng các hệ thống phân tán và trải nghiệm người dùng mượt mà. Hiện đang chinh phục thử thách Fullstack Developer.",
    avatar_url: "https://github.com/shadcn.png",
    target_role: "Full Stack Development",
    experience_years: 3,
    current_level: "Senior",
    skills: [
        { name: "ReactJS", category: "Frontend", score: 90 },
        { name: "Node.js", category: "Backend", score: 85 },
        { name: "PostgreSQL", category: "Database", score: 75 },
        { name: "TypeScript", category: "Language", score: 80 },
        { name: "Docker", category: "DevOps", score: 65 },
        { name: "System Design", category: "Architecture", score: 70 },
    ]
};

// 2. CẬP NHẬT: Chỉ truyền Component Icon (không truyền <JSX />)
const TARGET_ROLES = [
    { id: 'backend', name: 'Backend Development', icon: Database, color: 'text-blue-500' },
    { id: 'frontend', name: 'Frontend Development', icon: Palette, color: 'text-purple-500' },
    { id: 'fullstack', name: 'Full Stack Development', icon: Code2, color: 'text-green-500' },
    { id: 'datascience', name: 'Data Science', icon: Cpu, color: 'text-orange-500' },
    { id: 'devops', name: 'DevOps & Cloud', icon: Cloud, color: 'text-cyan-500' },
    { id: 'security', name: 'Security Engineer', icon: Shield, color: 'text-red-500' },
    { id: 'sde', name: 'Software Engineer', icon: Terminal, color: 'text-indigo-500' },
    { id: 'embedded', name: 'Embedded Systems', icon: Zap, color: 'text-yellow-500' },
];

export default function Profile() {
    const [userData] = useState(MOCK_USER);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(MOCK_USER.target_role);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditOpen(false);
    };

    // Tìm thông tin role hiện tại
    const currentRoleInfo = TARGET_ROLES.find(r => r.name === userData.target_role);

    return (
        <Layout>
            <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full shadow-lg gap-2">
                                <Settings className="h-4 w-4" /> Edit Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-white border-none shadow-2xl">
                            <form onSubmit={handleUpdateProfile}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Update Profile</DialogTitle>
                                </DialogHeader>

                                <div className="grid gap-6 py-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold">Full Name</Label>
                                            <Input defaultValue={userData.name} className="bg-slate-50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold">Email</Label>
                                            <Input value={userData.email} disabled className="bg-slate-100 border-dashed" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold">Bio</Label>
                                        <Textarea defaultValue={userData.bio} rows={3} className="bg-slate-50" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold">Target Role</Label>
                                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                                <SelectTrigger className="w-full bg-white">
                                                    <SelectValue placeholder="Chọn vị trí" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {TARGET_ROLES.map((role) => (
                                                        <SelectItem key={role.id} value={role.name}>
                                                            <span className="font-medium">{role.name}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold">Experience (Years)</Label>
                                            <Input type="number" defaultValue={userData.experience_years} className="bg-slate-50" />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="pt-4 border-t gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-slate-900 text-white px-8">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT SIDE */}
                    <div className="space-y-6">
                        <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-md">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Avatar className="h-28 w-28 ring-4 ring-slate-100">
                                    <AvatarImage src={userData.avatar_url} />
                                    <AvatarFallback>AN</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{userData.name}</h2>
                                    <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600">CANDIDATE</Badge>
                                </div>
                                <p className="text-sm text-slate-500 italic">"{userData.bio}"</p>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-lg bg-white/80 backdrop-blur-md">
                            <h3 className="font-bold text-lg flex items-center gap-2 mb-4 text-slate-900">
                                <Briefcase className="h-5 w-5 text-indigo-500" /> Career Journey
                            </h3>
                            <div className="space-y-3">
                                <CareerItem
                                    icon={currentRoleInfo?.icon || Target}
                                    label="Role"
                                    value={userData.target_role}
                                    color={currentRoleInfo?.color || "text-rose-500"}
                                />
                                <CareerItem icon={GraduationCap} label="Exp" value={`${userData.experience_years} Years`} color="text-blue-500" />
                                <CareerItem icon={Award} label="Level" value={userData.current_level} color="text-amber-500" isBadge />
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT SIDE: SKILLS */}
                    <div className="lg:col-span-2">
                        <Card className="p-8 border-none shadow-xl h-full bg-white/80 backdrop-blur-md">
                            <div className="mb-8 border-b pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                    <User className="h-5 w-5 text-blue-600" /> Technical Mastery
                                </h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Skill Competency Levels</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                {userData.skills.map((skill, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="space-y-1">
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{skill.name}</span>
                                                <Badge variant="outline" className="text-[9px] block py-0 px-1 opacity-70">{skill.category}</Badge>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{skill.score}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${skill.score}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// 3. CẬP NHẬT: Component CareerItem sử dụng Icon chuẩn
const CareerItem = ({ icon: IconComponent, label, value, color, isBadge }: any) => (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
        <div className="flex items-center gap-3">
            <div className={`${color} p-2 rounded-lg bg-slate-100/50`}>
                {/* Render Icon dưới dạng Component */}
                <IconComponent className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-slate-500">{label}</span>
        </div>
        {isBadge ? (
            <Badge className="bg-emerald-500 text-white font-bold">{value}</Badge>
        ) : (
            <span className="text-sm font-bold text-slate-900">{value}</span>
        )}
    </div>
);