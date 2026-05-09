// src/pages/InterviewRoom.tsx
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';

import { InterviewHeader } from '../components/InterviewHeader';
import { QuestionPanel } from '../components/QuestionPanel';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { VideoCallSection } from '../components/VideoCallSection';
import { ChatAndNotes } from '../components/ChatAndNotes';
import { useVideoCall } from '../../../../../../hooks/useVideoCall';
import { useQuestions } from '../../../../../../hooks/useQuestions';
import { useLocalStorage } from '../../../../../../hooks/useLocalStorage';
import { useSocketStore } from '../../../../../../stores/useSocketStore';
import { WorkMode } from '../../../../../../shared/types/interview';
import { QuestionType } from '../../../../../shared-domain/question-bank/types';

export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  // State quản lý filter
  const [selectedType, setSelectedType] = useState<QuestionType | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();

  const userStore = localStorage.getItem('user');
  const currentUser = userStore ? JSON.parse(userStore) : null;
  const userId = currentUser?.id?.toString() || searchParams.get('userId') || 'guest';
  const token = searchParams.get('token');
  const { client, call } = useVideoCall(roomId, token, userId, currentUser);
  const { currentQuestion, setCurrentQuestion, getRandomQuestion, isLoading } = useQuestions();
  const [workMode, setWorkMode] = useLocalStorage<WorkMode>('workMode', 'code');

  // Lấy các hàm từ Zustand Socket Store
  const { emit, socket } = useSocketStore();

  useEffect(() => {
    const handleReceiveQuestion = (data: any) => {
      console.log('📥 Nhận câu hỏi từ đối phương:', data);

      // 1. Cập nhật câu hỏi (có thể là object hoặc null)
      setCurrentQuestion(data.question);
    };
    socket?.on('receive_question', handleReceiveQuestion);

    socket?.on('sync_filters', (data: { type?: QuestionType; difficulty?: string }) => {
      setSelectedType(data.type);
      setSelectedDifficulty(data.difficulty);
    });

    return () => {
      socket?.off('receive_question', handleReceiveQuestion);
      socket?.off('sync_filters');
    };
  }, [socket, setCurrentQuestion]);

  const handleTypeChange = (type?: QuestionType) => {
    setSelectedType(type);
    emit('update_filters', { roomId, type, difficulty: selectedDifficulty });
  };

  const handleDifficultyChange = (difficulty?: string) => {
    setSelectedDifficulty(difficulty);
    emit('update_filters', { roomId, type: selectedType, difficulty });
  };

  const handleRandom = async (type?: QuestionType, difficulty?: string) => {
    const question = await getRandomQuestion(type, difficulty);

    emit('send_question', {
      roomId,
      question: question || null,
    });
  };

  useEffect(() => {
    return () => {
      console.log('🧹 Dọn dẹp dữ liệu phòng phỏng vấn...');
      localStorage.removeItem('workMode');
      localStorage.removeItem('questionMode');
      localStorage.removeItem('whiteboard_shapes');
    };
  }, []);

  if (!client || !call) {
    return <InterviewLoading roomId={roomId} />;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="h-screen flex flex-col bg-white overflow-hidden">
          <InterviewHeader roomId={roomId!} />

          <main className="flex-1 flex overflow-hidden">
            <QuestionPanel
              question={currentQuestion}
              onRandom={handleRandom}
              isLoading={isLoading}
              selectedType={selectedType}
              selectedDifficulty={selectedDifficulty}
              onTypeChange={handleTypeChange}
              onDifficultyChange={handleDifficultyChange}
            />

            <WorkspaceTabs
              workMode={workMode}
              setWorkMode={setWorkMode}
              currentQuestion={currentQuestion}
              roomId={roomId!}
              userId={userId}
            />

            <aside className="w-1/4 flex flex-col bg-slate-50 border-l border-slate-200 overflow-hidden">
              <VideoCallSection />
              <ChatAndNotes />
            </aside>
          </main>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}

// Component loading
function InterviewLoading({ roomId }: { roomId?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm font-medium animate-pulse">Đang thiết lập kết nối Video...</p>
      <p className="text-[10px] text-slate-500">Room ID: {roomId}</p>
    </div>
  );
}
