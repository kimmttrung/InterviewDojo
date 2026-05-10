import { Question } from '../../../../../../shared/types/interview';
import { useSocketStore } from '../../../../../../stores/useSocketStore';
import CodeEditor from '../../../../../shared-domain/code-editor/pages/CodeEditor';
import Whiteboard from './Whiteboard';
import { useEffect } from 'react';

type WorkMode = 'code' | 'whiteboard';

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
        {(['code', 'whiteboard'] as WorkMode[]).map((m) => (
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
          <CodeEditor
            mode="peer"
            roomId={roomId}
            userId={userId}
            currentQuestion={currentQuestion}
          />
        )}

        {workMode === 'whiteboard' && <Whiteboard roomId={roomId} userId={userId} />}
      </div>
    </div>
  );
}
