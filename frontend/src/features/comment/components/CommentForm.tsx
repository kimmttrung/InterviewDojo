import React, { useState, useRef, useEffect } from 'react';

interface CommentFormProps {
  initialValue?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isLoading: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  initialValue = '',
  onSubmit,
  onCancel,
  isLoading,
  placeholder = 'Viết bình luận...',
  autoFocus = false,
}) => {
  const [content, setContent] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(!!initialValue || autoFocus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
    setIsExpanded(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleCancel = () => {
    setContent(initialValue);
    setIsExpanded(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full mb-1">
      <div
        className={`relative border rounded-lg overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'bg-white shadow-sm ring-1 ring-indigo-500/20 border-indigo-500'
            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onFocus={() => setIsExpanded(true)}
          placeholder={placeholder}
          disabled={isLoading}
          rows={isExpanded ? 2 : 1}
          // Giảm padding (px-3 py-2), xóa min-h, đặt block và text-sm
          className="w-full px-3 py-2 bg-transparent resize-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 custom-scrollbar block leading-relaxed"
        />

        {isExpanded && (
          // Giảm padding khu vực nút bấm (p-1.5)
          <div className="flex gap-2 justify-end items-center bg-slate-50 p-1.5 border-t border-slate-100 animate-in fade-in duration-200">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                // Nút thu nhỏ lại thành text-xs, padding nhỏ
                className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              // Nút thu nhỏ lại thành text-xs, padding nhỏ
              className="px-4 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:bg-indigo-400 transition-all shadow-sm"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
