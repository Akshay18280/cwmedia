import { supabase } from '../lib/supabase';
import type { Post } from '../types/post';
import type { NewsletterPreferences } from '../types/newsletter';

// src/pages/Posts.tsx
const getPosts = async () => {
    const { data, error } = await supabase.from('posts').select('*');
  
    if (error) {
      console.error(error.message);
    } else {
      console.log(data);
    }
  };

  const createPost = async (post: Post) => {
    const { error } = await supabase.from('posts').insert([post]);
  
    if (error) {
      console.error(error.message);
    }
  };
  
  const updatePost = async (id: string, post: Partial<Post>) => {
    const { error } = await supabase.from('posts').update(post).eq('id', id);
  
    if (error) {
      console.error(error.message);
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
  
    if (error) {
      console.error(error.message);
    }
  };

  const subscribe = async (email: string, preferences: NewsletterPreferences) => {
    const { error } = await supabase.from('newsletters').insert([{
      email,
      preferences,
      status: 'active'
    }]);
  
    if (error) {
      console.error(error.message);
    }
  };

  const unsubscribe = async (email: string) => {
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('email', email);
  
    if (error) {
      console.error(error.message);
    }
  };

  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error(error.message);
    return user;
  };
          