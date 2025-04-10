import React from 'react';
import { Link } from 'react-router-dom';
import Newsletter from '../components/Newsletter';

export default function Home() {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Building Scalable Microservices with Go",
                excerpt: "Learn how to design and implement robust microservices architecture using Go and modern cloud practices.",
                image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1200",
                date: "March 15, 2024"
              },
              {
                title: "Advanced Docker Deployment Strategies",
                excerpt: "Explore advanced deployment patterns and container orchestration techniques for modern applications.",
                image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1200",
                date: "March 12, 2024"
              },
              {
                title: "AWS Lambda Best Practices",
                excerpt: "Deep dive into serverless architecture and best practices for AWS Lambda functions.",
                image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1200",
                date: "March 10, 2024"
              }
            ].map((post, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{post.date}</span>
                    <Link to="/blog" className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400">Read more →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Newsletter />
    </div>
  );
}