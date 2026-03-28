import { useTranslation } from 'react-i18next';
import { Layout } from '../../../components/Layout';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Activity, TrendingUp, Flame, AlertCircle } from 'lucide-react';

const chartData = [
    { date: 'Jan', score: 65 },
    { date: 'Feb', score: 72 },
    { date: 'Mar', score: 68 },
    { date: 'Apr', score: 81 },
    { date: 'May', score: 78 },
    { date: 'Jun', score: 88 },
    { date: 'Jul', score: 92 },
];

export default function Dashboard() {
    const { t } = useTranslation();

    const stats = [
        {
            label: t('dashboard.stats.totalInterviews'),
            value: '24',
            subtext: t('dashboard.stats.completed'),
            icon: Activity,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        },
        {
            label: t('dashboard.stats.averageScore'),
            value: '82%',
            subtext: '+5% from last week',
            icon: TrendingUp,
            color: 'bg-green-500/10 text-green-600 dark:text-green-400',
        },
        {
            label: t('dashboard.stats.practiceStreak'),
            value: '12',
            subtext: t('dashboard.stats.days'),
            icon: Flame,
            color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        },
        {
            label: t('dashboard.stats.weakestSkill'),
            value: 'System Design',
            subtext: t('dashboard.stats.improved'),
            icon: AlertCircle,
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        },
    ];

    return (
        <Layout>
            <div className="p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('dashboard.welcome', { name: 'User' })}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            {stat.label}
                                        </p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {stat.subtext}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${stat.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Progress Chart */}
                    <Card className="lg:col-span-2 p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            {t('dashboard.progress')}
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="hsl(var(--primary))"
                                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                        activeDot={{ r: 6 }}
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </Card>

                    {/* Recent Sessions */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            {t('dashboard.recentSessions')}
                        </h2>
                        <div className="space-y-3">
                            {[
                                { date: 'Today', score: 92, status: 'Excellent' },
                                { date: 'Yesterday', score: 87, status: 'Good' },
                                { date: '2 days ago', score: 78, status: 'Good' },
                            ].map((session, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {session.date}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Score: {session.score}%
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                                        {session.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
