'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users } from 'lucide-react';

export function TrendTicker() {
  const [trends, setTrends] = useState<{moods: string[], genres: string[], total: number} | null>(null);

  useEffect(() => {
    fetch('/api/trends')
      .then(r => r.json())
      .then(d => {
        if (d.trendingMoods?.length > 0) {
          setTrends({ moods: d.trendingMoods, genres: d.trendingGenres, total: d.totalSearches });
        }
      })
      .catch(() => {});
  }, []);

  if (!trends) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full bg-white/5 border-b border-white/5 backdrop-blur-md text-sm text-white/70 py-2.5 px-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 overflow-hidden relative z-40 mt-20"
    >
      <div className="flex items-center gap-1.5 text-primary">
        <TrendingUp className="w-4 h-4" />
        <span className="font-bold text-white/90">Bugün Türkiye ne izlemek istiyor?</span>
      </div>
      
      <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20" />
      
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-medium text-white/50">🔥 Popüler Ruh Hali:</span>
        <div className="flex gap-2">
          {trends.moods.map((m, i) => (
            <span key={i} className="px-2.5 py-0.5 bg-primary/20 text-primary-hover border border-primary/30 rounded-full text-xs font-bold uppercase tracking-wider">{m.replace('-', ' ')}</span>
          ))}
        </div>
      </div>

      <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-white/20" />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-medium text-white/50">🎬 Popüler Tür:</span>
        <div className="flex gap-2">
          {trends.genres.map((g, i) => (
            <span key={i} className="px-2.5 py-0.5 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider">{g}</span>
          ))}
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-1.5 ml-4 text-white/40">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs">{trends.total} Arama yapıldı</span>
      </div>
    </motion.div>
  );
}
