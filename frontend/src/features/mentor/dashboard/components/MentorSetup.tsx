import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FileText, Award, ArrowRight, Loader2 } from 'lucide-react';
import { showToast } from '../../../../shared/lib/toast';
import { userService } from '../../../candidate/profile/services/profile.service';

export default function MentorSetup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cvUrl: '',
    certificateUrl: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await userService.createMentorProfile({
        cvUrl: formData.cvUrl || undefined,
        certificateUrl: formData.certificateUrl || undefined,
      });

      showToast.success('Profile submitted! Waiting for approval.');

      // 🎯 redirect về home
      navigate('/mentor/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      showToast.error(Array.isArray(msg) ? msg[0] : msg || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HEADER */}
      <div className="border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded-lg font-bold">
            ID
          </div>
          <h1 className="font-bold text-lg">InterviewDojo</h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Setup Your Mentor Profile</h2>
          <p className="text-slate-500">Add your CV and certifications to start mentoring</p>
        </div>

        <Card className="p-8 shadow-md border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CV */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">CV URL</Label>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <Input
                  placeholder="https://your-cv-link.com"
                  value={formData.cvUrl}
                  onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Certificate */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Certificate URL</Label>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-slate-400" />
                <Input
                  placeholder="https://your-certificate.com"
                  value={formData.certificateUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificateUrl: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/mentor/dashboard')}
                className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                Skip for now <ArrowRight className="w-4 h-4" />
              </button>

              <Button type="submit" className="bg-slate-900 text-white px-6" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Note */}
        <p className="text-center text-xs text-slate-400 mt-6 italic">
          Your profile will be reviewed by staff before being published.
        </p>
      </div>
    </div>
  );
}
