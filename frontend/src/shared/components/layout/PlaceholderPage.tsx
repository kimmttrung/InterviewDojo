import { Layout } from './Layout';
import { Card } from '../ui/card';
import { AlertCircle } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto p-12 text-center">
          <div className="flex justify-center mb-6">
            {icon ? (
              <div className="text-5xl">{icon}</div>
            ) : (
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
          {description && <p className="text-muted-foreground mb-6">{description}</p>}
          <p className="text-sm text-muted-foreground">
            This page is under development. Feel free to prompt to continue building this feature!
          </p>
        </Card>
      </div>
    </Layout>
  );
}
