import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const CodeEditor = ({ roomId, userId }: { roomId: string; userId: string }) => {
  const [code, setCode] = useState('// Viết code tại đây...');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Sửa giá trị mặc định thành '63' (Node.js) thay vì 'nodejs'
  const [selectedLang, setSelectedLang] = useState('63');

  const languages = [
    { name: 'Node.js', value: '63', monaco: 'javascript' },
    { name: 'Python 3', value: '71', monaco: 'python' },
    { name: 'C++', value: '54', monaco: 'cpp' }
  ];
  useEffect(() => {
      const socket = io('http://localhost:3000', { query: { userId } });

      // Khi vào phòng, báo cho server biết tôi ở phòng nào để đồng bộ code
      socket.emit('join_room', roomId);

      socket.on('receive_code', (newCode: string) => {
        setCode(newCode);
      });

      return () => { socket.disconnect(); };
    }, [roomId, userId]);

    const handleEditorChange = (value: string | undefined) => {
      const newCode = value || '';
      setCode(newCode);
      // Gửi code lên theo roomId
      Socket.emit('send_code', { roomId, code: newCode });
    };

  const runCode = async () => {
    setLoading(true);
    setOutput('Đang thực thi...');
    try {
      const res = await axios.post('http://localhost:3000/api/v1/code-engine/run', {
        code,
        languageId: selectedLang, // Tên field phải là languageId để khớp Controller
      });

      if (res.data.stdout) {
        setOutput(res.data.stdout);
      } else if (res.data.stderr || res.data.compile_output) {
        setOutput(res.data.stderr || res.data.compile_output);
      } else {
        setOutput(`Trạng thái: ${res.data.status || 'Chạy xong'}`);
      }
    } catch (err: any) {
      setOutput(`Lỗi: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  const currentMonacoLang = languages.find(l => l.value === selectedLang)?.monaco || 'javascript';

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
     <div className="flex justify-between items-center mb-4">
        <select 
          className="bg-gray-800 p-2 rounded border border-gray-600 outline-none"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.name}</option>
          ))}
        </select>
        <button onClick={runCode} disabled={loading} className="...">
          {loading ? 'RUNNING...' : '▶ RUN CODE'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vùng soạn thảo */}
        <div className="border border-gray-700 rounded-lg overflow-hidden shadow-2xl">
          <Editor
            height="70vh"
            theme="vs-dark"
            language={currentMonacoLang} // Tự động đổi highlight theo select
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 16,
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />
        </div>
        
        {/* Vùng kết quả */}
        <div className="bg-black border border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-4 py-2 text-xs font-bold text-gray-400 uppercase">
            Console Output
          </div>
          <pre className="p-4 font-mono text-green-400 whitespace-pre-wrap flex-1 overflow-y-auto text-sm">
            {output || '> Kết quả sẽ hiển thị ở đây...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;