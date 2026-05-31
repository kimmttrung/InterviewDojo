// src/components/interview/ChatAndNotes.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useState } from 'react';
import { Paperclip, Send } from 'lucide-react';

export function ChatAndNotes() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      alert(`You have selected file: ${file.name}`);
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
                <Paperclip size={18} />
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
                <Send size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
