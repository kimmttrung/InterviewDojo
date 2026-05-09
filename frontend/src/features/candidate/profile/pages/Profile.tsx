import { useEffect, useState } from 'react';
import { Card } from '../../../../shared/components/ui/card';
import { Badge } from '../../../../shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../shared/components/ui/avatar';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { Textarea } from '../../../../shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../../../shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../shared/components/ui/select';
import {
  User,
  Target,
  Briefcase,
  GraduationCap,
  Settings,
  Award,
  Database,
  Palette,
  Code2,
  Cpu,
  Cloud,
  Shield,
  Terminal,
  Zap,
  Loader2,
} from 'lucide-react';
import { showToast } from '../../../../shared/lib/toast';
import { Button } from '../../../../shared/components/ui/button';
import { AvatarUpload } from '@/shared/components/ui/avatar-upload';

import { targetRoleService } from '../../target-role/services/target-role.service';
import { userService } from '../../../auth/services/user.service';
import { Layout } from '../../../../shared/components/layout/Layout';
import { TargetRole } from '../../target-role/types/target-role.type';
import { useCurrentUser } from '@/features/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ROLE_UI_MAP: any = {
  'Backend Development': { icon: Database, color: 'text-blue-500' },
  'Frontend Development': { icon: Palette, color: 'text-purple-500' },
  'Full Stack Development': { icon: Code2, color: 'text-green-500' },
  'Data Science': { icon: Cpu, color: 'text-orange-500' },
  'DevOps & Cloud': { icon: Cloud, color: 'text-cyan-500' },
  'Security Engineer': { icon: Shield, color: 'text-red-500' },
  'Software Engineer': { icon: Terminal, color: 'text-indigo-500' },
  'Embedded Systems': { icon: Zap, color: 'text-yellow-500' },
  'AI Engineer': { icon: Cpu, color: 'text-pink-500' },
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useCurrentUser();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state dùng camelCase
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    targetRoleId: null as number | null,
    experienceYears: 0,
  });

  // Lấy danh sách target roles
  const { data: targetRoles = [] } = useQuery<TargetRole[]>({
    queryKey: ['targetRoles'],
    queryFn: async (): Promise<TargetRole[]> => {
      const res = await targetRoleService.getAll();
      return res.data.data as TargetRole[];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Khi user load, cập nhật form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        targetRoleId: user.targetRoleId || null, // nếu backend trả về targetRoleId, không thì tùy chỉnh
        experienceYears: Number(user.experienceYears) || 0,
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);

      // Payload gửi đi vẫn có thể là snake_case hoặc camelCase tùy DTO backend.
      // Hiện tại backend UpdateUserDto dùng snake_case? Nếu có, ta mapping:
      const payload = {
        name: formData.name,
        bio: formData.bio,
        target_role_id: formData.targetRoleId,
        experience_years: formData.experienceYears,
      };

      // Gọi API update, backend trả về user đã cập nhật
      const updatedUser = await userService.updateProfile(payload);

      // Cập nhật cache ngay lập tức
      queryClient.setQueryData(['current-user'], updatedUser);
      //fetch lại để đảm bảo với server
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      showToast.success('Profile updated successfully!');

      setIsEditOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      showToast.error(Array.isArray(msg) ? msg[0] : msg || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center text-red-500">
          Failed to load profile.
        </div>
      </Layout>
    );
  }

  const currentRoleInfo = ROLE_UI_MAP[user.targetRole];

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
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    Update Profile
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-500">
                        Full Name
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-500">
                        Email (Read-only)
                      </Label>
                      <Input
                        value={user.email}
                        disabled
                        className="bg-slate-100 border-dashed text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Bio</Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-500">
                        Target Role
                      </Label>
                      <Select
                        value={formData.targetRoleId?.toString()}
                        onValueChange={(val) =>
                          setFormData({ ...formData, targetRoleId: Number(val) })
                        }
                      >
                        <SelectTrigger className="w-full bg-white border-slate-200">
                          <SelectValue placeholder="Select target role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {targetRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-500">
                        Experience (Years)
                      </Label>
                      <Input
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experienceYears: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-900 text-white px-8"
                    disabled={isUpdating}
                  >
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
                <AvatarUpload size="lg" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                  <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 italic">{user.bio || 'No bio yet...'}</p>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-lg bg-white/80 backdrop-blur-md">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4 text-slate-900">
                <Briefcase className="h-5 w-5 text-indigo-500" /> Career Journey
              </h3>
              <div className="space-y-3">
                <CareerItem
                  icon={currentRoleInfo?.icon || Target}
                  label="Target Role"
                  value={user.targetRole || 'Not set'}
                  color={currentRoleInfo?.color || 'text-slate-400'}
                />
                <CareerItem
                  icon={GraduationCap}
                  label="Exp"
                  value={`${user.experienceYears || 0} Years`}
                  color="text-blue-500"
                />
                <CareerItem
                  icon={Award}
                  label="Level"
                  value={user.currentLevel}
                  color="text-amber-500"
                  isBadge
                />
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
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Skill Competency Levels
                </p>
              </div>

              {user.skills && user.skills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {user.skills.map((skill: any, idx: number) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                            {skill.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] block py-0 px-1 opacity-70"
                          >
                            {skill.category}
                          </Badge>
                        </div>
                        <span className="text-sm font-black text-slate-900">{skill.score}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 transition-all duration-1000"
                          style={{ width: `${skill.score}%` }}
                        />
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
