import { useRef, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

type WBTool =
  | 'pen'
  | 'eraser'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'parallelogram'
  | 'arrow'
  | 'line'
  | 'text';

interface Point {
  x: number;
  y: number;
}

interface WBShape {
  id: string;
  tool: WBTool;
  points: Point[];
  color: string;
  width: number;
  text?: string;
  filled?: boolean;
}

interface WhiteboardProps {
  roomId: string;
  userId: string;
}

export default function Whiteboard({ roomId, userId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // States
  const [tool, setTool] = useState<WBTool>('pen');
  const [color, setColor] = useState('#3B82F6');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<WBShape[]>([]);
  const [currentShape, setCurrentShape] = useState<WBShape | null>(null);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [history, setHistory] = useState<WBShape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [filled, setFilled] = useState(false);
  const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');

  const COLORS = [
    { code: '#EF4444', name: 'Red' },
    { code: '#3B82F6', name: 'Blue' },
    { code: '#10B981', name: 'Green' },
    { code: '#F59E0B', name: 'Yellow' },
    { code: '#8B5CF6', name: 'Purple' },
    { code: '#EC4899', name: 'Pink' },
    { code: '#000000', name: 'Black' },
    { code: '#FFFFFF', name: 'White' },
  ];

  const TOOLS = [
    { id: 'pen', label: '✏️', name: 'Pen' },
    { id: 'eraser', label: '🧹', name: 'Eraser' },
    { id: 'line', label: '➖', name: 'Line' },
    { id: 'rect', label: '◻️', name: 'Rectangle' },
    { id: 'circle', label: '●', name: 'Circle' },
    { id: 'triangle', label: '▲', name: 'Triangle' },
    { id: 'parallelogram', label: '◆', name: 'Parallelogram' },
    { id: 'arrow', label: '➡️', name: 'Arrow' },
    { id: 'text', label: '📝', name: 'Text' },
  ];

  // Helper: Đồng bộ danh sách hình qua Socket
  const emitShapes = (newShapes: WBShape[]) => {
    socketRef.current?.emit('send_whiteboard_shapes', {
      roomId,
      shapes: newShapes,
    });
  };

  const getPos = (e: any): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawShape = (ctx: CanvasRenderingContext2D, s: WBShape) => {
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'pen' || s.tool === 'eraser') {
      if (s.points.length < 2) return;
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s.width * 4;
      }
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      s.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (s.tool === 'line') {
      if (s.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      ctx.lineTo(s.points[1].x, s.points[1].y);
      ctx.stroke();
    } else if (s.tool === 'arrow') {
      if (s.points.length < 2) return;
      const [start, end] = s.points;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowSize = 15;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - arrowSize * Math.cos(angle - Math.PI / 6),
        end.y - arrowSize * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        end.x - arrowSize * Math.cos(angle + Math.PI / 6),
        end.y - arrowSize * Math.sin(angle + Math.PI / 6),
      );
      ctx.fill();
    } else if (s.tool === 'rect') {
      if (s.points.length < 2) return;
      const [a, b] = s.points;
      const x = Math.min(a.x, b.x),
        y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x),
        h = Math.abs(b.y - a.y);
      if (s.filled) ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    } else if (s.tool === 'circle') {
      if (s.points.length < 2) return;
      const [a, b] = s.points;
      const radius = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
      ctx.beginPath();
      ctx.arc(a.x, a.y, radius, 0, Math.PI * 2);
      if (s.filled) ctx.fill();
      ctx.stroke();
    } else if (s.tool === 'triangle') {
      if (s.points.length < 2) return;
      const [a, b] = s.points;
      ctx.beginPath();
      ctx.moveTo(a.x + (b.x - a.x) / 2, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(a.x, b.y);
      ctx.closePath();
      if (s.filled) ctx.fill();
      ctx.stroke();
    } else if (s.tool === 'parallelogram') {
      if (s.points.length < 2) return;
      const [a, b] = s.points;
      const skew = (b.x - a.x) * 0.3;
      ctx.beginPath();
      ctx.moveTo(a.x + skew, a.y);
      ctx.lineTo(b.x + skew, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(a.x, b.y);
      ctx.closePath();
      if (s.filled) ctx.fill();
      ctx.stroke();
    } else if (s.tool === 'text') {
      ctx.font = `${s.width * 5 + 16}px "Segoe UI", sans-serif`;
      ctx.fillStyle = s.color;
      ctx.fillText(s.text || '', s.points[0].x, s.points[0].y);
    }
    ctx.restore();
  };

  const redraw = useCallback((list: WBShape[], extra?: WBShape) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

    // Background grid
    ctx.save();
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < canvasRef.current!.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasRef.current!.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasRef.current!.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasRef.current!.width, y);
      ctx.stroke();
    }
    ctx.restore();

    [...list, ...(extra ? [extra] : [])].forEach((s) => drawShape(ctx, s));
  }, []);

  // --- Logic Socket ---
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, { query: { userId } });
    socketRef.current = socket;
    socket.emit('join_room', roomId);

    socket.on('receive_whiteboard_shapes', (remoteShapes: WBShape[]) => {
      setShapes(remoteShapes);
      redraw(remoteShapes);
      setHistory((prev) => [...prev, remoteShapes]);
      setHistoryIndex((h) => h + 1);
    });

    socket.on('receive_clear_whiteboard', () => {
      setShapes([]);
      redraw([]);
      setHistory([[]]);
      setHistoryIndex(0);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, userId, redraw]);

  // --- Logic Resize ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (
        parent &&
        (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)
      ) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redraw(shapes);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [shapes, redraw]);

  // --- Mouse Events ---
  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    if (tool === 'text') {
      setPendingText(pos);
      return;
    }
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentShape({
      id: Date.now().toString(),
      tool,
      color,
      width: lineWidth,
      filled,
      points: [pos],
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentShape) return;
    const pos = getPos(e);
    const updated =
      tool === 'pen' || tool === 'eraser'
        ? { ...currentShape, points: [...currentShape.points, pos] }
        : { ...currentShape, points: [startPoint, pos] };
    setCurrentShape(updated);
    redraw(shapes, updated);
  };

  const onMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);
    const newShapes = [...shapes, currentShape];
    setShapes(newShapes);
    emitShapes(newShapes); // Đồng bộ ngay

    setHistory([...history.slice(0, historyIndex + 1), newShapes]);
    setHistoryIndex(historyIndex + 1);
    setCurrentShape(null);
  };

  const handleTextSubmit = () => {
    if (pendingText && textInput.trim()) {
      const newShape: WBShape = {
        id: Date.now().toString(),
        tool: 'text',
        color,
        width: lineWidth,
        points: [pendingText],
        text: textInput,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      emitShapes(newShapes); // Đồng bộ văn bản

      setHistory([...history.slice(0, historyIndex + 1), newShapes]);
      setHistoryIndex(historyIndex + 1);
      setPendingText(null);
      setTextInput('');
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevShapes = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setShapes(prevShapes);
      redraw(prevShapes);
      emitShapes(prevShapes); // Đồng bộ Undo
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextShapes = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setShapes(nextShapes);
      redraw(nextShapes);
      emitShapes(nextShapes); // Đồng bộ Redo
    }
  };

  const clearCanvas = () => {
    setShapes([]);
    setHistory([[]]);
    setHistoryIndex(0);
    redraw([]);
    socketRef.current?.emit('clear_whiteboard', roomId);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-3 flex-wrap">
        <div className="flex gap-0.5 bg-white p-1 rounded-lg border shadow-sm">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as WBTool)}
              className={`p-2 rounded-md transition-all ${tool === t.id ? 'bg-indigo-600 text-white shadow-inner' : 'hover:bg-slate-100 text-slate-600'}`}
              title={t.name}
            >
              <span className="text-base">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-300 mx-1" />

        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.code}
              onClick={() => setColor(c.code)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c.code ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c.code }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 ml-2">
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <button
          onClick={() => setFilled(!filled)}
          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ${filled ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600 shadow-sm'}`}
        >
          {filled ? 'Filled' : 'Outline'}
        </button>

        <div className="flex-1" />

        <div className="flex gap-1">
          <button onClick={undo} className="p-2 hover:bg-white rounded-md border text-xs shadow-sm">
            ↩️
          </button>
          <button onClick={redo} className="p-2 hover:bg-white rounded-md border text-xs shadow-sm">
            ↪️
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-white">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />

        {/* Text Input Modal */}
        {pendingText && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-slate-200 animate-in fade-in zoom-in duration-200">
              <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-tight">
                Thêm văn bản
              </h3>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4 text-sm"
                placeholder="Nhập nội dung..."
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPendingText(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg uppercase"
                >
                  Hủy
                </button>
                <button
                  onClick={handleTextSubmit}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg shadow-md uppercase"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
