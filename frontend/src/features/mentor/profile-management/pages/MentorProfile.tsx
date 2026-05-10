import { useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { MentorLayout } from '../../dashboard/components/MentorLayout';
import { Card } from '../../../../shared/components/ui/card';
import { Input } from '../../../../shared/components/ui/input';
import { Textarea } from '../../../../shared/components/ui/textarea';
import { Button } from '../../../../shared/components/ui/button';
import { showToast } from '../../../../shared/lib/toast';
import { mentorService } from '../../../auth/services/mentor.service';
export default function MentorProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: 'Your full name',
    title: 'Your current title (e.g. Senior Backend @ FPT)',
    bio: 'Type a short bio about yourself, your expertise, what mentees can expect from you...',
    experienceYears: 'Show me your experience in years (e.g. 5)',
    // pricing: {
    //   p30: { enabled: true, price: 10 },
    //   p60: { enabled: true, price: 20 },
    //   p120: { enabled: false, price: 35 },
    //   session: { enabled: true, price: 50 },
    // },
    cvUrl: 'Upload your CV to attract more mentees',
    certificateUrl: ' Upload your certificates to build trust with mentees',
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Xử lý ép kiểu dữ liệu chuẩn trước khi gửi
      const payload = {
        ...form,
        experienceYears: Number(form.experienceYears),
      };

      const res = await mentorService.updateProfile(payload);

      if (res.data?.success || res.status === 200) {
        showToast.success('Cập nhật hồ sơ Mentor thành công!');
      }
    } catch (error: any) {
      console.error(error);
      showToast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MentorLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Mentor Profile</h1>
          <p className="text-muted-foreground">
            Update your information to attract more candidates
          </p>
        </div>

        {/* BASIC INFO */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Basic Info</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ và tên</label>
              <Input
                placeholder="Ví dụ: Mai Trung"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số năm kinh nghiệm</label>
              <Input
                type="number"
                min="0"
                placeholder="Ví dụ: 5"
                value={form.experienceYears}
                onChange={(e) => handleChange('experienceYears', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* BIO */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">About You (Giới thiệu bản thân & Kinh nghiệm)</h2>
          <p className="text-sm text-muted-foreground">
            Hãy giới thiệu ngắn gọn về bản thân, các công ty từng làm việc và những gì ứng viên có
            thể học được từ bạn.
          </p>
          <Textarea
            placeholder="Introduce yourself, your strengths, tech stack..."
            value={form.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={6}
          />
        </Card>

        {/* CV / Certificates Section */}
        <Card className="p-6 space-y-6">
          <h2 className="font-semibold text-lg border-bottom pb-2">Hồ sơ năng lực (URLs)</h2>

          <div className="space-y-4">
            {/* Phần CV */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link CV (Google Drive, Dropbox...)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Dán link CV của bạn tại đây"
                  value={form.cvUrl} // Đã bỏ comment
                  onChange={(e) => handleChange('cvUrl', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!form.cvUrl}
                  onClick={() => window.open(form.cvUrl, '_blank')}
                  title="Xem CV"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Phần Chứng chỉ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Chứng chỉ (Certificates)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Dán link chứng chỉ của bạn tại đây"
                  value={form.certificateUrl} // Đã bỏ comment
                  onChange={(e) => handleChange('certificateUrl', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!form.certificateUrl}
                  onClick={() => window.open(form.certificateUrl, '_blank')}
                  title="Xem chứng chỉ"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ACTION */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </MentorLayout>
  );
}
