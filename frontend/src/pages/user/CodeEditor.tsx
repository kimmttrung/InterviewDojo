// src/pages/user/CodeEditor.tsx
import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { codeEngineService } from '../../../services/code-engine.service';
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
    { name: 'C++', value: '54', monaco: 'cpp' },
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
    if (!code.trim()) return;

    setLoading(true);
    setOutput('🚀 Đang thực thi mã...');

    try {
      const response = await codeEngineService.runCode({
        code,
        languageId: selectedLang,
      });

      const res = response.data.data;
      console.log('check res', res);

      let finalDisplay = '';

      // 1. Kiểm tra lỗi biên dịch trước (Nếu có nội dung)
      if (res.compile_output && res.compile_output.trim() !== '') {
        finalDisplay = `❌ COMPILE ERROR:\n${res.compile_output}`;
      }
      // 2. Kiểm tra lỗi Runtime (Nếu có nội dung)
      else if (res.stderr && res.stderr.trim() !== '') {
        finalDisplay = `⚠️ RUNTIME ERROR:\n${res.stderr}`;
      }
      // 3. Nếu không lỗi thì hiển thị stdout (Kể cả khi stdout là chuỗi rỗng)
      else {
        finalDisplay = res.stdout || '(No output)';
      }

      // 4. Luôn đính kèm thông số hiệu năng bên dưới cho chuyên nghiệp
      const meta = `\n\n------------------\n✨ Status: ${res.status} | ⏱️ ${res.time}s | 💾 ${res.memory}KB`;
      console.log('check finalDisplay', finalDisplay);
      const outputWithMeta = finalDisplay + meta;
      console.log('check outputWithMeta', outputWithMeta);
      // Cập nhật UI
      setOutput(outputWithMeta);
      console.log('check', output);

      // Gửi kết quả cho đối phương qua Socket
      socketRef.current?.emit('send_run_result', {
        roomId,
        result: outputWithMeta,
      });
    } catch (err: any) {
      const errorMsg = `❌ System Error: ${err.response?.data?.message || err.message}`;
      setOutput(errorMsg);
      socketRef.current?.emit('send_run_result', { roomId, result: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const currentMonacoLang = languages.find((l) => l.value === selectedLang)?.monaco || 'javascript';

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white overflow-hidden">
      {/* 1. Toolbar giữ nguyên */}
      <div className="p-2 flex justify-between items-center bg-[#2d2d2d] border-b border-gray-700 z-10">
        <select
          className="bg-[#3c3c3c] p-1 px-2 rounded border border-gray-600 text-xs outline-none"
          value={selectedLang}
          onChange={handleLanguageChange} // 3. Sử dụng hàm mới ở đây
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.name}
            </option>
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
            height: '30%', // Chiều cao mặc định
            minHeight: '40px', // Không cho kéo mất tiêu
            maxHeight: '80%', // Không cho kéo che hết code
            resize: 'vertical', // ĐÂY LÀ PHÉP MÀU: Cho phép kéo dọc
            direction: 'ltr', // Đảm bảo thanh kéo nằm bên phải/dưới
          }}
        >
          {/* Thanh tiêu đề Console nhỏ gọn */}
          <div className="bg-[#252526] px-4 py-1 text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center sticky top-0">
            <span>Console Output</span>
            <span className="text-[9px] lowercase opacity-50 italic">
              (Kéo mép trên để chỉnh độ cao)
            </span>
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
