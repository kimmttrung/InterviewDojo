import { useEffect, useState } from "react";
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
    Code2, Cpu, Cloud, Shield, Terminal, Zap, Loader2
} from "lucide-react";
import { userService } from "../../services/user.service";
import { showToast } from "../../lib/toast";

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
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // State cho Form edit
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        target_role: "",
        experience_years: 0,
    });

    // 1. Lấy dữ liệu profile khi vào trang
    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await userService.getMe();
            // Data từ NestJS có thể nằm trong res.data hoặc res trực tiếp tùy axios config
            const data = res.data || res; 
            setUserData(data);
            
            // Cập nhật giá trị vào form
            setFormData({
                name: data.name || "",
                bio: data.bio || "",
                target_role: data.target_role || "",
                experience_years: Number(data.experience_years) || 0,
            });
        } catch (error) {
            showToast.error("Could not load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // 2. Xử lý cập nhật
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsUpdating(true);
            
            // Ép kiểu dữ liệu chuẩn xác trước khi gửi
            const payload = {
                ...formData,
                experience_years: Number(formData.experience_years)
            };

            const res = await userService.updateProfile(payload);
            
            if (res) {
                showToast.success("Profile updated successfully!");
                await fetchProfile(); // Tải lại dữ liệu mới
                setIsEditOpen(false);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message;
            showToast.error(Array.isArray(msg) ? msg[0] : msg || "Update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </Layout>
        );
    }

    const currentRoleInfo = TARGET_ROLES.find(r => r.name === userData?.target_role);

    return (
        <Layout>
            <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full shadow-lg gap-2 bg-slate-900 text-white hover:bg-slate-800">
                                <Settings className="h-4 w-4" /> Edit Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-white border-none shadow-2xl">
                            <form onSubmit={handleUpdateProfile}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">Update Profile</DialogTitle>
                                </DialogHeader>

                                <div className="grid gap-6 py-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold text-slate-500">Full Name</Label>
                                            <Input 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="bg-slate-50 border-slate-200" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold text-slate-500">Email (Read-only)</Label>
                                            <Input value={userData?.email} disabled className="bg-slate-100 border-dashed text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-slate-500">Bio</Label>
                                        <Textarea 
                                            value={formData.bio} 
                                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                            rows={3} 
                                            className="bg-slate-50 border-slate-200" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-bold text-slate-500">Target Role</Label>
                                            <Select 
                                                value={formData.target_role} 
                                                onValueChange={(val) => setFormData({...formData, target_role: val})}
                                            >
                                                <SelectTrigger className="w-full bg-white border-slate-200">
                                                    <SelectValue placeholder="Select target role" />
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
                                            <Label className="text-xs uppercase font-bold text-slate-500">Experience (Years)</Label>
                                            <Input 
                                                type="number" 
                                                value={formData.experience_years} 
                                                onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                                                className="bg-slate-50 border-slate-200" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="pt-4 border-t gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>Cancel</Button>
                                    <Button type="submit" className="bg-slate-900 text-white px-8" disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
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
                                <Avatar className="h-28 w-28 ring-4 ring-slate-100 shadow-inner">
                                    <AvatarImage src={userData?.avatar_url} />
                                    <AvatarFallback className="bg-slate-200 text-slate-600 text-2xl font-bold">
                                        {userData?.name?.substring(0,2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{userData?.name}</h2>
                                    <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600">CANDIDATE</Badge>
                                </div>
                                <p className="text-sm text-slate-500 italic">
                                    {userData?.bio || "No bio yet..."}
                                </p>
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
                                    value={userData?.target_role || "Not set"}
                                    color={currentRoleInfo?.color || "text-slate-400"}
                                />
                                <CareerItem icon={GraduationCap} label="Exp" value={`${userData?.experience_years || 0} Years`} color="text-blue-500" />
                                <CareerItem icon={Award} label="Level" value={userData?.current_level} color="text-amber-500" isBadge />
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

                            {userData?.skills && userData.skills.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    {userData.skills.map((skill: any, idx: number) => (
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
                            ) : (
                                <div className="text-center py-20 text-slate-400 italic">
                                    No skills found. Start an interview to assess your skills.
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

const CareerItem = ({ icon: IconComponent, label, value, color, isBadge }: any) => (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
        <div className="flex items-center gap-3">
            <div className={`${color} p-2 rounded-lg bg-slate-100/50`}>
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