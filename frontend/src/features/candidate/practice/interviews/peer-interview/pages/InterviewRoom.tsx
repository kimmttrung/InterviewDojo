// features/candidate/practice/interviews/peer-interview/pages/InterviewRoom.tsx
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useCallback, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';

import { InterviewHeader } from '../components/InterviewHeader';
import { QuestionPanel } from '../components/QuestionPanel';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { VideoCallSection } from '../components/VideoCallSection';
import { ChatAndNotes } from '../components/ChatAndNotes';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useQuestions } from '@/hooks/useQuestions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSocketStore } from '@/stores/useSocketStore';
import { useCurrentUser } from '@/features/auth'; // ✅ import hook
import { WorkMode } from '@/shared/types/interview';

export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const userId = currentUser?.id?.toString() || searchParams.get('userId') || 'guest';
  const token = searchParams.get('token');

  const { client, call } = useVideoCall(roomId, token, userId, currentUser);

  const {
    codingQuestions,
    currentQuestion,
    isLoading,
    setCurrentQuestion,
    fetchQuestions,
    getRandomQuestion,
    setIsLoading,
  } = useQuestions();

  const [workMode, setWorkMode] = useLocalStorage<WorkMode>('workMode', 'code');
  const [questionMode, setQuestionMode] = useLocalStorage<'code' | 'theory'>(
    'questionMode',
    'code',
  );

  const { connect, joinRoom, emit, socket } = useSocketStore();

  // ==================== SOCKET CONNECTION ====================
  useEffect(() => {
    if (!userId || !roomId) return;
    connect(userId);
    joinRoom(roomId);

    const handleReceiveQuestion = (data: { question: any; mode: 'code' | 'theory' }) => {
      setCurrentQuestion(data.question);
      setQuestionMode(data.mode);
      setWorkMode(data.mode === 'code' ? 'code' : 'theory');
    };

    socket?.on('receive_question', handleReceiveQuestion);
    return () => {
      socket?.off('receive_question', handleReceiveQuestion);
    };
  }, [userId, roomId, socket, connect, joinRoom, setCurrentQuestion, setQuestionMode, setWorkMode]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleRandom = useCallback(
    (type: 'code' | 'theory') => {
      const question = getRandomQuestion(type);
      if (!question) return;
      console.log('question:', question);
      setCurrentQuestion(question);
      setQuestionMode(type);
      setWorkMode(type === 'code' ? 'code' : 'theory');
      emit('send_question', { roomId, question, mode: type });
    },
    [getRandomQuestion, setCurrentQuestion, setQuestionMode, setWorkMode, emit, roomId],
  );

  useEffect(() => {
    return () => {
      console.log('🧹 Dọn dẹp dữ liệu phòng phỏng vấn...');
      localStorage.removeItem('workMode');
      localStorage.removeItem('questionMode');
      localStorage.removeItem('whiteboard_shapes');
    };
  }, []);

  // ✅ Hiển thị loading khi đang fetch user (tránh gọi useVideoCall với userId chưa sẵn sàng)
  if (isUserLoading || !client || !call) {
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
              mode={questionMode}
              onRandom={handleRandom}
              isLoading={isLoading}
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

function InterviewLoading({ roomId }: { roomId?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm font-medium animate-pulse">Đang thiết lập kết nối Video...</p>
      <p className="text-[10px] text-slate-500">Room ID: {roomId}</p>
    </div>
  );
}
