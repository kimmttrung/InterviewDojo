import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import {
  Code2,
  Database,
  Cpu,
  Cloud,
  Palette,
  Terminal,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { showToast } from '../../../lib/toast';
import { userService } from '../../../services/user.service';

interface Role {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function SelectTargetRole() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roles: Role[] = [
    {
      id: 'backend',
      name: 'Backend Development',
      description: 'APIs, databases, server-side architecture',
      icon: <Database className="h-8 w-8" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'frontend',
      name: 'Frontend Development',
      description: 'React, Vue, Angular, UI/UX implementation',
      icon: <Palette className="h-8 w-8" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 'fullstack',
      name: 'Full Stack Development',
      description: 'Both front and back-end technologies',
      icon: <Code2 className="h-8 w-8" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'datascience',
      name: 'Data Science',
      description: 'ML, data analysis, Python, statistics',
      icon: <Cpu className="h-8 w-8" />,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'devops',
      name: 'DevOps & Cloud',
      description: 'AWS, Kubernetes, CI/CD, infrastructure',
      icon: <Cloud className="h-8 w-8" />,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      id: 'security',
      name: 'Security Engineer',
      description: 'Cybersecurity, system security, penetration testing',
      icon: <Shield className="h-8 w-8" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      id: 'sde',
      name: 'Software Engineer',
      description: 'System design, algorithms, general SWE',
      icon: <Terminal className="h-8 w-8" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      id: 'embedded',
      name: 'Embedded Systems',
      description: 'IoT, C/C++, hardware programming',
      icon: <Zap className="h-8 w-8" />,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ];
  const handleRoleSelect = async (roleId: string) => {
    const selectedRole = roles.find((r) => r.id === roleId);
    if (!selectedRole) return;
  };

  return (
    /* 1. Nền trắng hoàn toàn (slate-50 tạo cảm giác sạch sẽ hơn là trắng tinh) */
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header - Bỏ dark mode class để luôn trắng */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white font-bold">
              ID
            </div>
            <h1 className="text-xl font-bold text-slate-900">InterviewDojo</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          {/* Chữ đen đậm text-slate-900 */}
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            What's your interview target?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select your desired role to get personalized interview preparation. You can change this
            later.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {roles.map((role) => (
            <button key={role.id} onClick={() => handleRoleSelect(role.id)} className="group">
              {/* Card: Nền trắng, viền xám nhạt, chữ đen */}
              <Card className="h-full p-6 cursor-pointer bg-white border-slate-200 transition-all hover:shadow-md hover:border-slate-900 hover:scale-105 text-left">
                {/* Icon container - giữ lại màu sắc nhẹ nhàng của role nhưng tăng độ tương phản */}
                <div
                  className={`${role.bgColor} ${role.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}
                >
                  {role.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-tight">
                  {role.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
              </Card>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-sm text-slate-400 italic">
            Don't worry, you can update your target role anytime in settings.
          </p>
        </div>
        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1 mx-auto transition-all"
          >
            I'll decide later
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
