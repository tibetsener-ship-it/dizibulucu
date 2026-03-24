'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Loader2, Camera } from 'lucide-react';
import type { Series } from '@/lib/data';
import html2canvas from 'html2canvas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  results: Series[];
  moodFilter: string | null;
  genreFilter: string | null;
}

export function StoryShareModal({ isOpen, onClose, results, moodFilter, genreFilter }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const topResults = results.slice(0, 3);
  const moodText = moodFilter ? moodFilter.toUpperCase() : "EFSANE";
  const genreText = genreFilter ? genreFilter.toUpperCase() : "DİZİLER";
  const title = `BU HAFTAKİ MİSAFİRİM: ${moodText} & ${genreText}`;

  const downloadImage = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    try {
      const element = canvasRef.current;
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#050505',
      });
      
      const link = document.createElement('a');
      link.download = `dizi-karti-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Canvas image generation failed", err);
      alert("Hata: Resim oluşturulamadı. Güvenlik ayarları resmi engelliyor olabilir.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm"
        >
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Canvas Wrapper */}
          <div 
            ref={canvasRef}
            style={{ width: '360px', height: '640px' }}
            className="bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-black rounded-[2rem] overflow-hidden relative shadow-2xl flex flex-col items-center justify-between p-6 mx-auto"
          >
            {/* Ambient Background Light */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-primary/20 blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="z-10 text-center mt-2">
              <p className="text-white/60 text-[10px] font-bold tracking-[0.3em] mb-3 uppercase">DIZIBULUCU.COM.TR</p>
              <h2 className="text-2xl font-black text-white uppercase leading-tight tracking-tighter">
                {title}
              </h2>
            </div>
            
            {/* Results Grid */}
            <div className="z-10 w-full flex flex-col gap-4">
              {topResults.map((series, idx) => (
                <div key={series.id} className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-xl border border-white/5">
                  <img 
                    src={series.backdropUrl || series.posterUrl} 
                    alt={series.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-black text-lg skew-x-[-10deg]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-white font-black text-lg leading-tight truncate drop-shadow-lg">{series.title}</h3>
                      <div className="flex gap-1.5 mt-1">
                        {series.tags.slice(0, 2).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-white/20 backdrop-blur-md rounded text-[9px] text-white font-bold uppercase tracking-wide">{t.replace('-', ' ')}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer QR Placeholder */}
            <div className="z-10 w-full flex justify-between items-end pb-2">
              <div className="text-left">
                <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mb-1">Ne Izlesem Diyorsan</p>
                <p className="text-primary font-black text-base tracking-tight leading-none">dizibulucu.com.tr</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <div className="w-full h-full border-[3px] border-black border-dashed opacity-80" />
              </div>
            </div>
          </div>

          {/* Action Panel outside canvas */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={downloadImage}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {isGenerating ? "Hazırlanıyor..." : "Hikaye İçin İndir"}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link kopyalandı!");
              }}
              className="px-5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl transition-colors flex items-center justify-center border border-white/10"
              title="Sadece Linki Kopyala"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
