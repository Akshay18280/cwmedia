import React, { useState } from 'react';
import { Share2, Linkedin, MessageCircle, Twitter, Facebook, Link, Copy, QrCode, Mail } from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';

interface SharingManagerProps {
  post: any;
  onShare: (platform: string, url: string) => void;
}

export const SharingManager: React.FC<SharingManagerProps> = ({ post, onShare }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const postUrl = `${baseUrl}/post/${post.id}`;
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(postUrl);

  const shareOptions = [
    {
      platform: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-600',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
      description: 'Share with professional network'
    },
    {
      platform: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600',
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      description: 'Share via WhatsApp'
    },
    {
      platform: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-black',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=carelwavemedia`,
      description: 'Tweet to followers'
    },
    {
      platform: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      description: 'Share on Facebook'
    },
    {
      platform: 'email',
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600',
      url: `mailto:?subject=${encodedTitle}&body=Check out this article: ${postUrl}`,
      description: 'Send via email'
    }
  ];

  const handleShare = (option: any) => {
    if (option.platform === 'email') {
      window.location.href = option.url;
    } else {
      window.open(option.url, '_blank', 'width=600,height=400');
    }
    onShare(option.platform, option.url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
  };

  return (
    <ModernCard variant="glass" padding="lg">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gradient-flow mb-2">Share This Post</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Help spread the knowledge across platforms
          </p>
        </div>

        {/* Social Sharing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.platform}
                onClick={() => handleShare(option)}
                className={`${option.color} text-white p-4 rounded-xl hover:opacity-90 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs opacity-80">{option.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Direct Link Sharing */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <label className="block text-sm font-medium mb-2 text-gradient-accent">
                Direct Link
              </label>
              <input
                type="text"
                value={postUrl}
                readOnly
                className="input-modern w-full bg-white dark:bg-gray-700"
              />
            </div>
            <ModernButton
              variant={copied ? 'neumorphic' : 'default'}
              intent={copied ? 'success' : 'primary'}
              icon={Copy}
              onClick={copyToClipboard}
            >
              {copied ? 'Copied!' : 'Copy'}
            </ModernButton>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center">
          <ModernButton
            variant="glass"
            intent="accent"
            icon={QrCode}
            onClick={() => setQrCodeVisible(!qrCodeVisible)}
          >
            {qrCodeVisible ? 'Hide QR Code' : 'Show QR Code'}
          </ModernButton>

          {qrCodeVisible && (
            <div className="mt-4 p-4 bg-white rounded-xl inline-block">
              <img
                src={generateQRCode()}
                alt="QR Code for post"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-sm text-gray-600 mt-2">
                Scan to open post on mobile
              </p>
            </div>
          )}
        </div>

        {/* Share Analytics Preview */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-lg font-bold mb-3 text-holographic">Share Analytics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-xs text-gray-500">LinkedIn Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-xs text-gray-500">WhatsApp Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black dark:text-white">8</div>
              <div className="text-xs text-gray-500">Twitter Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">12</div>
              <div className="text-xs text-gray-500">Direct Links</div>
            </div>
          </div>
        </div>

        {/* Optimized Share Text Templates */}
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-gradient-accent">Suggested Share Text</h4>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              For LinkedIn (Professional)
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              "Just discovered valuable insights on {post.title}. Key takeaways that could transform your approach to {post.category}. Worth the read! 💡 #Technology #Innovation"
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-500">
            <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
              For WhatsApp (Personal)
            </div>
            <div className="text-sm text-green-700 dark:text-green-400">
              "Hey! Found this amazing article: {post.title}. You might find it useful for your projects 🚀"
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-gray-500">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">
              For Twitter (Engaging)
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-400">
              "🔥 {post.title} - This changes everything! Must-read for anyone in {post.category} 👇 #TechTrends"
            </div>
          </div>
        </div>
      </div>
    </ModernCard>
  );
}; 