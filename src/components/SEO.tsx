import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tag?: string[];
  };
}

const defaultSEO = {
  title: 'Akshay Verma - Software Engineer | Golang, AWS & Scalable Systems Expert',
  description: 'Software Development Engineer specializing in Golang, AWS, and scalable microservices. Building high-performance systems that handle millions of events.',
  keywords: 'Software Engineer, Golang, AWS, Microservices, DevOps, Cloud Architecture, Technical Blog',
  ogImage: 'https://carelwavemedia.com/og-image.jpg',
  ogType: 'website'
};

export default function SEO({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  article
}: SEOProps) {
  useEffect(() => {
    // Update title
    document.title = title || defaultSEO.title;
    
    // Update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (property) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description || defaultSEO.description);
    updateMetaTag('keywords', keywords || defaultSEO.keywords);
    
    // Open Graph tags
    updateMetaTag('og:title', title || defaultSEO.title, true);
    updateMetaTag('og:description', description || defaultSEO.description, true);
    updateMetaTag('og:image', ogImage || defaultSEO.ogImage, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', window.location.href, true);
    
    // Twitter tags
    updateMetaTag('twitter:title', title || defaultSEO.title);
    updateMetaTag('twitter:description', description || defaultSEO.description);
    updateMetaTag('twitter:image', ogImage || defaultSEO.ogImage);
    
    // Article specific tags
    if (article && ogType === 'article') {
      if (article.publishedTime) {
        updateMetaTag('article:published_time', article.publishedTime, true);
      }
      if (article.modifiedTime) {
        updateMetaTag('article:modified_time', article.modifiedTime, true);
      }
      if (article.author) {
        updateMetaTag('article:author', article.author, true);
      }
      if (article.tag) {
        article.tag.forEach(tag => {
          const element = document.createElement('meta');
          element.setAttribute('property', 'article:tag');
          element.setAttribute('content', tag);
          document.head.appendChild(element);
        });
      }
    }
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
    
  }, [title, description, keywords, ogImage, ogType, article]);

  return null;
} 