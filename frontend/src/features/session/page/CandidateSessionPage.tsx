// src/features/session/pages/CandidateSessionsPage.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { SessionFilters } from '../components/SessionFilters';
import { SessionListByType } from '../components/SessionListByType';
import { RefreshCw } from 'lucide-react';
import { useSessionsByType } from '../hooks/useSessionByType';
import { Button } from '@/shared/components/ui/button';
import { useState } from 'react';
import { Layout } from '@/shared/components/layout/Layout';
export default function CandidateSessionsPage() {
  const [activeTab, setActiveTab] = useState('mentor');
  const mentorQuery = useSessionsByType('MENTOR_BOOKING');
  const p2pQuery = useSessionsByType('P2P_MATCH');
  const soloQuery = useSessionsByType('SOLO');

  const handleRefresh = () => {
    if (activeTab === 'mentor') mentorQuery.refetch();
    else if (activeTab === 'p2p') p2pQuery.refetch();
    else soloQuery.refetch();
  };

  const isRefreshing =
    (activeTab === 'mentor' && mentorQuery.isRefetching) ||
    (activeTab === 'p2p' && p2pQuery.isRefetching) ||
    (activeTab === 'solo' && soloQuery.isRefetching);

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Sessions</h1>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mentor">Mentor Sessions</TabsTrigger>
            <TabsTrigger value="p2p">P2P Sessions</TabsTrigger>
            <TabsTrigger value="solo">Solo Sessions</TabsTrigger>
          </TabsList>
          <TabsContent value="mentor">
            <SessionFilters type="MENTOR_BOOKING" />
            <SessionListByType type="MENTOR_BOOKING" />
          </TabsContent>
          <TabsContent value="p2p">
            <SessionFilters type="P2P_MATCH" />
            <SessionListByType type="P2P_MATCH" />
          </TabsContent>
          <TabsContent value="solo">
            <SessionFilters type="SOLO" />
            <SessionListByType type="SOLO" />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
