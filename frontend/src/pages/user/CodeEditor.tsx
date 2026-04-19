// src/pages/user/CodeEditor.tsx
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../../../lib/api';
import { useSocketStore } from '../../stores/useSocketStore';
import { codingService } from '../../../services/coding.service';

interface CodeEditorProps {
  roomId: string;
  userId: string;
  currentQuestion: any;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ roomId, userId, currentQuestion }) => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('63');

  const { connect, joinRoom, emit, socket } = useSocketStore();

  const languages = [
    { name: 'Node.js', value: '63', monaco: 'javascript' },
    { name: 'Python 3', value: '71', monaco: 'python' },
    { name: 'C++', value: '54', monaco: 'cpp' },
  ];

  // ====================== SOCKET CONNECTION ======================
  useEffect(() => {
    if (!userId || !roomId) return;

    connect(userId);
    joinRoom(roomId);

    // ==================== CÁC LISTENER ====================
    const handleReceiveCode = (newCode: string) => setCode(newCode);
    const handleReceiveLanguage = (langId: string) => setSelectedLang(langId);
    const handleReceiveRunResult = (result: string) => setOutput(result);

    // ★★★ LISTENER QUAN TRỌNG: Nhận kết quả submit từ người kia ★★★
    const handleReceiveSubmitResult = (result: string) => {
      setOutput(result); // Hiển thị kết quả người kia submit
      console.log('📥 Nhận được kết quả submit từ đối phương');
    };

    socket?.on('receive_code', handleReceiveCode);
    socket?.on('receive_language', handleReceiveLanguage);
    socket?.on('receive_run_result', handleReceiveRunResult);
    socket?.on('receive_submit_result', handleReceiveSubmitResult); // ← Dòng này quan trọng

    return () => {
      socket?.off('receive_code', handleReceiveCode);
      socket?.off('receive_language', handleReceiveLanguage);
      socket?.off('receive_run_result', handleReceiveRunResult);
      socket?.off('receive_submit_result', handleReceiveSubmitResult);
    };
  }, [userId, roomId, socket, connect, joinRoom]);

  // ====================== EDITOR HANDLERS ======================
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    emit('send_code', { roomId, code: newCode });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLangId = e.target.value;
    setSelectedLang(newLangId);
    emit('send_language', { roomId, languageId: newLangId });
  };

  // ====================== SUBMIT CODE ======================
  const submitCode = async () => {
    if (!code.trim() || !currentQuestion) {
      setOutput('❌ Vui lòng chọn câu hỏi và viết code trước');
      return;
    }

    setLoading(true);
    setOutput('📤 Đang nộp bài...');

    try {
      const payload = {
        codingQuestionId: currentQuestion.id,
        languageId: selectedLang,
        sourceCode: code,
      };

      const submission = await codingService.submitCode(payload);

      const initialMsg = `✅ Nộp bài thành công!\nSubmission ID: ${submission.id}\nĐang chờ hệ thống chấm...`;
      setOutput(initialMsg);

      pollSubmission(submission.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
      const errorMsg = `❌ Nộp bài thất bại: ${msg}`;
      setOutput(errorMsg);
      emit('send_submit_result', { roomId, result: errorMsg }); // Gửi lỗi cho người kia
    } finally {
      setLoading(false);
    }
  };

  // Polling và gửi kết quả cho người kia
  const pollSubmission = (submissionId: number) => {
    let attempts = 0;
    const maxAttempts = 25;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/coding/submission/${submissionId}`);
        const data = res.data.data || res.data;

        let text = `Submission #${submissionId}\n`;
        text += `Trạng thái: ${data.status}\n`;
        text += `Điểm: ${data.score || 0}%\n`;
        text += `Passed: ${data.passedTestCases || 0} / ${data.totalTestCases || '?'}\n`;
        text += `Thời gian: ${data.executionTime || 0}ms | Memory: ${data.memoryUsed || 0}KB\n`;

        if (data.errorMessage) text += `\n❌ Error: ${data.errorMessage}`;

        setOutput(text);

        if (
          [
            'ACCEPTED',
            'WRONG_ANSWER',
            'RUNTIME_ERROR',
            'COMPILE_ERROR',
            'TIME_LIMIT_EXCEEDED',
            'MEMORY_LIMIT_EXCEEDED',
          ].includes(data.status)
        ) {
          clearInterval(interval);

          let finalResult = text;
          if (data.status === 'ACCEPTED') {
            finalResult += '\n\n🎉 CHÚC MỪNG! Bạn đã giải đúng tất cả test cases.';
          } else {
            finalResult += `\n\nKết quả: Pass ${data.passedTestCases || 0}/${data.totalTestCases} test cases`;
          }

          setOutput(finalResult);

          // ★★★ GỬI KẾT QUẢ CHO NGƯỜI KIA ★★★
          emit('send_submit_result', { roomId, result: finalResult });
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          const timeoutMsg = '⏰ Quá thời gian chờ kết quả.';
          setOutput((prev) => prev + '\n\n' + timeoutMsg);
          emit('send_submit_result', { roomId, result: timeoutMsg });
        }
      } catch (err) {
        console.error('Poll submission error:', err);
      }
    }, 1800);
  };

  const currentMonacoLang = languages.find((l) => l.value === selectedLang)?.monaco || 'javascript';

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white overflow-hidden">
      <div className="p-3 flex gap-3 items-center bg-[#2d2d2d] border-b border-gray-700 z-10">
        <select
          className="bg-[#3c3c3c] px-3 py-1.5 rounded border border-gray-600 text-sm outline-none"
          value={selectedLang}
          onChange={handleLanguageChange}
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.name}
            </option>
          ))}
        </select>

        <button
          onClick={submitCode}
          disabled={loading || !currentQuestion}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 px-6 py-1.5 rounded text-sm font-semibold flex-1"
        >
          {loading ? 'ĐANG CHẤM BÀI...' : '🚀 SUBMIT CODE'}
        </button>
      </div>

      <div className="flex-1 min-h-[200px]">
        <Editor
          height="100%"
          theme="vs-dark"
          language={currentMonacoLang}
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: 'on',
          }}
        />
      </div>

      <div
        className="bg-black border-t-2 border-gray-700 flex flex-col overflow-hidden"
        style={{ height: '35%', minHeight: '120px', resize: 'vertical' }}
      >
        <div className="bg-[#252526] px-4 py-2 text-xs font-bold text-gray-400 flex justify-between">
          <span>CONSOLE / KẾT QUẢ CHẤM BÀI (Chia sẻ với đối phương)</span>
          <span className="opacity-50">(kéo để thay đổi chiều cao)</span>
        </div>
        <pre className="p-4 font-mono text-sm whitespace-pre-wrap flex-1 overflow-y-auto text-green-400 leading-relaxed">
          {output || '> Nhấn SUBMIT CODE để nộp bài và xem kết quả...'}
        </pre>
      </div>
    </div>
  );
};

export default CodeEditor;
