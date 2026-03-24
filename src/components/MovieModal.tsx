import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Star, Heart, Share2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { Series } from '@/lib/data';

interface MovieModalProps {
  series: Series | null;
  onClose: () => void;
  onSelectSimilar?: (series: Series) => void;
}

export function MovieModal({ series, onClose, onSelectSimilar }: MovieModalProps) {
  const [similarSeries, setSimilarSeries] = useState<Series[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  useEffect(() => {
    if (series) {
      setIsLoadingSimilar(true);
      fetch(`/api/similar?id=${series.id}`)
        .then(res => res.json())
        .then(data => {
          setSimilarSeries(data.results || []);
          setIsLoadingSimilar(false);
        })
        .catch(err => {
          console.error("Failed to load similar series", err);
          setIsLoadingSimilar(false);
        });
    } else {
      setSimilarSeries([]);
    }
  }, [series]);

  return (
    <AnimatePresence>
      {series && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content - Scrollable Wrapper */}
          <div className="fixed inset-0 z-[101] overflow-y-auto pointer-events-none p-4 md:p-10 flex flex-col items-center">
            
            <motion.div
              layoutId={`card-container-${series.id}`}
              className="w-full max-w-5xl bg-surface overflow-hidden rounded-2xl shadow-2xl pointer-events-auto relative mt-auto mb-auto flex flex-col"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/80 hover:text-white backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto md:h-96 overflow-hidden bg-black flex-shrink-0">
                  <Image
                    src={series.posterUrl}
                    alt={series.title}
                    fill
                    className="object-cover opacity-60 md:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:hidden" />
                </div>

                {/* Details Section */}
                <div className="p-6 md:p-10 flex flex-col justify-center flex-1 bg-surface relative">
                  <motion.h2 
                    layoutId={`title-${series.id}`}
                    className="text-3xl md:text-5xl font-bold mb-4"
                  >
                    {series.title}
                  </motion.h2>

                  <div className="flex items-center gap-4 text-sm font-medium mb-6">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-5 h-5 fill-current mr-1" />
                      {series.rating.toFixed(1)}
                    </div>
                    <span className="text-white/40">•</span>
                    <span className="text-white/80">{series.year}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/80 uppercase">{series.duration} Serie</span>
                  </div>

                  <p className="text-white/70 text-base leading-relaxed mb-6">
                    {series.description}
                  </p>

                  <div className="space-y-3 mb-8 text-sm md:text-base">
                    <div>
                      <span className="text-white/50 uppercase tracking-wider mr-3">Tags:</span>
                      <span className="text-white/90 capitalize">{series.tags.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-white/50 uppercase tracking-wider mr-3">Watch on:</span>
                      <span className="text-primary font-medium capitalize">{series.platforms.join(', ')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors">
                      <Play className="w-5 h-5 fill-current" />
                      İzle
                    </button>
                    <button className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                      <Heart className="w-6 h-6" />
                    </button>
                    <button className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Similar Series Section */}
              <div className="bg-black/50 p-6 md:p-10 border-t border-white/5">
                <h3 className="text-xl font-bold mb-4">Benzer Diziler</h3>
                {isLoadingSimilar ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {similarSeries.map(sim => (
                      <div 
                        key={sim.id} 
                        className="group cursor-pointer"
                        onClick={() => onSelectSimilar && onSelectSimilar(sim)}
                      >
                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg mb-2">
                          <Image
                            src={sim.posterUrl}
                            alt={sim.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, 20vw"
                          />
                        </div>
                        <h4 className="text-sm font-semibold text-white/90 truncate group-hover:text-white">{sim.title}</h4>
                        <div className="text-xs text-white/50">{sim.year}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
