// src/pages/InterviewRoom.tsx
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  CallControls,
  User,
} from '@stream-io/video-react-sdk';
import { ParticipantTracker } from '../../components/videocall/ParticipantTracker';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import CodeEditor from './user/CodeEditor';
import Draggable from 'react-draggable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";

export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);

  // 1. Lấy token trực tiếp từ URL (Văn truyền từ Socket sang)
  const tokenFromUrl = searchParams.get('token');
  const userStore = localStorage.getItem('user');
  const currentUser = userStore ? JSON.parse(userStore) : null;
  const userId = currentUser?.id?.toString() || searchParams.get('userId') || 'guest';
  const nodeRef = useRef(null);

  useEffect(() => {
    // Nếu thiếu roomId hoặc token thì không thể kết nối
    if (!roomId || !userId || !tokenFromUrl) {
      console.error('Thiếu thông tin kết nối: roomId, userId hoặc token');
      return;
    }

    let _client: StreamVideoClient;
    let _call: any;

    const initVideoCall = async () => {
      try {
        const apiKey = (import.meta as any).env.VITE_STREAM_API_KEY;
        const user: User = { id: userId, name: currentUser?.name || userId };

        // 2. Sử dụng token có sẵn, không cần fetch lại Backend
        _client = new StreamVideoClient({
          apiKey,
          user,
          token: tokenFromUrl,
        });

        _call = _client.call('default', roomId);

        // Backend đã gọi getOrCreateCall nên ở đây chỉ cần join
        await _call.join();

        setClient(_client);
        setCall(_call);
      } catch (error) {
        console.error('Lỗi kết nối Stream Video:', error);
      }
    };

    initVideoCall();

    return () => {
      if (_call) _call.leave().catch(console.error);
      if (_client) _client.disconnectUser().catch(console.error);
    };
  }, [roomId, userId, tokenFromUrl]); // Theo dõi token từ URL

  if (!client || !call) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
        <p className="text-lg font-medium">Đang tham gia phòng phỏng vấn...</p>
      </div>
    );
  }

 return (
   <StreamVideo client={client}>
      <StreamCall call={call}>
        {/* CHẾ ĐỘ SÁNG (Light Mode) */}
        <div className="h-screen flex flex-col bg-white text-slate-900 font-sans overflow-hidden">
          
          {/* HEADER: GỌN GÀNG, SÁNG SỦA */}
          <header className="h-14 px-6 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-950 tracking-tight">Technical Interview Platform</h1>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-mono border border-slate-200">
                Room: {roomId?.slice(0, 8)}...
              </span>
            </div>
          </header>

          {/* MAIN CONTENT: CHIA 3 CỘT HỢP LÝ */}
          <main className="flex-1 flex overflow-hidden">
            
            {/* CỘT 1: ĐỀ BÀI & TEST CASES (25%) */}
            <aside className="w-1/4 border-r border-slate-200 bg-white overflow-y-auto p-6 flex flex-col gap-8">
              <div>
                <h2 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Problem Statement</h2>
                <div className="prose prose-slate prose-sm max-w-none text-slate-800">
                  <h3 className="text-lg font-bold mb-3">Two Sum</h3>
                  <p>Given an array of integers <code className="bg-slate-100 px-1 rounded">nums</code> and an integer <code className="bg-slate-100 px-1 rounded">target</code>, return indices of the two numbers such that they add up to target.</p>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Test Cases</h2>
                <div className="space-y-3">
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm font-mono text-slate-900">
                     Input: [2,7,11,15], target: 9 <br/> Output: [0,1]
                   </div>
                </div>
              </div>
            </aside>

            {/* CỘT 2: COLLABORATIVE CODE EDITOR (50%) */}
            <div className="w-1/2 flex flex-col border-r border-slate-200 bg-slate-50 relative">
               <div className="flex-1 p-2">
                 {/* Monaco Editor bọc trong flex-1 */}
                 <div className="h-full rounded-xl overflow-hidden shadow-inner border border-slate-200">
                    <CodeEditor roomId={roomId!} userId={userId} />
                 </div>
               </div>
            </div>

            {/* CỘT 3: VIDEO CALL (Floating) & TRAO ĐỔI (25%) */}
            <aside className="w-1/4 flex flex-col bg-slate-50 border-l border-slate-200 overflow-hidden">
              
              {/* PHẦN 1: VIDEO CALL (CỐ ĐỊNH PHÍA TRÊN) */}
              <div className="bg-black border-b border-slate-200 relative group">
                <div className="aspect-video w-full bg-slate-900 shadow-inner">
                  <SpeakerLayout />
                </div>
                
                {/* Bộ điều khiển hiện lên khi di chuột vào vùng video */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 stream-mini-controls">
                  <CallControls onLeave={() => navigate('/dashboard')} />
                </div>
              </div>

              {/* PHẦN 2: KHÔNG GIAN TRAO ĐỔI (DƯỚI VIDEO) */}
              <div className="flex-1 flex flex-col overflow-hidden p-4 bg-white">
                <Tabs defaultValue="notes" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 mb-3 rounded-lg p-1">
                    <TabsTrigger value="notes" className="text-xs font-semibold data-[state=active]:bg-white shadow-none">
                      Interview Notes
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="text-xs font-semibold data-[state=active]:bg-white shadow-none">
                      Shared Chat
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Tab Ghi chú */}
                  <TabsContent value="notes" className="flex-1 flex flex-col mt-0">
                    <textarea 
                      placeholder="Type pseudocode or observations..." 
                      className="flex-1 w-full p-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-800 shadow-sm"
                    />
                  </TabsContent>

                  {/* Tab Chat */}
                  <TabsContent value="chat" className="flex-1 flex flex-col mt-0 h-full">
                    <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col shadow-inner overflow-hidden">
                      
                      {/* Vùng hiển thị tin nhắn & File đã gửi */}
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
                        <p className="text-[11px] text-center text-slate-400 italic mb-2">
                          Messages & Files are end-to-end encrypted
                        </p>
                        
                        {/* Ví dụ hiển thị File PDF khi nhận được */}
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm max-w-[90%]">
                          <div className="bg-red-100 p-2 rounded text-red-600 font-bold text-xs uppercase">PDF</div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold truncate text-slate-700">Tai_lieu_on_thi.pdf</p>
                            <button className="text-[10px] text-blue-500 hover:underline">Download</button>
                          </div>
                        </div>
                      </div>

                      {/* Input & Nút đính kèm file */}
                      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                        {/* Nút kẹp giấy ẩn Input File */}
                        <label className="cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) alert(`Bạn đã chọn file: ${file.name}`); 
                              // Ở đây Trung sẽ gọi hàm xử lý gửi file qua Socket
                            }}
                          />
                        </label>

                        <input 
                          type="text" 
                          placeholder="Send a message..." 
                          className="flex-1 text-sm outline-none bg-transparent text-slate-800"
                        />
                        
                        <button className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11zM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </aside>
          </main>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}