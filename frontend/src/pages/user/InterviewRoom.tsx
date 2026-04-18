// src/pages/InterviewRoom.tsx
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useQuestions } from '../../hooks/useQuestions';
import { InterviewHeader } from './InterviewHeader';
import { QuestionPanel } from './QuestionPanel';
import { WorkspaceTabs } from './WorkspaceTabs';
import { VideoCallSection } from './VideoCallSection';
import { ChatAndNotes } from './ChatAndNotes';
import { io } from 'socket.io-client';
import { WorkMode } from '../../types/interview';

export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  const userStore = localStorage.getItem('user');
  const currentUser = userStore ? JSON.parse(userStore) : null;
  const userId = currentUser?.id?.toString() || searchParams.get('userId') || 'guest';
  const token = searchParams.get('token');
  const socketRef = useRef<any>(null);

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

  useEffect(() => {
    if (!userId || !roomId) return;

    // Khởi tạo socket
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId },
    });

    // Tham gia phòng
    socketRef.current.emit('join_room', roomId);

    // LẮNG NGHE KHI NGƯỜI KIA ĐỔI CÂU HỎI
    socketRef.current.on('receive_question', (data: { question: any; mode: 'code' | 'theory' }) => {
      setCurrentQuestion(data.question);
      setQuestionMode(data.mode);
      setWorkMode(data.mode === 'code' ? 'code' : 'theory');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, userId]);

  // Tải danh sách câu hỏi
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Random câu hỏi
  const handleRandom = useCallback(
    (type: 'code' | 'theory') => {
      const question = getRandomQuestion(type);
      if (question) {
        setCurrentQuestion(question);
        setQuestionMode(type);
        setWorkMode(type === 'code' ? 'code' : 'theory');

        // 2. GỬI CHO NGƯỜI KIA QUA SOCKET
        socketRef.current?.emit('send_question', {
          roomId,
          question: question,
          mode: type,
        });
      }
    },
    [getRandomQuestion, setCurrentQuestion, setWorkMode, setQuestionMode, roomId],
  );

  // EFFECT DỌN DẸP KHI THOÁT PHÒNG
  useEffect(() => {
    // Hàm này sẽ chạy khi component bị Unmount (người dùng rời khỏi InterviewRoom)
    return () => {
      console.log('🧹 Đang dọn dẹp dữ liệu phòng phỏng vấn...');
      localStorage.removeItem('workMode');
      localStorage.removeItem('questionMode');
      // Nếu bạn có lưu các bản nháp code hay whiteboard thì xóa ở đây luôn
      localStorage.removeItem('whiteboard_shapes');
    };
  }, []); // Array rỗng để chỉ chạy 1 lần khi mount và 1 lần khi unmount

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
