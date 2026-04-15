// src/components/interview/ChatAndNotes.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useState } from 'react';

export function ChatAndNotes() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      alert(`Bạn đã chọn file: ${file.name}`);
      // Xử lý gửi file qua Socket ở đây
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 bg-white">
      <Tabs defaultValue="notes" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 mb-3 rounded-lg p-1">
          <TabsTrigger
            value="notes"
            className="text-xs font-semibold data-[state=active]:bg-white shadow-none"
          >
            Interview Notes
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-xs font-semibold data-[state=active]:bg-white shadow-none"
          >
            Shared Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 flex flex-col mt-0">
          <textarea
            placeholder="Type pseudocode or observations..."
            className="flex-1 w-full p-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-800 shadow-sm"
          />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0 h-full">
          <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col shadow-inner overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
              <p className="text-[11px] text-center text-slate-400 italic mb-2">
                Messages & Files are end-to-end encrypted
              </p>

              <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm max-w-[90%]">
                <div className="bg-red-100 p-2 rounded text-red-600 font-bold text-xs uppercase">
                  PDF
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold truncate text-slate-700">
                    Tai_lieu_on_thi.pdf
                  </p>
                  <button className="text-[10px] text-blue-500 hover:underline">Download</button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <label className="cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleFileUpload}
                />
              </label>

              <input
                type="text"
                placeholder="Send a message..."
                className="flex-1 text-sm outline-none bg-transparent text-slate-800"
              />

              <button className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11zM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493z" />
                </svg>
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
