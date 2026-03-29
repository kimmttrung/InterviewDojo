// src/pages/user/CodeEditor.tsx
import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
const CodeEditor = ({ roomId, userId }: { roomId: string; userId: string }) => {
  const [code, setCode] = useState('// Viết code tại đây...');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('63');
  
  // Sử dụng useRef để giữ instance của socket không bị khởi tạo lại khi re-render
  const socketRef = useRef<Socket | null>(null);

  const languages = [
    { name: 'Node.js', value: '63', monaco: 'javascript' },
    { name: 'Python 3', value: '71', monaco: 'python' },
    { name: 'C++', value: '54', monaco: 'cpp' }
  ];

  useEffect(() => {
    // 1. Khởi tạo socket
    socketRef.current = io('http://localhost:3000', { query: { userId } });

    // 2. Vào phòng
    socketRef.current.emit('join_room', roomId);

    // Lắng nghe ĐÚNG tên sự kiện từ Backend gửi về
    socketRef.current.on('receive_code', (newCode: string) => {
      setCode(newCode);
    });

    // 1. Lắng nghe sự kiện đổi ngôn ngữ từ đối phương
  socketRef.current.on('receive_language', (langId: string) => {
    setSelectedLang(langId);
  });

    socketRef.current.on('receive_run_result', (result: any) => {
      setOutput(result);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, userId]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    
    if (socketRef.current) {
      // Gửi ĐÚNG tên sự kiện mà Backend đang đợi (@SubscribeMessage)
      socketRef.current.emit('send_code', { roomId, code: newCode });
    }
  };
  // 2. Tạo hàm xử lý khi chính mình đổi ngôn ngữ
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLangId = e.target.value;
    setSelectedLang(newLangId);

    // Gửi lên server để đồng bộ cho đối phương
    if (socketRef.current) {
      socketRef.current.emit('send_language', {
        roomId,
        languageId: newLangId,
      });
    }
  };

  const runCode = async () => {
    setLoading(true);
    const startMsg = '🚀 Đối phương đang chạy code...';
    setOutput('Đang thực thi...');

    // Thông báo cho đối phương biết mình đang ấn Run
    socketRef.current?.emit('send_run_result', { roomId, result: startMsg });

    try {
      const res = await axios.post('http://localhost:3000/api/v1/code-engine/run', {
        code,
        languageId: selectedLang,
      });

      // Lấy kết quả cuối cùng
      const finalResult = res.data.stdout || res.data.stderr || res.data.compile_output || `Status: ${res.data.status}`;
      
      // Hiển thị cho mình
      setOutput(finalResult);

      // 5. Gửi kết quả cho đối phương (MỚI)
      socketRef.current?.emit('send_run_result', { roomId, result: finalResult });

    } catch (err: any) {
      const errorMsg = `Lỗi: ${err.response?.data?.message || err.message}`;
      setOutput(errorMsg);
      socketRef.current?.emit('send_run_result', { roomId, result: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const currentMonacoLang = languages.find(l => l.value === selectedLang)?.monaco || 'javascript';

return (
  <div className="flex flex-col h-full bg-[#1e1e1e] text-white overflow-hidden">
    {/* 1. Toolbar giữ nguyên */}
    <div className="p-2 flex justify-between items-center bg-[#2d2d2d] border-b border-gray-700 z-10">
      <select 
        className="bg-[#3c3c3c] p-1 px-2 rounded border border-gray-600 text-xs outline-none"
        value={selectedLang}
        onChange={handleLanguageChange} // 3. Sử dụng hàm mới ở đây
      >
        {languages.map(lang => (
          <option key={lang.value} value={lang.value}>{lang.name}</option>
        ))}
      </select>
      <button onClick={runCode} className="bg-[#28a745] px-4 py-1 rounded text-xs font-bold">
        {loading ? 'RUNNING...' : '▶ RUN CODE'}
      </button>
    </div>

    {/* 2. VÙNG CHÍNH */}
    <div className="flex-1 flex flex-col overflow-hidden relative">
      
      {/* PHẦN CODE: Tự động co giãn theo khoảng trống còn lại */}
      <div className="flex-1 min-h-[100px]">
        <Editor
          height="100%"
          theme="vs-dark"
          language={currentMonacoLang}
          value={code}
          onChange={handleEditorChange}
          options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
        />
      </div>

      {/* 3. PHẦN CONSOLE: CÓ THỂ KÉO (RESIZE) */}
      <div 
        className="bg-black border-t-2 border-gray-700 flex flex-col overflow-hidden"
        style={{ 
          height: '30%',          // Chiều cao mặc định
          minHeight: '40px',      // Không cho kéo mất tiêu
          maxHeight: '80%',       // Không cho kéo che hết code
          resize: 'vertical',     // ĐÂY LÀ PHÉP MÀU: Cho phép kéo dọc
          direction: 'ltr'        // Đảm bảo thanh kéo nằm bên phải/dưới
        }}
      >
        {/* Thanh tiêu đề Console nhỏ gọn */}
        <div className="bg-[#252526] px-4 py-1 text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center sticky top-0">
          <span>Console Output</span>
          <span className="text-[9px] lowercase opacity-50 italic">(Kéo mép trên để chỉnh độ cao)</span>
        </div>

        {/* Nội dung kết quả */}
        <pre className="p-3 font-mono text-green-500 whitespace-pre-wrap flex-1 overflow-y-auto text-xs italic">
          {output || '> Waiting for execution...'}
        </pre>
      </div>
    </div>
  </div>
);
};

export default CodeEditor;