import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Series } from '@/lib/data';

interface MovieCardProps {
  series: Series;
  onClick: () => void;
}

export function MovieCard({ series, onClick }: MovieCardProps) {
  return (
    <motion.div
      layoutId={`card-container-${series.id}`}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-2xl bg-surface hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={series.posterUrl}
          alt={series.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 p-4 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <motion.h3 
          layoutId={`title-${series.id}`}
          className="text-xl font-bold text-white mb-2 line-clamp-1"
        >
          {series.title}
        </motion.h3>
        
        <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          <div className="flex items-center text-yellow-500 font-semibold text-sm">
            <Star className="w-4 h-4 fill-current mr-1" />
            {series.rating.toFixed(1)}
          </div>
          <div className="text-white/60 text-xs uppercase tracking-wider">
            {series.year}
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
          {series.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 text-[10px] font-medium tracking-wider uppercase rounded bg-white/10 text-white/80 border border-white/10">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
