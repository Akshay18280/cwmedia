import { firebasePostsService } from './posts.service';
import { firebaseNewsletterService } from './newsletter.service';

export interface BlogStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  avgReadingTime: number;
  monthlyViews: number;
  weeklyViews: number;
  totalSubscribers: number;
  activeSubscribers: number;
  systemUptime: number;
  countriesReached: number;
  topPosts: any[];
}

class FirebaseStatsService {
  private cache: { [key: string]: { data: any; timestamp: number } } = {};
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get from cache or fetch fresh data
  private async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache[key];
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    const freshData = await fetcher();
    this.cache[key] = { data: freshData, timestamp: now };
    return freshData;
  }

  // Format large numbers
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Format uptime percentage
  formatUptime(uptime: number): string {
    return uptime.toFixed(1) + '%';
  }

  // Get basic blog statistics
  async getBlogStats(): Promise<BlogStats> {
    return this.getCachedData('blogStats', async () => {
      try {
        const [postStats, newsletterStats] = await Promise.all([
          firebasePostsService.getPostStats(),
          firebaseNewsletterService.getStats()
        ]);

        // Calculate estimated monthly and weekly views
        const monthlyViews = Math.max(postStats.totalViews, Math.floor(postStats.totalViews * 1.5));
        const weeklyViews = Math.floor(monthlyViews * 0.25);

        // Calculate countries reached based on views (estimation)
        const countriesReached = Math.min(195, Math.max(5, Math.floor(postStats.totalViews / 200) + 5));

        // System uptime (simulated - in production, use actual monitoring)
        const systemUptime = 99.9 + (Math.random() * 0.09); // 99.9% - 99.99%

        return {
          totalPosts: postStats.totalPosts,
          totalViews: postStats.totalViews,
          totalLikes: postStats.totalLikes,
          avgReadingTime: postStats.avgReadingTime,
          monthlyViews,
          weeklyViews,
          totalSubscribers: newsletterStats.totalSubscribers,
          activeSubscribers: newsletterStats.activeSubscribers,
          systemUptime,
          countriesReached,
          topPosts: [] // Could be populated with top performing posts
        };
      } catch (error) {
        console.error('Error fetching blog stats:', error);
        return this.getDefaultStats();
      }
    });
  }

  // Get real-time statistics with caching
  async getRealTimeStats(): Promise<BlogStats> {
    return this.getCachedData('realTimeStats', async () => {
      try {
        const baseStats = await this.getBlogStats();

        // Add any real-time enhancements here
        // For example, live visitor count, recent interactions, etc.

        return {
          ...baseStats,
          // Add any real-time specific data
        };
      } catch (error) {
        console.error('Error fetching real-time stats:', error);
        return this.getDefaultStats();
      }
    });
  }

  // Get dashboard statistics (for admin)
  async getDashboardStats(): Promise<{
    postsThisMonth: number;
    viewsThisMonth: number;
    newSubscribersThisMonth: number;
    topPerformingPosts: any[];
    recentActivity: any[];
  }> {
    return this.getCachedData('dashboardStats', async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all posts for analysis
        const allPosts = await firebasePostsService.getAllPosts();
        
        // Filter posts from this month
        const postsThisMonth = allPosts.filter(post => 
          new Date(post.published_at) >= startOfMonth
        );

        // Calculate monthly views (estimation based on total views)
        const viewsThisMonth = Math.floor(
          allPosts.reduce((sum, post) => sum + (post.views || 0), 0) * 0.3
        );

        // Get newsletter stats
        const newsletterStats = await firebaseNewsletterService.getStats();
        const newSubscribersThisMonth = Math.floor(newsletterStats.activeSubscribers * 0.1); // Estimation

        // Get top performing posts
        const topPerformingPosts = allPosts
          .sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
          .slice(0, 5)
          .map(post => ({
            id: post.id,
            title: post.title,
            views: post.views,
            likes: post.likes,
            engagement: post.views + post.likes
          }));

        // Simulate recent activity
        const recentActivity = [
          { type: 'post_view', count: Math.floor(Math.random() * 50) + 10, timeframe: 'Last hour' },
          { type: 'newsletter_signup', count: Math.floor(Math.random() * 5) + 1, timeframe: 'Today' },
          { type: 'post_like', count: Math.floor(Math.random() * 20) + 5, timeframe: 'Today' }
        ];

        return {
          postsThisMonth: postsThisMonth.length,
          viewsThisMonth,
          newSubscribersThisMonth,
          topPerformingPosts,
          recentActivity
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          postsThisMonth: 0,
          viewsThisMonth: 0,
          newSubscribersThisMonth: 0,
          topPerformingPosts: [],
          recentActivity: []
        };
      }
    });
  }

  // Get content performance analytics
  async getContentAnalytics(): Promise<{
    categoryPerformance: Array<{ category: string; posts: number; avgViews: number; avgLikes: number }>;
    tagPerformance: Array<{ tag: string; posts: number; totalViews: number }>;
    readingTimeAnalysis: { avgTime: number; distribution: Array<{ range: string; count: number }> };
  }> {
    return this.getCachedData('contentAnalytics', async () => {
      try {
        const allPosts = await firebasePostsService.getAllPosts();

        // Category performance
        const categoryMap = new Map<string, { posts: number; totalViews: number; totalLikes: number }>();
        
        allPosts.forEach(post => {
          const existing = categoryMap.get(post.category) || { posts: 0, totalViews: 0, totalLikes: 0 };
          categoryMap.set(post.category, {
            posts: existing.posts + 1,
            totalViews: existing.totalViews + (post.views || 0),
            totalLikes: existing.totalLikes + (post.likes || 0)
          });
        });

        const categoryPerformance = Array.from(categoryMap.entries()).map(([category, stats]) => ({
          category,
          posts: stats.posts,
          avgViews: Math.round(stats.totalViews / stats.posts),
          avgLikes: Math.round(stats.totalLikes / stats.posts)
        }));

        // Tag performance
        const tagMap = new Map<string, { posts: number; totalViews: number }>();
        
        allPosts.forEach(post => {
          post.tags?.forEach(tag => {
            const existing = tagMap.get(tag) || { posts: 0, totalViews: 0 };
            tagMap.set(tag, {
              posts: existing.posts + 1,
              totalViews: existing.totalViews + (post.views || 0)
            });
          });
        });

        const tagPerformance = Array.from(tagMap.entries())
          .map(([tag, stats]) => ({ tag, posts: stats.posts, totalViews: stats.totalViews }))
          .sort((a, b) => b.totalViews - a.totalViews)
          .slice(0, 10);

        // Reading time analysis
        const readingTimes = allPosts.map(post => post.reading_time);
        const avgTime = readingTimes.reduce((sum, time) => sum + time, 0) / readingTimes.length;

        const distribution = [
          { range: '1-3 min', count: readingTimes.filter(t => t >= 1 && t <= 3).length },
          { range: '4-6 min', count: readingTimes.filter(t => t >= 4 && t <= 6).length },
          { range: '7-10 min', count: readingTimes.filter(t => t >= 7 && t <= 10).length },
          { range: '10+ min', count: readingTimes.filter(t => t > 10).length }
        ];

        return {
          categoryPerformance,
          tagPerformance,
          readingTimeAnalysis: { avgTime: Math.round(avgTime), distribution }
        };
      } catch (error) {
        console.error('Error fetching content analytics:', error);
        return {
          categoryPerformance: [],
          tagPerformance: [],
          readingTimeAnalysis: { avgTime: 0, distribution: [] }
        };
      }
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache = {};
  }

  // Get default stats (fallback)
  private getDefaultStats(): BlogStats {
    return {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      avgReadingTime: 5,
      monthlyViews: 0,
      weeklyViews: 0,
      totalSubscribers: 0,
      activeSubscribers: 0,
      systemUptime: 99.9,
      countriesReached: 1,
      topPosts: []
    };
  }

  // Calculate geographic reach (estimation based on views)
  private calculateCountriesReached(totalViews: number): number {
    // Estimation: 1 country per 200 views, minimum 5, maximum 195
    return Math.min(195, Math.max(5, Math.floor(totalViews / 200) + 5));
  }

  // Calculate system uptime (in production, this would come from monitoring)
  private calculateSystemUptime(): number {
    // Simulate high uptime with slight variation
    return 99.9 + (Math.random() * 0.09); // 99.9% - 99.99%
  }
}

export const firebaseStatsService = new FirebaseStatsService(); 