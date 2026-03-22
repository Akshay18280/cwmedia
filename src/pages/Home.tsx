import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Shield, Network, TrendingUp,
  Calendar, Sparkles, BarChart3, Search, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ModernCard } from '../components/ModernDesignSystem';
import Newsletter from '../components/Newsletter';
import { HeroSearchBar } from '../components/HeroSearchBar';
import { firebasePostsService } from '../services/firebase/posts.service';

const CAPABILITIES = [
  {
    icon: Brain,
    title: 'Multi-Agent Research',
    desc: '6 specialized AI agents work in parallel — overview, market, technical, news, competitor, and strategic analysis.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    icon: Shield,
    title: 'Fact Verification',
    desc: 'Cross-reference claims across multiple sources with confidence scoring and contradiction detection.',
    color: 'from-emerald-500 to-cyan-600',
  },
  {
    icon: Network,
    title: 'Knowledge Graphs',
    desc: 'Interactive entity relationship maps and agent activity trees visualize the research process.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Financial Intelligence',
    desc: 'Live market data, financial metrics, competitor benchmarks, and SWOT analysis — all automated.',
    color: 'from-rose-500 to-pink-600',
  },
];

const AI_STATS = [
  { label: 'Parallel Agents', value: '6', icon: Brain },
  { label: 'Avg Research Time', value: '~30s', icon: Zap },
  { label: 'Source Verification', value: '100%', icon: Shield },
  { label: 'Cost Per Query', value: '$0', icon: TrendingUp },
];

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeaturedPosts = useCallback(async () => {
    try {
      setLoading(true);
      const posts = await firebasePostsService.getFeaturedPosts(3);
      setFeaturedPosts(posts);
    } catch (error) {
      console.error('Error loading featured posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedPosts();
  }, [loadFeaturedPosts]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* ━━━ AI-First Hero ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-primary/20 bg-accent-primary/5 text-accent-primary text-xs font-semibold tracking-wide uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              AI-Powered Research Intelligence
            </div>
          </motion.div>

          <motion.h1
            className="text-display text-gradient-flow mb-5 !leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Research Anything.<br className="hidden sm:block" /> Instantly.
          </motion.h1>

          <motion.p
            className="text-body-lg text-medium-contrast max-w-2xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            6 AI agents research in parallel, verify facts across sources, and deliver
            structured reports with financial data, competitive analysis, and confidence scoring.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <HeroSearchBar />
          </motion.div>
        </div>
      </section>

      {/* ━━━ AI Stats Strip ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-10 border-y border-medium-contrast/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {AI_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <stat.icon className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="text-headline font-bold text-high-contrast text-mono-data">
                  {stat.value}
                </div>
                <div className="text-caption text-medium-contrast">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Capabilities Grid ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              className="text-headline font-bold text-high-contrast mb-3"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Enterprise-Grade Research, Zero Cost
            </motion.h2>
            <motion.p
              className="text-body text-medium-contrast max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Built with Go, pgvector, and Gemini 2.5 Flash — the entire system runs at $0/month.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-6 hover:border-accent-primary/30 hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cap.color} flex items-center justify-center text-white mb-4`}>
                  <cap.icon className="w-5 h-5" />
                </div>
                <h3 className="text-body-lg font-semibold text-high-contrast mb-2">{cap.title}</h3>
                <p className="text-body-sm text-medium-contrast leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/ai-lab"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Try AI Research Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━ Featured Articles (de-emphasized) ━━━━━━━━━━━━━━ */}
      {featuredPosts.length > 0 && (
        <section className="py-16 border-t border-medium-contrast/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-section-title font-semibold text-high-contrast">Latest Articles</h2>
              <Link
                to="/blog"
                className="text-body-sm text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-medium-contrast/30 p-5">
                    <div className="h-36 bg-medium-contrast/20 rounded-lg mb-3" />
                    <div className="h-5 bg-medium-contrast/20 rounded mb-2" />
                    <div className="h-4 bg-medium-contrast/20 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="group rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 overflow-hidden hover:border-accent-primary/30 hover:shadow-md transition-all"
                  >
                    {post.imageUrl && (
                      <div className="overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-body font-semibold text-high-contrast mb-2 group-hover:text-accent-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-body-sm text-medium-contrast line-clamp-2 mb-3">
                        {post.excerpt || post.content?.substring(0, 100) + '...'}
                      </p>
                      <div className="flex items-center text-caption text-low-contrast">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ━━━ Newsletter (compact) ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="newsletter">
        <Newsletter />
      </section>
    </div>
  );
}
