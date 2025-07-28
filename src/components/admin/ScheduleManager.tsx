import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Globe, Eye, EyeOff, Play, Pause, Edit, Trash2 } from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';
import { toast } from 'sonner';

interface ScheduledPost {
  id: string;
  title: string;
  scheduledAt: Date;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  category: string;
  estimatedViews: number;
  timeZone: string;
}

interface ScheduleManagerProps {
  onScheduleUpdate?: (posts: ScheduledPost[]) => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ onScheduleUpdate }) => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/posts/scheduled');
      const data = await response.json();
      setScheduledPosts(data.map((post: any) => ({
        ...post,
        scheduledAt: new Date(post.scheduledAt)
      })));
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (postId: string, newDateTime: Date) => {
    try {
      await fetch(`/api/admin/posts/${postId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledAt: newDateTime.toISOString(),
          timeZone
        })
      });
      
      setScheduledPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, scheduledAt: newDateTime }
            : post
        )
      );
      
      toast.success('Schedule updated successfully');
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const cancelSchedule = async (postId: string) => {
    try {
      await fetch(`/api/admin/posts/${postId}/schedule`, {
        method: 'DELETE'
      });
      
      setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Schedule cancelled');
    } catch (error) {
      toast.error('Failed to cancel schedule');
    }
  };

  const publishNow = async (postId: string) => {
    try {
      await fetch(`/api/admin/posts/${postId}/publish`, {
        method: 'POST'
      });
      
      setScheduledPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, status: 'publishing' as const }
            : post
        )
      );
      
      toast.success('Publishing post now...');
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const getOptimalTimes = () => {
    const now = new Date();
    const optimal = [
      { time: '09:00', label: 'Morning Peak', engagement: 'High' },
      { time: '12:00', label: 'Lunch Break', engagement: 'Medium' },
      { time: '15:00', label: 'Afternoon', engagement: 'Medium' },
      { time: '18:00', label: 'Evening Peak', engagement: 'High' },
      { time: '20:00', label: 'Prime Time', engagement: 'Very High' }
    ];
    
    return optimal.map(slot => ({
      ...slot,
      datetime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 
                        parseInt(slot.time.split(':')[0]), parseInt(slot.time.split(':')[1]))
    }));
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone
    }).format(date);
  };

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'publishing': return 'text-yellow-600 bg-yellow-100';
      case 'published': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysUntilPost = (scheduledAt: Date) => {
    const now = new Date();
    const diffTime = scheduledAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days overdue`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <ModernCard variant="gradient-flow" padding="lg" className="text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Schedule Manager</h2>
            <p className="text-white/80">Plan and optimize your content publishing</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{scheduledPosts.length}</div>
            <div className="text-white/80">Scheduled Posts</div>
          </div>
        </div>
      </ModernCard>

      {/* Calendar and Optimal Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Date Picker */}
        <ModernCard variant="neumorphic" padding="lg">
          <h3 className="text-xl font-bold mb-4 text-gradient-accent">Select Date</h3>
          
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="input-modern w-full mb-4"
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Time Zone</label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="input-modern w-full"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London Time</option>
              <option value="Asia/Tokyo">Tokyo Time</option>
              <option value="Asia/Kolkata">India Time</option>
            </select>
          </div>
        </ModernCard>

        {/* Optimal Times */}
        <ModernCard variant="glass" padding="lg">
          <h3 className="text-xl font-bold mb-4 text-holographic">Optimal Publishing Times</h3>
          
          <div className="space-y-3">
            {getOptimalTimes().map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-low-contrast rounded-lg">
                <div>
                  <div className="font-medium text-high-contrast">{slot.time} - {slot.label}</div>
                  <div className="text-sm text-medium-contrast">
                    Engagement: {slot.engagement}
                  </div>
                </div>
                <div className="text-sm text-low-contrast">
                  {formatDateTime(slot.datetime)}
                </div>
              </div>
            ))}
          </div>
        </ModernCard>
      </div>

      {/* Scheduled Posts List */}
      <ModernCard variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gradient-accent">Scheduled Posts</h3>
          <ModernButton
            variant="minimal"
            intent="primary"
            icon={Calendar}
            onClick={loadScheduledPosts}
          >
            Refresh
          </ModernButton>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-gradient-accent rounded-full mx-auto mb-4"></div>
            <p className="text-medium-contrast">Loading scheduled posts...</p>
          </div>
        ) : scheduledPosts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-high-contrast mb-2">No scheduled posts</h4>
            <p className="text-medium-contrast">Schedule your posts to automate publishing</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-high-contrast mb-1">{post.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-medium-contrast">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDateTime(post.scheduledAt)}
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        {post.category}
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        ~{post.estimatedViews} views
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    
                    <div className="text-sm text-low-contrast">
                      {getDaysUntilPost(post.scheduledAt)}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <ModernButton
                        variant="minimal"
                        intent="accent"
                        size="sm"
                        icon={Play}
                        onClick={() => publishNow(post.id)}
                      >
                        Publish Now
                      </ModernButton>
                      
                      <ModernButton
                        variant="minimal"
                        intent="secondary"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                          const newDate = prompt('Enter new date/time (YYYY-MM-DD HH:MM):');
                          if (newDate) {
                            updateSchedule(post.id, new Date(newDate));
                          }
                        }}
                      >
                        Edit
                      </ModernButton>
                      
                      <ModernButton
                        variant="minimal"
                        intent="error"
                        size="sm"
                        icon={Trash2}
                        onClick={() => cancelSchedule(post.id)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModernCard>

      {/* Analytics Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernCard variant="neumorphic" padding="lg" className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {scheduledPosts.filter(p => p.status === 'scheduled').length}
          </div>
          <div className="text-medium-contrast">Pending</div>
        </ModernCard>
        
        <ModernCard variant="glass" padding="lg" className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {scheduledPosts.filter(p => p.status === 'published').length}
          </div>
          <div className="text-medium-contrast">Published</div>
        </ModernCard>
        
        <ModernCard variant="brutalist" padding="lg" className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {scheduledPosts.reduce((total, post) => total + post.estimatedViews, 0)}
          </div>
          <div className="text-medium-contrast">Est. Total Views</div>
        </ModernCard>
      </div>
    </div>
  );
}; 