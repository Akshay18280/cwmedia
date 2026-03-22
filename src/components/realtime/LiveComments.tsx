/**
 * Live Comments Component
 * Real-time comment system with live updates and typing indicators
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Reply, MoreHorizontal, Edit, Trash2, Flag, Clock, MessageCircle } from 'lucide-react';
import { liveCommentService, Comment, CommentDraft, TypingUser } from '../../services/realtime/LiveCommentService';
import { useAuth } from '../../contexts/AuthContext';
import { ModernButton, ModernCard } from '../ModernDesignSystem';
import { toast } from 'sonner';

interface LiveCommentsProps {
  postId: string;
  allowComments?: boolean;
  allowReplies?: boolean;
  moderationEnabled?: boolean;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onLike: (commentId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onLike,
  currentUserId,
  isAdmin = false,
  level = 0
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const isAuthor = currentUserId === comment.author.id;
  const canModerate = isAdmin || isAuthor;

  const handleLike = async () => {
    try {
      await onLike(comment.id);
      setIsLiked(!isLiked);
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-blue-500 font-medium">{part}</span>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-low-contrast pl-4' : ''}`}>
      <div className="flex space-x-3 group">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-flow rounded-full flex items-center justify-center">
              <span className="text-white text-body-sm font-medium">
                {comment.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-medium-contrast rounded-lg px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-high-contrast">
                  {comment.author.name}
                </span>
                {comment.author.role && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-caption font-medium">
                    {comment.author.role}
                  </span>
                )}
                <span className="text-low-contrast text-body-sm">
                  {formatTimeAgo(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-low-contrast text-caption">(edited)</span>
                )}
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-low-contrast hover:text-medium-contrast transition-colors rounded opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-medium-contrast border border-medium-contrast rounded-lg shadow-lg z-10 min-w-[120px]">
                    <div className="py-1">
                      {canModerate && (
                        <>
                          <button
                            onClick={() => {
                              onEdit(comment);
                              setShowMenu(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-body-sm text-medium-contrast hover:bg-low-contrast transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              onDelete(comment.id);
                              setShowMenu(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-body-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </>
                      )}
                      {!isAuthor && (
                        <button
                          onClick={() => {
                            onReport(comment.id);
                            setShowMenu(false);
                          }}
                          className="flex items-center w-full px-3 py-2 text-body-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="text-medium-contrast leading-relaxed">
              {renderMentions(comment.content)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-2 text-body-sm">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-low-contrast hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
            </button>

            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center space-x-1 text-low-contrast hover:text-medium-contrast transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>

            {comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
              </button>
            )}
          </div>

          {/* Replies */}
          {showReplies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                  onLike={onLike}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC<{ users: TypingUser[] }> = ({ users }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-low-contrast text-body-sm p-2">
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

export const LiveComments: React.FC<LiveCommentsProps> = ({
  postId,
  allowComments = true,
  allowReplies = true,
  moderationEnabled = false,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Subscribe to comments
  useEffect(() => {
    const unsubscribe = liveCommentService.subscribeToComments(postId, (newComments) => {
      setComments(newComments);
      setLoading(false);
    });

    return unsubscribe;
  }, [postId]);

  // Subscribe to typing indicators
  useEffect(() => {
    const unsubscribe = liveCommentService.subscribeToTyping(postId, (users) => {
      // Filter out current user
      const otherUsers = users.filter(u => u.userId !== currentUser?.id);
      setTypingUsers(otherUsers);
    });

    return unsubscribe;
  }, [postId, currentUser?.id]);

  // Handle typing
  const handleTyping = () => {
    if (!currentUser) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    liveCommentService.startTyping(postId, currentUser.id, currentUser.name);

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      liveCommentService.stopTyping(postId, currentUser.id);
    }, 1000);
  };

  // Handle comment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newComment.trim()) return;

    setSubmitting(true);

    try {
      const draft: CommentDraft = {
        postId,
        content: newComment.trim(),
        parentId: replyingTo,
        authorId: currentUser.id
      };

      if (editingComment) {
        await liveCommentService.updateComment(editingComment.id, newComment.trim(), currentUser.id);
        setEditingComment(null);
        toast.success('Comment updated successfully');
      } else {
        await liveCommentService.addComment(draft);
        toast.success('Comment added successfully');
      }

      // Reset form
      setNewComment('');
      setReplyingTo(null);

      // Stop typing indicator
      liveCommentService.stopTyping(postId, currentUser.id);

    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment actions
  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    textareaRef.current?.focus();
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
    textareaRef.current?.focus();
  };

  const handleDelete = async (commentId: string) => {
    if (!currentUser) return;

    try {
      await liveCommentService.deleteComment(commentId, currentUser.id);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReport = async (commentId: string) => {
    // In production, implement reporting functionality
    toast.info('Comment reported to moderators');
  };

  const handleLike = async (commentId: string) => {
    if (!currentUser) return;

    try {
      await liveCommentService.toggleLike(commentId, currentUser.id);
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setEditingComment(null);
    setNewComment('');
  };

  if (!allowComments) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-medium-contrast">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p>Comments are disabled for this post.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-title font-bold text-high-contrast">
          Comments ({comments.length})
        </h3>
        {moderationEnabled && (
          <span className="text-body-sm text-low-contrast">
            Comments are moderated
          </span>
        )}
      </div>

      {/* Comment Form */}
      {currentUser ? (
        <ModernCard className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(replyingTo || editingComment) && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <span className="text-body-sm text-blue-600 dark:text-blue-400">
                  {editingComment ? 'Editing comment' : 'Replying to comment'}
                </span>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-flow rounded-full flex items-center justify-center">
                    <span className="text-white text-body-sm font-medium">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    handleTyping();
                  }}
                  placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
                  className="w-full px-4 py-3 bg-low-contrast border border-medium-contrast rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-high-contrast placeholder-low-contrast"
                  rows={3}
                  disabled={submitting}
                />

                <div className="flex items-center justify-between mt-2">
                  <div className="text-body-sm text-low-contrast">
                    Use @ to mention users
                  </div>
                  <ModernButton
                    type="submit"
                    variant="default"
                    intent="primary"
                    size="sm"
                    icon={Send}
                    iconPosition="right"
                    disabled={!newComment.trim() || submitting}
                    loading={submitting}
                  >
                    {editingComment ? 'Update' : 'Post'}
                  </ModernButton>
                </div>
              </div>
            </div>
          </form>
        </ModernCard>
      ) : (
        <ModernCard className="p-6 text-center">
          <p className="text-medium-contrast mb-4">
            Please sign in to leave a comment
          </p>
          <ModernButton
            variant="default"
            intent="primary"
            onClick={() => window.location.href = '/login'}
          >
            Sign In
          </ModernButton>
        </ModernCard>
      )}

      {/* Typing Indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-medium-contrast">Loading comments...</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={allowReplies ? handleReply : () => {}}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReport={handleReport}
              onLike={handleLike}
              currentUserId={currentUser?.id}
              isAdmin={currentUser?.role === 'admin'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-medium-contrast">
            <MessageCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        </div>
      )}
    </div>
  );
}; 