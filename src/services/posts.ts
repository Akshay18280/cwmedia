import { supabase } from '../lib/supabase';

export interface CreatePostData {
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  category: string;
  tags?: string[];
  cover_image?: string;
  reading_time?: number;
  featured?: boolean;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  cover_image?: string;
  reading_time?: number;
  featured?: boolean;
}

export const postsService = {
  // Get all posts
  async getAllPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(
          id,
          name,
          avatar_url
        )
      `)
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    return data || [];
  },

  // Get featured posts
  async getFeaturedPosts(limit = 3) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch featured posts: ${error.message}`);
    }

    return data || [];
  },

  // Get single post by ID
  async getPostById(id: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch post: ${error.message}`);
    }

    return data;
  },

  // Create new post
  async createPost(postData: CreatePostData) {
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data;
  },

  // Update post
  async updatePost(id: string, updates: UpdatePostData) {
    const { data, error } = await supabase
      .from('posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }

    return data;
  },

  // Delete post
  async deletePost(id: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }

    return true;
  },

  // Increment post views
  async incrementViews(id: string) {
    // Direct update approach since RPC function may not exist
    const { data: post } = await supabase
      .from('posts')
      .select('views')
      .eq('id', id)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ views: (post.views || 0) + 1 })
        .eq('id', id);
    }
  },

  // Increment post likes
  async incrementLikes(id: string) {
    const { data: post } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', id)
      .single();

    if (post) {
      const { data, error } = await supabase
        .from('posts')
        .update({ likes: (post.likes || 0) + 1 })
        .eq('id', id)
        .select('likes')
        .single();

      if (error) {
        throw new Error(`Failed to like post: ${error.message}`);
      }

      return data.likes;
    }

    throw new Error('Post not found');
  },

  // Search posts
  async searchPosts(query: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(
          id,
          name,
          avatar_url
        )
      `)
      .or(`title.ilike.%${query}%, content.ilike.%${query}%, excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }

    return data || [];
  },

  // Get posts by category
  async getPostsByCategory(category: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('category', category)
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by category: ${error.message}`);
    }

    return data || [];
  },

  // Get posts by tag
  async getPostsByTag(tag: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(
          id,
          name,
          avatar_url
        )
      `)
      .contains('tags', [tag])
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by tag: ${error.message}`);
    }

    return data || [];
  }
};
