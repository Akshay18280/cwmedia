import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Heart, Eye } from 'lucide-react';
import { postsService } from '../services/posts';
import type { Post } from '../types';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const data = await postsService.getPostById(id);
        
        // Increment view count
        await postsService.incrementViews(id);

        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;

    try {
      const newLikes = await postsService.incrementLikes(post.id);
      setPost({ ...post, likes: newLikes });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post Not Found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The post you're looking for doesn't exist.</p>
          <Link to="/blog" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link 
        to="/blog" 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Blog
      </Link>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="mb-8">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Category */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {post.category}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
        {post.title}
      </h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(post.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          {post.reading_time} min read
        </div>
        <div className="flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          {post.views || 0} views
        </div>
        <button
          onClick={handleLike}
          className="flex items-center hover:text-red-500 transition-colors"
        >
          <Heart className="w-4 h-4 mr-2" />
          {post.likes || 0} likes
        </button>
      </div>

      {/* Author */}
      {post.author && (
        <div className="flex items-center mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <img
            src={post.author.avatar_url || '/images/default-avatar.png'}
            alt={post.author.name}
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{post.author.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
} 