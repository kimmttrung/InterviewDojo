// src/pages/InterviewRoom.tsx
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useQuestions } from '../../hooks/useQuestions';
import { InterviewHeader } from './InterviewHeader';
import { QuestionPanel } from './QuestionPanel';
import { WorkspaceTabs } from './WorkspaceTabs';
import { VideoCallSection } from './VideoCallSection';
import { ChatAndNotes } from './ChatAndNotes';

export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  const userStore = localStorage.getItem('user');
  const currentUser = userStore ? JSON.parse(userStore) : null;
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

  // Tải danh sách câu hỏi
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Random câu hỏi
  const handleRandom = useCallback(
    (type: 'code' | 'theory') => {
      setQuestionMode(type);
      setWorkMode(type === 'code' ? 'code' : 'theory');

      const question = getRandomQuestion(type);
      if (question) {
        setCurrentQuestion(question);
      }
    },
    [getRandomQuestion, setCurrentQuestion, setWorkMode, setQuestionMode],
  );

  // Loading khi chưa kết nối
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
              {/* <VideoErrorBoundary> */}
              <VideoCallSection />
              {/* </VideoErrorBoundary> */}
              <ChatAndNotes />
            </aside>
          </main>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}

// Component loading riêng
function InterviewLoading({ roomId }: { roomId?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm font-medium animate-pulse">Đang thiết lập kết nối Video...</p>
      <p className="text-[10px] text-slate-500">Room ID: {roomId}</p>
    </div>
  );
}

// Custom hook cho localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
