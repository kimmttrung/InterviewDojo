import { useRef, useState, useCallback, useEffect } from 'react';

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

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

      // Vẽ đầu mũi tên
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
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const width = Math.abs(b.x - a.x);
      const height = Math.abs(b.y - a.y);

      if (s.filled) ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
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
      const width = b.x - a.x;
      const height = b.y - a.y;

      ctx.beginPath();
      ctx.moveTo(a.x + width / 2, a.y);
      ctx.lineTo(a.x + width, a.y + height);
      ctx.lineTo(a.x, a.y + height);
      ctx.closePath();
      if (s.filled) ctx.fill();
      ctx.stroke();
    } else if (s.tool === 'parallelogram') {
      if (s.points.length < 2) return;
      const [a, b] = s.points;
      const width = b.x - a.x;
      const height = b.y - a.y;
      const skew = width * 0.3;

      ctx.beginPath();
      ctx.moveTo(a.x + skew, a.y);
      ctx.lineTo(a.x + width + skew, a.y);
      ctx.lineTo(a.x + width, a.y + height);
      ctx.lineTo(a.x, a.y + height);
      ctx.closePath();
      if (s.filled) ctx.fill();
      ctx.stroke();
    } else if (s.tool === 'text') {
      ctx.font = `${s.width * 5 + 16}px "Segoe UI", monospace`;
      ctx.fillStyle = s.color;
      ctx.fillText(s.text || '', s.points[0].x, s.points[0].y);
    }
    ctx.restore();
  };

  const redraw = useCallback((list: WBShape[], extra?: WBShape) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

    // Vẽ background grid
    ctx.save();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    const gridSize = 20;
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
      setHistory([...history.slice(0, historyIndex + 1), newShapes]);
      setHistoryIndex(historyIndex + 1);
      setPendingText(null);
      setTextInput('');
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
      redraw(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
      redraw(history[historyIndex + 1]);
    }
  };

  const clearCanvas = () => {
    setShapes([]);
    setHistory([[]]);
    setHistoryIndex(0);
    redraw([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redraw(shapes);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [shapes, redraw]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-2">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Tools */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id as WBTool)}
                className={`relative group p-2 rounded-md transition-all ${
                  tool === t.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
                title={t.name}
              >
                <span className="text-lg">{t.label}</span>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {t.name}
                </span>
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* Colors */}
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.code}
                onClick={() => setColor(c.code)}
                className={`relative w-8 h-8 rounded-lg transition-all ${
                  color === c.code
                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.code, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                title={c.name}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Stroke:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono text-gray-500 w-8">{lineWidth}px</span>
          </div>

          {/* Fill Toggle */}
          <button
            onClick={() => setFilled(!filled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filled
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filled ? '🎨 Filled' : '⬜ Outline'}
          </button>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={undo}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              title="Undo"
            >
              ↩️ Undo
            </button>
            <button
              onClick={redo}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              title="Redo"
            >
              ↪️ Redo
            </button>
            <button
              onClick={clearCanvas}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair shadow-inner"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
      </div>

      {/* Text Input Modal */}
      {pendingText && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 min-w-[320px]">
            <h3 className="text-lg font-semibold mb-4">Enter Text</h3>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Type your text here..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingText(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTextSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-1.5 text-xs text-gray-500 flex justify-between items-center">
        <div className="flex gap-4">
          <span>🖱️ Click and drag to draw</span>
          <span>🎨 Current tool: {TOOLS.find((t) => t.id === tool)?.name}</span>
          <span>
            🎯 Color:{' '}
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: color }} />
          </span>
        </div>
        <div>
          {shapes.length} shape{shapes.length !== 1 ? 's' : ''} on canvas
        </div>
      </div>
    </div>
  );
}
