import React, { useState, useEffect } from 'react';
import { MessageSquare, Eye, EyeOff, Trash2, Reply, Flag, CheckCircle, XCircle } from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: Date;
  isApproved: boolean;
  isVisible: boolean;
  replies: Comment[];
  isSpam: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface CommentManagerProps {
  postId?: string;
}

export const CommentManager: React.FC<CommentManagerProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const url = postId ? `/api/admin/comments?postId=${postId}` : '/api/admin/comments';
      const response = await fetch(url);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const approveComment = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}/approve`, { method: 'POST' });
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, isApproved: true, isVisible: true }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to approve comment:', error);
    }
  };

  const hideComment = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}/hide`, { method: 'POST' });
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, isVisible: false }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to hide comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const replyToComment = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText })
      });
      setReplyText('');
      setSelectedComment(null);
      loadComments();
    } catch (error) {
      console.error('Failed to reply to comment:', error);
    }
  };

  const markAsSpam = async (commentId: string) => {
    try {
      await fetch(`/api/admin/comments/${commentId}/spam`, { method: 'POST' });
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, isSpam: true, isVisible: false }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to mark as spam:', error);
    }
  };

  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'pending': return !comment.isApproved;
      case 'approved': return comment.isApproved;
      case 'hidden': return !comment.isVisible;
      case 'spam': return comment.isSpam;
      default: return true;
    }
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ModernCard variant="gradient-flow" padding="lg" className="text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-subtitle font-bold">Comment Management</h2>
            <p className="text-white/80">Moderate and respond to user comments</p>
          </div>
          <div className="text-right">
            <div className="text-title font-bold">{comments.length}</div>
            <div className="text-white/80">Total Comments</div>
          </div>
        </div>
      </ModernCard>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Comments', count: comments.length },
          { key: 'pending', label: 'Pending Approval', count: comments.filter(c => !c.isApproved).length },
          { key: 'approved', label: 'Approved', count: comments.filter(c => c.isApproved).length },
          { key: 'hidden', label: 'Hidden', count: comments.filter(c => !c.isVisible).length },
          { key: 'spam', label: 'Spam', count: comments.filter(c => c.isSpam).length }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all duration-200 ${
              filter === filterOption.key
                ? 'bg-gradient-flow text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gradient-flow-subtle hover:text-white dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map(comment => (
          <ModernCard key={comment.id} variant="default" padding="lg">
            <div className="space-y-4">
              {/* Comment Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-flow rounded-full flex items-center justify-center text-white font-bold">
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gradient-accent">{comment.userName}</div>
                    <div className="text-body-sm text-gray-500">{comment.userEmail}</div>
                    <div className="text-caption text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Sentiment Indicator */}
                  <span className={`text-body-sm ${getSentimentColor(comment.sentiment)}`}>
                    {getSentimentIcon(comment.sentiment)} {comment.sentiment}
                  </span>
                  
                  {/* Status Badges */}
                  {comment.isSpam && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-caption rounded-full">
                      Spam
                    </span>
                  )}
                  {!comment.isApproved && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-caption rounded-full">
                      Pending
                    </span>
                  )}
                  {comment.isApproved && comment.isVisible && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-caption rounded-full">
                      Live
                    </span>
                  )}
                  {!comment.isVisible && !comment.isSpam && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-caption rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
              </div>

              {/* Comment Content */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-high-contrast">{comment.content}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {!comment.isApproved && (
                    <ModernButton
                      variant="minimal"
                      intent="success"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => approveComment(comment.id)}
                    >
                      Approve
                    </ModernButton>
                  )}
                  
                  {comment.isVisible ? (
                    <ModernButton
                      variant="minimal"
                      intent="warning"
                      size="sm"
                      icon={EyeOff}
                      onClick={() => hideComment(comment.id)}
                    >
                      Hide
                    </ModernButton>
                  ) : (
                    <ModernButton
                      variant="minimal"
                      intent="accent"
                      size="sm"
                      icon={Eye}
                      onClick={() => approveComment(comment.id)}
                    >
                      Show
                    </ModernButton>
                  )}
                  
                  <ModernButton
                    variant="minimal"
                    intent="primary"
                    size="sm"
                    icon={Reply}
                    onClick={() => setSelectedComment(comment)}
                  >
                    Reply
                  </ModernButton>
                  
                  {!comment.isSpam && (
                    <ModernButton
                      variant="minimal"
                      intent="warning"
                      size="sm"
                      icon={Flag}
                      onClick={() => markAsSpam(comment.id)}
                    >
                      Spam
                    </ModernButton>
                  )}
                  
                  <ModernButton
                    variant="minimal"
                    intent="error"
                    size="sm"
                    icon={Trash2}
                    onClick={() => deleteComment(comment.id)}
                  >
                    Delete
                  </ModernButton>
                </div>

                <div className="text-body-sm text-gray-500">
                  Visible to: Commenter & Admin only
                </div>
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-low-contrast pl-4">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-body-sm font-medium text-blue-800 dark:text-blue-300">
                        Admin Reply
                      </div>
                      <div className="text-body-sm text-blue-700 dark:text-blue-400 mt-1">
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {selectedComment?.id === comment.id && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="input-modern w-full h-24 resize-none"
                  />
                  <div className="flex items-center justify-end space-x-2 mt-3">
                    <ModernButton
                      variant="minimal"
                      intent="secondary"
                      size="sm"
                      onClick={() => setSelectedComment(null)}
                    >
                      Cancel
                    </ModernButton>
                    <ModernButton
                      variant="default"
                      intent="primary"
                      size="sm"
                      icon={Reply}
                      onClick={() => replyToComment(comment.id)}
                      disabled={!replyText.trim()}
                    >
                      Send Reply
                    </ModernButton>
                  </div>
                </div>
              )}
            </div>
          </ModernCard>
        ))}
      </div>

      {filteredComments.length === 0 && (
        <ModernCard variant="neumorphic" padding="xl" className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-body-lg font-bold text-medium-contrast mb-2">
            No comments found
          </h3>
          <p className="text-subtle">
            {filter === 'all' ? 'No comments yet.' : `No ${filter} comments.`}
          </p>
        </ModernCard>
      )}
    </div>
  );
}; 