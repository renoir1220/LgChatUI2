/**
 * 信息流评论组件
 * 
 * 展示评论列表、添加评论、回复评论等功能
 */

import React, { useState } from 'react';
import type { InfoFeedComment } from '@/types/infofeed';
import { useInfoFeedComments } from '../hooks/useInfoFeed';
import { getUsername, isAuthenticated } from '../../auth/utils/auth';

interface InfoFeedCommentsProps {
  feedId: number;
  className?: string;
}

interface CommentItemProps {
  comment: InfoFeedComment;
  onLike: (commentId: number) => void;
  onReply: (commentId: number) => void;
  isReplying: boolean;
  onAddReply: (content: string, parentId: number) => Promise<void>;
}

// 单个评论组件
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  isReplying,
  onAddReply
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // 处理回复提交
  const handleReplySubmit = async () => {
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      await onAddReply(replyText.trim(), comment.id);
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('回复失败:', error);
      // 这里可以显示错误提示
    } finally {
      setSubmittingReply(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const now = new Date();
    const commentTime = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    return commentTime.toLocaleDateString('zh-CN');
  };

  return (
    <div className="group">
      <div className="flex space-x-3">
        {/* 用户头像 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {comment.user?.username?.charAt(0) || '用'}
          </div>
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.user?.username || `用户${comment.user_id}`}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-4 mt-2 text-xs">
            {/* 点赞按钮 */}
            <button
              onClick={() => onLike(comment.id)}
              className={`
                flex items-center space-x-1 hover:text-red-500 transition-colors
                ${comment.is_liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
              `}
            >
              <svg className="w-4 h-4" fill={comment.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {comment.like_count > 0 && <span>{comment.like_count}</span>}
            </button>

            {/* 回复按钮 */}
            <button
              onClick={() => {
                setShowReplyInput(!showReplyInput);
                onReply(comment.id);
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              回复
            </button>
          </div>

          {/* 回复输入框 */}
          {showReplyInput && (
            <div className="mt-3 flex space-x-2">
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="写下你的回复..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setShowReplyInput(false);
                      setReplyText('');
                    }}
                    className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() || submittingReply}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {submittingReply ? '发送中...' : '发送'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 子评论/回复 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReply={onReply}
                  isReplying={isReplying}
                  onAddReply={onAddReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoFeedComments: React.FC<InfoFeedCommentsProps> = ({
  feedId,
  className = ''
}) => {
  const [newComment, setNewComment] = useState('');
  
  // 获取当前用户信息
  const isUserAuthenticated = isAuthenticated();
  const currentUsername = getUsername();
  
  const {
    comments,
    loading,
    error,
    hasMore,
    submitting,
    addComment,
    toggleCommentLike,
    loadMore
  } = useInfoFeedComments(feedId);

  // 处理添加评论
  const handleAddComment = async () => {
    if (!newComment.trim() || submitting || !isUserAuthenticated) return;

    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('发表评论失败:', error);
      // 这里可以显示错误提示
    }
  };

  // 处理回复评论
  const handleAddReply = async (content: string, parentId: number) => {
    if (!isUserAuthenticated) return;
    await addComment(content, parentId);
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* 评论标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          评论 ({comments.length})
        </h3>
      </div>

      {/* 添加评论 */}
      {isUserAuthenticated ? (
        <div className="mb-6">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {currentUsername?.charAt(0) || '我'}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的看法..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '发表中...' : '发表评论'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            请先登录后再参与讨论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">💬</div>
          <p className="text-gray-600 dark:text-gray-400">
            还没有评论，来发表第一个吧！
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={toggleCommentLike}
              onReply={() => {}}
              isReplying={false}
              onAddReply={handleAddReply}
            />
          ))}

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
              >
                {loading ? '加载中...' : '查看更多评论'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoFeedComments;
