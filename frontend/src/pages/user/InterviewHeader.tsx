// src/components/interview/InterviewHeader.tsx
interface InterviewHeaderProps {
  roomId: string;
}

export function InterviewHeader({ roomId }: InterviewHeaderProps) {
  return (
    <header className="h-12 px-6 border-b flex justify-between items-center shrink-0 bg-white z-10">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white px-2 py-1 rounded font-bold text-xs">DOJO</div>
        <h1 className="font-black text-sm tracking-tight text-slate-800 uppercase">
          Interview Platform
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-mono border border-slate-200">
          ID: {roomId?.slice(0, 8)}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      </div>
    </header>
  );
}
