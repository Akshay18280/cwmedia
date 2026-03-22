import React, { useState } from 'react';
import { ChevronDown, Scissors, Cpu, Shield, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const challenges = [
  {
    icon: <Scissors className="w-5 h-5" />,
    title: 'Chunking Strategies',
    content: 'Finding the right chunk size is a core RAG trade-off. Smaller chunks (256 tokens) improve retrieval precision but lose surrounding context. Larger chunks (1024 tokens) preserve context but reduce granularity. We use 512-token chunks with 50-token overlap — a balanced sweet spot that maintains sentence boundaries while keeping retrieval focused.',
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'Embedding Quality vs Cost',
    content: 'Commercial embedding APIs (OpenAI, Cohere) offer high quality but add per-request costs. We use local SHA256 n-gram hash embeddings — completely free, deterministic, and fast. While not as semantically rich as transformer-based models, they perform well for keyword-heavy document retrieval and enable unlimited usage at $0/month.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Prompt Injection Protection',
    content: 'RAG systems are vulnerable to prompt injection through uploaded documents that contain adversarial instructions. Our system prompt explicitly constrains the model: "Answer only based on the provided context. Do not make up information." This reduces the attack surface, though defense-in-depth strategies (input sanitization, output filtering) are recommended for production.',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Retrieval Tuning',
    content: 'Top-K selection directly impacts answer quality. Too few chunks (K=1) may miss relevant information. Too many (K=20) floods the context with noise. We use K=5 with cosine distance — enough to capture diverse relevant passages while keeping the context window manageable for the LLM.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Hallucination Mitigation',
    content: 'Even with retrieved context, LLMs can hallucinate. Our multi-layered approach: (1) system prompt constrains answers to context only, (2) low temperature (0.3) reduces randomness, (3) source citations let users verify claims, (4) explicit "I don\'t know" instructions when context is insufficient.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Scaling Vector Search',
    content: 'HNSW indexes provide sub-linear search time but consume memory proportional to the dataset. For our scale (< 100K chunks), pgvector handles queries in < 15ms. At larger scale, strategies include: IVFFlat for lower memory usage, partitioning by document collection, and quantized vectors (PQ) for reduced storage.',
  },
];

export const EngineeringChallenges: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {challenges.map((challenge, i) => (
        <motion.div
          key={challenge.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-medium-contrast bg-medium-contrast/30 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-medium-contrast/40 transition-colors"
          >
            <span className="text-accent-primary">{challenge.icon}</span>
            <span className="flex-1 text-body-sm font-medium text-high-contrast">{challenge.title}</span>
            <ChevronDown
              className={`w-4 h-4 text-low-contrast transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-body-sm text-medium-contrast leading-relaxed">
                  {challenge.content}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};
