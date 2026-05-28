// components/CursorOverlay.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CursorData } from '../hooks/useCursorSync';

interface CursorOverlayProps {
  cursors: Map<string, CursorData>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors, containerRef }) => {
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerRect(el.getBoundingClientRect());
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
    };
  }, [containerRef]);

  if (!containerRect || cursors.size === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: containerRect.width,
        height: containerRect.height,
        transform: `translate(${containerRect.left}px, ${containerRect.top}px)`,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'visible',
      }}
    >
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            transition: 'transform 75ms ease-out',
            pointerEvents: 'none',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M5.5 3.5L19 12L12 13L9 20L5.5 3.5Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '0px',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              backgroundColor: cursor.color,
              color: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }}
          >
            {cursor.displayName}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
};
