import React, { useState } from 'react';
import { useComments } from '../hooks/useComments';
import { useCommentMutations } from '../hooks/useCommentsMutation';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';

interface Props {
  questionId: number;
}

export const CommentSection: React.FC<Props> = ({ questionId }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useComments({ questionId, page, limit: 10 });
  const { createMutation } = useCommentMutations(questionId);

  const handleCreateParentComment = (content: string) => {
    createMutation.mutate(
      { questionId, content },
      {
        onSuccess: () => {
          refetch(); // refresh toàn bộ comment sau khi gửi thành công
        },
      },
    );
  };

  const handleReplySuccess = () => {
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  if (isError) {
    return (
      <div className="text-red-500 text-center py-4">An error occurred while loading comments!</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-4 border-b pb-2">Discussion ({data?.meta.total || 0})</h3>

      <CommentForm
        onSubmit={handleCreateParentComment}
        isLoading={createMutation.isPending}
        placeholder="Write your comment about this question (Markdown supported)..."
      />

      <CommentList
        comments={data?.items || []}
        questionId={questionId}
        onReplySuccess={handleReplySuccess}
      />

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex gap-4 mt-8 justify-center items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="font-medium text-gray-700">
            Page {page} / {data.meta.totalPages}
          </span>
          <button
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
