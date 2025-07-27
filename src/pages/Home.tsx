import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Newsletter from '../components/Newsletter';
import { postsService } from '../services/posts';
import type { Post } from '../types';

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const posts = await postsService.getFeaturedPosts(3);
        setFeaturedPosts(posts);
      } catch (error) {
        console.error('Error fetching featured posts:', error);
        // If no featured posts, fetch latest posts as fallback
        try {
          const allPosts = await postsService.getAllPosts();
          setFeaturedPosts(allPosts.slice(0, 3));
        } catch (fallbackError) {
          console.error('Error fetching posts:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Welcome to</span>
            <span className="block text-blue-600">Carelwave Media</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Exploring the intersection of technology, innovation, and development. Join me on this journey through the digital landscape.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link to="/blog" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                Read Blog
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link to="/about" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                About Me
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Featured Posts</h2>
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.length > 0 ? (
                featuredPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                    <img 
                      src={post.cover_image || "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1200"} 
                      alt={post.title} 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">{post.excerpt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                        <Link 
                          to={`/blog/${post.id}`} 
                          className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
                        >
                          Read more →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Check back later for exciting content!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Newsletter />
    </div>
  );
}