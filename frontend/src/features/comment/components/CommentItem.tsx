import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flag,
} from 'lucide-react';
import { CommentItemType } from '../types/comment.types';
import { useCommentUIStore } from '../stores/comment.store';
import { CommentForm } from './CommentForm';
import { useCommentMutations } from '../hooks/useCommentsMutation';
import { ReportCommentModal } from './ReportCommentModal';
import { useReportComment } from '../hooks/useReportComments';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface Props {
  comment: CommentItemType;
  questionId: number;
  isReply?: boolean;
  onReplySuccess?: () => void;
  rootId?: number;
}

export const CommentItem: React.FC<Props> = ({
  comment,
  questionId,
  isReply = false,
  onReplySuccess,
  rootId,
}) => {
  const { replyingToId, editingId, setReplyingTo, setEditingId } = useCommentUIStore();
  const { createMutation, updateMutation, deleteMutation } = useCommentMutations(questionId);
  const [showReplies, setShowReplies] = useState(true);
  const [liked, setLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { mutate: reportComment, isPending: isReporting } = useReportComment();
  const { isAuthenticated, accessToken } = useAuthStore();
  const currentUserId = React.useMemo(() => {
    if (!accessToken) return null;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      return Number(payload.sub || payload.id);
    } catch (error) {
      return null;
    }
  }, [accessToken]);

  const isMyComment = currentUserId === Number(comment.user.id);

  const handleReport = (reason: string) => {
    reportComment({ commentId: comment.id, reason });
    setReportModalOpen(false);
  };

  const isReplying = replyingToId === comment.id;
  const isEditing = editingId === comment.id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReplySubmit = (content: string) => {
    const finalParentId = rootId || comment.id;
    const finalContent = isReply ? `**@${comment.user.name}** ${content}` : content;

    createMutation.mutate(
      { questionId, content: finalContent, parentId: finalParentId },
      {
        onSuccess: () => {
          setReplyingTo(null);
          onReplySuccess?.();
        },
      },
    );
  };

  const handleEditSubmit = (content: string) => {
    updateMutation.mutate(
      { commentId: comment.id, content },
      {
        onSuccess: () => {
          setEditingId(null);
          onReplySuccess?.();
        },
      },
    );
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
      deleteMutation.mutate(comment.id, {
        onSuccess: () => onReplySuccess?.(),
      });
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <>
      <div className={`flex gap-3 py-3 ${isReply ? 'ml-10 border-l-2 pl-4 mt-2' : 'border-b'}`}>
        <img
          src={comment.user.avatarUrl || '/default-avatar.png'}
          alt={comment.user.name || 'User'}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* Header & 3-dot Menu */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{comment.user.name || 'Anonymous'}</span>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
              {comment.isEdited && !comment.isDeleted && (
                <span className="text-xs text-gray-400 italic">(đã chỉnh sửa)</span>
              )}
            </div>

            {/* Nút 3 chấm (Dropdown Menu) */}
            {!comment.isDeleted && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-36 bg-white shadow-lg border-slate-100 rounded-xl"
                >
                  {/* Nếu LÀ comment của TÔI -> Hiện Sửa / Xóa */}
                  {isMyComment && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setEditingId(comment.id)}
                        className="cursor-pointer font-medium text-slate-600"
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Xóa
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Nếu KHÔNG PHẢI comment của TÔI -> Hiện Báo cáo */}
                  {isAuthenticated && !isMyComment && (
                    <DropdownMenuItem
                      onClick={() => setReportModalOpen(true)}
                      className="cursor-pointer font-medium text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                    >
                      <Flag className="w-4 h-4 mr-2" /> Báo cáo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <CommentForm
              initialValue={comment.content}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingId(null)}
              isLoading={updateMutation.isPending}
              autoFocus={true}
            />
          ) : (
            <div
              className={`prose prose-sm max-w-none ${comment.isDeleted ? 'text-gray-400 italic' : 'text-gray-700'}`}
            >
              {comment.isDeleted ? (
                <p>Bình luận này đã bị xóa.</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
              )}
            </div>
          )}

          {/* Action Bar (Chỉ giữ lại Trả lời & Thích) */}
          {!comment.isDeleted && !isEditing && (
            <div className="flex gap-4 mt-2 text-sm text-gray-500 font-medium">
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="hover:text-indigo-600 transition-colors"
              >
                Trả lời
              </button>

              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{likeCount}</span>
              </button>
            </div>
          )}

          {/* Form Trả lời */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                initialValue=""
                onSubmit={handleReplySubmit}
                onCancel={() => setReplyingTo(null)}
                isLoading={createMutation.isPending}
                placeholder={`Trả lời ${comment.user.name}...`}
                autoFocus={true}
              />
            </div>
          )}

          {/* Replies Tree */}
          {hasReplies && (
            <div className="mt-4">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full mb-2 transition-colors"
              >
                {showReplies ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {showReplies ? 'Thu gọn' : 'Hiện'} {comment.replies!.length} phản hồi
              </button>
              {showReplies && (
                <div className="space-y-2 border-l border-gray-100">
                  {comment.replies!.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      questionId={questionId}
                      isReply={true}
                      onReplySuccess={onReplySuccess}
                      rootId={rootId || comment.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Đã chuyển Modal vào bên trong <> </> để fix lỗi không render */}
      <ReportCommentModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReport}
        isSubmitting={isReporting}
      />
    </>
  );
};
