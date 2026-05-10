// features/candidate/practice/interviews/peer-interview/pages/InterviewRoom.tsx
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
import { QuestionType } from '../../../../../shared-domain/question-bank/types/question.types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCurrentUser } from '@/features/auth';
import { useRandomQuestion } from '@/features/shared-domain/question-bank/hooks/useQuestions';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();

  // Lấy userId từ auth store (ưu tiên) hoặc từ query param
  const { userId: authUserId, isAuthenticated } = useAuthStore();
  const { data: currentUser } = useCurrentUser();
  const userId =
    isAuthenticated && authUserId ? String(authUserId) : searchParams.get('userId') || 'guest';
  const token = searchParams.get('token');

  // Filter state (client state) – có thể sync qua socket
  const [selectedType, setSelectedType] = useState<QuestionType | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [displayedQuestion, setDisplayedQuestion] = useState<any>(null);

  // Random question hook
  const {
    data: randomQuestion,
    refetch,
    isFetching,
  } = useRandomQuestion({
    type: selectedType,
    difficulty: selectedDifficulty as any,
  });

  // Cập nhật displayedQuestion khi random thành công
  useEffect(() => {
    if (randomQuestion) {
      setDisplayedQuestion(randomQuestion);
    }
  }, [randomQuestion]);

  // currentQuestion sẽ lấy từ randomQuestion hoặc null
  const currentQuestion = randomQuestion || null;
  const isLoading = isFetching;

  // Lấy các hàm từ Zustand Socket Store
  const { client, call } = useVideoCall(roomId, token, userId, currentUser);
  const [workMode, setWorkMode] = useLocalStorage<WorkMode>('workMode', 'code');
  const { emit, socket } = useSocketStore();

  // Socket listeners
  useEffect(() => {
    const handleReceiveQuestion = (data: any) => {
      console.log('📥 Nhận câu hỏi từ đối phương:', data);
      setDisplayedQuestion(data.question); // hiển thị câu hỏi nhận được
    };

    const handleSyncFilters = (data: { type?: QuestionType; difficulty?: string }) => {
      setSelectedType(data.type);
      setSelectedDifficulty(data.difficulty);
    };

    socket?.on('receive_question', handleReceiveQuestion);
    socket?.on('sync_filters', handleSyncFilters);

    return () => {
      socket?.off('receive_question', handleReceiveQuestion);
      socket?.off('sync_filters', handleSyncFilters);
    };
  }, [socket]);

  const handleTypeChange = (type?: QuestionType) => {
    setSelectedType(type);
    emit('update_filters', { roomId, type, difficulty: selectedDifficulty });
  };

  const handleDifficultyChange = (difficulty?: string) => {
    setSelectedDifficulty(difficulty);
    emit('update_filters', { roomId, type: selectedType, difficulty });
  };

  // Xử lý random: gọi API, sau đó gửi câu hỏi qua socket
  const handleRandom = async () => {
    const result = await refetch();
    const question = result.data ?? null;
    setDisplayedQuestion(question);
    emit('send_question', { roomId, question });
  };

  useEffect(() => {
    return () => {
      console.log('🧹 Dọn dẹp dữ liệu phòng phỏng vấn...');
      localStorage.removeItem('workMode');
      localStorage.removeItem('questionMode');
      localStorage.removeItem('whiteboard_shapes');
    };
  }, []);

  // ✅ Hiển thị loading khi đang fetch user (tránh gọi useVideoCall với userId chưa sẵn sàng)
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
              question={displayedQuestion}
              onRandom={handleRandom}
              isLoading={isFetching}
              selectedType={selectedType}
              selectedDifficulty={selectedDifficulty}
              onTypeChange={handleTypeChange}
              onDifficultyChange={handleDifficultyChange}
            />
            <WorkspaceTabs
              workMode={workMode}
              setWorkMode={setWorkMode}
              currentQuestion={displayedQuestion}
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

function InterviewLoading({ roomId }: { roomId?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm font-medium animate-pulse">Đang thiết lập kết nối Video...</p>
      <p className="text-[10px] text-slate-500">Room ID: {roomId}</p>
    </div>
  );
}
