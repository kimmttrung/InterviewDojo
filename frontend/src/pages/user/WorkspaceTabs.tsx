// src/components/interview/WorkspaceTabs.tsx
import CodeEditor from './CodeEditor';
import Whiteboard from './Whiteboard';
import { Question } from '../../types/interview';
import { useEffect } from 'react';
import { useSocketStore } from '../../stores/useSocketStore';

type WorkMode = 'code' | 'theory' | 'whiteboard';

interface WorkspaceTabsProps {
  workMode: WorkMode;
  setWorkMode: (mode: WorkMode) => void;
  currentQuestion: Question | null;
  roomId: string;
  userId: string;
}

export function WorkspaceTabs({
  workMode,
  setWorkMode,
  currentQuestion,
  roomId,
  userId,
}: WorkspaceTabsProps) {
  const { connect, joinRoom, emit, socket } = useSocketStore();

  // Kết nối socket và join room
  useEffect(() => {
    if (!userId || !roomId) return;

    connect(userId);
    joinRoom(roomId);

    // Lắng nghe chuyển tab từ người kia
    const handleReceiveWorkMode = (mode: WorkMode) => {
      setWorkMode(mode);
    };

    socket?.on('receive_work_mode', handleReceiveWorkMode);

    return () => {
      socket?.off('receive_work_mode', handleReceiveWorkMode);
    };
  }, [userId, roomId, socket, connect, joinRoom, setWorkMode]);

  const handleTabChange = (mode: WorkMode) => {
    setWorkMode(mode);
    // Gửi cho người kia
    emit('send_work_mode', { roomId, mode });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex gap-1 px-4 pt-2 border-b bg-white">
        {(['code', 'theory', 'whiteboard'] as WorkMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleTabChange(m)}
            className={`px-4 py-2 text-[10px] font-bold border-b-2 transition-all uppercase tracking-wider ${
              workMode === m
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden">
        {workMode === 'code' && (
          <CodeEditor roomId={roomId} userId={userId} currentQuestion={currentQuestion} />
        )}

        {workMode === 'theory' && (
          <div className="h-full overflow-y-auto p-8 flex justify-center bg-[#fcfcfc]">
            {currentQuestion ? (
              <div className="max-w-2xl w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🧠</span>
                  <h2 className="text-xl font-black text-slate-900">{currentQuestion.title}</h2>
                </div>
                <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                  {currentQuestion.content}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">
                Chọn loại câu hỏi và nhấn Random để hiển thị nội dung
              </div>
            )}
          </div>
        )}

        {workMode === 'whiteboard' && <Whiteboard roomId={roomId} userId={userId} />}
      </div>
    </div>
  );
}
