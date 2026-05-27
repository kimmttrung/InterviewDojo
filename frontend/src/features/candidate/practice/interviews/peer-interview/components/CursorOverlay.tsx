// components/CursorOverlay.tsx
import React, { useEffect, useState, useRef } from 'react';
import { CursorData } from '../hooks/useCursorSync';

interface CursorOverlayProps {
  cursors: Map<string, CursorData>;
  containerRef: React.RefObject<HTMLElement>;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors, containerRef }) => {
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const rafId = useRef<number>();

  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
      rafId.current = requestAnimationFrame(updateRect);
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [containerRef]);

  if (!containerRect) return null;

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50"
      style={{
        width: containerRect.width,
        height: containerRect.height,
        transform: `translate(${containerRect.left}px, ${containerRect.top}px)`,
      }}
    >
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          {/* SVG mũi tên */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.5 3.5L19 12L12 13L9 20L5.5 3.5Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          {/* Tên người dùng */}
          <div
            className="absolute left-5 top-0 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap shadow-md"
            style={{ backgroundColor: cursor.color, color: '#fff' }}
          >
            {cursor.displayName}
          </div>
        </div>
      ))}
    </div>
  );
};
