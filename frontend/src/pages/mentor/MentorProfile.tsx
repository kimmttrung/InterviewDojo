import { MentorLayout } from '../../../components/mentor/MentorLayout';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { useState } from 'react';
import { Eye } from 'lucide-react';

export default function MentorProfile() {
  const [form, setForm] = useState({
    name: 'Mai Trung',
    title: 'Senior Backend Developer',
    bio: '',
    experience: '',
    pricing: {
      p30: { enabled: true, price: 10 },
      p60: { enabled: true, price: 20 },
      p120: { enabled: false, price: 35 },
      session: { enabled: true, price: 50 },
    },
    cv: '',
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('SAVE PROFILE', form);
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
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />

            <Input
              placeholder="Title (e.g. Senior Backend @ FPT)"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>
        </Card>

        {/* BIO */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">About You</h2>

          <Textarea
            placeholder="Introduce yourself, your strengths, tech stack..."
            value={form.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
          />
        </Card>

        {/* EXPERIENCE */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Experience</h2>

          <Textarea
            placeholder="Describe your experience, projects, companies..."
            value={form.experience}
            onChange={(e) => handleChange('experience', e.target.value)}
            rows={4}
          />
        </Card>

        {/* PRICING */}
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Pricing</h2>

          {/* 30 MIN */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="font-medium">30 Minutes</p>
              <p className="text-xs text-muted-foreground">Quick mock / CV review</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pricing.p30.enabled}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    p30: { ...form.pricing.p30, enabled: e.target.checked },
                  })
                }
              />

              <Input
                type="number"
                disabled={!form.pricing.p30.enabled}
                value={form.pricing.p30.price}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    p30: { ...form.pricing.p30, price: Number(e.target.value) },
                  })
                }
                className="w-24"
              />

              <span>$</span>
            </div>
          </div>

          {/* 60 MIN */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="font-medium">60 Minutes</p>
              <p className="text-xs text-muted-foreground">Standard interview</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pricing.p60.enabled}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    p60: { ...form.pricing.p60, enabled: e.target.checked },
                  })
                }
              />

              <Input
                type="number"
                disabled={!form.pricing.p60.enabled}
                value={form.pricing.p60.price}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    p60: { ...form.pricing.p60, price: Number(e.target.value) },
                  })
                }
                className="w-24"
              />

              <span>$</span>
            </div>
          </div>

          {/* 120 MIN */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="font-medium">120 Minutes</p>
              <p className="text-xs text-muted-foreground">Deep system design</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pricing.p120.enabled}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    p120: { ...form.pricing.p120, enabled: e.target.checked },
                  })
                }
              />

              <Input
                type="number"
                disabled={!form.pricing.p120.enabled}
                value={form.pricing.p120.price}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    p120: { ...form.pricing.p120, price: Number(e.target.value) },
                  })
                }
                className="w-24"
              />

              <span>$</span>
            </div>
          </div>

          {/* FULL SESSION */}
          <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
            <div>
              <p className="font-medium">Full Session</p>
              <p className="text-xs text-muted-foreground">End-to-end interview + feedback</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pricing.session.enabled}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    session: { ...form.pricing.session, enabled: e.target.checked },
                  })
                }
              />

              <Input
                type="number"
                disabled={!form.pricing.session.enabled}
                value={form.pricing.session.price}
                onChange={(e) =>
                  handleChange('pricing', {
                    ...form.pricing,
                    session: { ...form.pricing.session, price: Number(e.target.value) },
                  })
                }
                className="w-24"
              />

              <span>$</span>
            </div>
          </div>
        </Card>

        {/* CV / Certificates Section */}
        <Card className="p-6 space-y-6">
          <h2 className="font-semibold text-lg border-bottom pb-2">Hồ sơ năng lực</h2>

          <div className="space-y-4">
            {/* Phần CV */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link CV (Google Drive, Dropbox...)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Dán link CV của bạn tại đây"
                  // value={form.cvUrl}
                  onChange={(e) => handleChange('cvUrl', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  // disabled={!form.cvUrl}
                  // onClick={() => window.open(form.cvUrl, '_blank')}
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
                  // value={form.certificateUrl}
                  onChange={(e) => handleChange('certificateUrl', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  // disabled={!form.certificateUrl}
                  // onClick={() => window.open(form.certificateUrl, '_blank')}
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
          <Button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600 text-white">
            Save Profile
          </Button>
        </div>
      </div>
    </MentorLayout>
  );
}
