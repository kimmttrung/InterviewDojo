import React from 'react';
import { CommentItemType } from '../types/comment.types';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: CommentItemType[];
  questionId: number;
  onReplySuccess?: () => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  questionId,
  onReplySuccess,
}) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 italic">
        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          questionId={questionId}
          onReplySuccess={onReplySuccess}
        />
      ))}
    </div>
  );
};
