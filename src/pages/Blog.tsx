import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsService } from '../services/posts';
import type { Post } from '../types';

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsService.getAllPosts();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Latest Articles
        </h1>
        <p className="mt-3 text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
          Dive deep into technology, development, and cloud computing
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            {post.cover_image && (
              <div className="h-64 w-full relative">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {post.category}
                  </span>
                </div>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString()}</time>
                <span>•</span>
                <span>{post.reading_time} min read</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {post.title}
              </h2>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
                {post.excerpt}
              </p>
              <div className="mt-4">
                {post.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mr-2"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  to={`/blog/${post.id}`}
                  className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
                >
                  Read full article →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}