import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../components/PlaceholderPage';
import { BookOpen } from 'lucide-react';

export default function Practice() {
    const { t } = useTranslation();

    return (
        <PlaceholderPage
            title={t('practice.title')}
            description="Practice your coding and system design interview questions with our interactive platform"
            icon={<BookOpen className="h-12 w-12 text-blue-500" />}
        />
    );
}
