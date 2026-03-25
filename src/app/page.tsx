'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Selector } from '@/components/Selector';
import { MovieCard } from '@/components/MovieCard';
import { MovieModal } from '@/components/MovieModal';
import { Navbar, Hero, ProblemSection, SolutionSection, FeaturesSection, AiFeatureSection, FinalCta, Footer } from '@/components/LandingSections';
import { TrendTicker } from '@/components/TrendTicker';
import { StoryShareModal } from '@/components/StoryShareModal';
import type { Series } from '@/lib/data';
import { Loader2, Link as LinkIcon, Check, Camera } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const GENRES = [
  { id: 'action', label: 'Aksiyon' },
  { id: 'drama', label: 'Drama' },
  { id: 'sci-fi', label: 'Bilim Kurgu' },
  { id: 'thriller', label: 'Gerilim' },
  { id: 'comedy', label: 'Komedi' },
];

const MOODS = [
  { id: 'dark', label: 'Karanlık & Ciddi' },
  { id: 'light', label: 'Eğlenceli' },
  { id: 'emotional', label: 'Duygusal' },
  { id: 'mind-blowing', label: 'Beyin Yakan' },
  { id: 'easy-watch', label: 'Çerezlik' },
];

const PLATFORMS = [
  { id: 'netflix', label: 'Netflix' },
  { id: 'amazon', label: 'Amazon Prime' },
  { id: 'hbo', label: 'HBO Max' },
  { id: 'disney', label: 'Disney+' },
  { id: 'apple-tv', label: 'Apple TV+' },
  { id: 'mubi', label: 'Mubi' },
];

function MainContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [genre, setGenre] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStoryShareOpen, setIsStoryShareOpen] = useState(false);
  const [searchType, setSearchType] = useState<'filter' | 'ai' | null>(null);

  useEffect(() => {
    const pids = searchParams.get('pids');
    // Sadece paylaşım linki açılışında yükle (shared=true parametresi varsa)
    const isShared = searchParams.get('shared') === 'true';
    if (pids && isShared) {
      setIsSharedView(true);
      setHasSearched(true);
      setIsLoading(true);
      fetch(`/api/series?ids=${pids}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));

      setTimeout(() => {
        const el = document.getElementById('search-app');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } else if (pids && !isShared) {
      // F5 yapıldı, URL'i temizle
      router.replace('/', { scroll: false });
    }
  }, []);

  const handleAiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    // Önceki sonuçları temizle
    setResults([]);
    setIsLoading(true);
    setHasSearched(true);
    setIsSharedView(false);
    setSearchType('ai');

    try {
      const response = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setResults(data.results || []);

      // Paylaşım linki için shared=true ekle
      const resIds = (data.results || []).map((r: Series) => r.id).join(',');
      if (resIds) {
        router.replace(`/?pids=${resIds}&shared=true`, { scroll: false });
      }

      const el = document.getElementById('search-app');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed AI search', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    // Önceki sonuçları temizle
    setResults([]);
    setIsLoading(true);
    setHasSearched(true);
    setIsSharedView(false);
    setSearchType('filter');

    try {
      const params = new URLSearchParams();
      if (genre) params.append('genre', genre);
      if (mood) params.append('mood', mood);
      if (platform) params.append('platform', platform);

      const response = await fetch(`/api/recommend?${params.toString()}`);
      const data = await response.json();
      setResults(data.results || []);

      // Paylaşım linki için shared=true ekle
      const resIds = (data.results || []).map((r: Series) => r.id).join(',');
      if (resIds) {
        params.append('pids', resIds);
        params.append('shared', 'true');
        router.replace(`/?${params.toString()}`, { scroll: false });
      }

      const el = document.getElementById('search-app');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed recommendations', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults([]);
    setHasSearched(false);
    setIsSharedView(false);
    setSearchType(null);
    setPrompt('');
    setGenre(null);
    setMood(null);
    setPlatform(null);
    router.replace('/', { scroll: false });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen selection:bg-primary/30 bg-black">
      <Navbar onLogoClick={handleReset} />
      <TrendTicker />

      {!isSharedView && !hasSearched && (
        <>
          <Hero />
          <ProblemSection />
          <SolutionSection />
        </>
      )}

      {/* Main App Section */}
      <section id="search-app" className={`relative flex flex-col items-center justify-center px-4 ${(!isSharedView && !hasSearched) ? 'py-32 border-t border-white/5 bg-[#050505]' : 'pt-32 pb-10 min-h-[70vh]'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[128px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center z-10 w-full max-w-4xl mx-auto"
        >
          {isSharedView ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium mb-6 uppercase tracking-widest backdrop-blur-sm shadow-xl"
            >
              🎉 Arkadaşının Dizi Zevki
            </motion.div>
          ) : (
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">Hemen Seçimini Yap</h2>
              <p className="text-white/50 text-lg">Zevkine uygun dizileri saniyeler içinde bul.</p>
            </div>
          )}

          <form onSubmit={handleAiSearch} className="w-full relative glass-card p-2 md:p-3 rounded-2xl md:rounded-full flex items-center z-20 mb-8">
            <input
              type="text"
              placeholder='"Dark gibi ama daha az karışık bir dizi..."'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-transparent text-white px-6 py-3 outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="absolute right-2 top-2 bottom-2 md:right-3 md:top-3 md:bottom-3 px-6 bg-white hover:bg-white/90 text-black font-bold rounded-xl md:rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading && searchType === 'ai' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yapay Zeka ile Bul'}
            </button>
          </form>

          <div className="flex items-center justify-center w-full mb-8 relative z-20">
            <div className="h-px bg-white/10 w-1/4" />
            <span className="text-white/40 text-sm px-4 uppercase tracking-widest">VEYA</span>
            <div className="h-px bg-white/10 w-1/4" />
          </div>

          <div className="glass-card p-4 rounded-2xl md:rounded-full md:p-2 relative z-20">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              <Selector label="1. Tür" options={GENRES} value={genre} onChange={setGenre} />
              <div className="hidden md:block w-px h-12 bg-white/10" />
              <Selector label="2. Mod" options={MOODS} value={mood} onChange={setMood} />
              <div className="hidden md:block w-px h-12 bg-white/10" />
              <Selector label="3. Nerede?" options={PLATFORMS} value={platform} onChange={setPlatform} />

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full md:w-auto ml-0 md:ml-auto md:mr-2 px-10 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl md:rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(229,9,20,0.3)] hover:shadow-[0_0_60px_rgba(229,9,20,0.5)] transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                {isLoading && searchType === 'filter' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'BUL'}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {hasSearched && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 md:px-12 lg:px-24 pb-32 pt-10"
          >
            <div className="max-w-7xl mx-auto">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                        {isSharedView ? 'Önerilen Diziler' : 'Senin İçin Seçtiğimiz Diziler'}
                      </h2>
                      <button
                        onClick={handleReset}
                        className="text-white/40 hover:text-white/80 text-sm transition-colors underline underline-offset-2"
                      >
                        Sıfırla
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={copyLink}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-medium transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <LinkIcon className="w-4 h-4" />}
                        {copied ? 'Kopyalandı!' : 'Linki Paylaş'}
                      </button>
                      <button
                        onClick={() => setIsStoryShareOpen(true)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:opacity-90 rounded-full text-sm font-bold text-white transition-opacity shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                        Hikayede Paylaş
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {results.map((series) => (
                      <MovieCard key={series.id} series={series} onClick={() => setSelectedSeries(series)} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                  <h3 className="text-2xl font-medium text-white/80 mb-2">Eşleşme bulunamadı</h3>
                  <p className="text-white/40 mb-6">Farklı filtreler veya yapay zeka istemleri deneyerek hedefe ulaşabilirsin.</p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-sm transition-colors"
                  >
                    Yeni Arama Yap
                  </button>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <MovieModal series={selectedSeries} onClose={() => setSelectedSeries(null)} onSelectSimilar={setSelectedSeries} />

      <StoryShareModal
        isOpen={isStoryShareOpen}
        onClose={() => setIsStoryShareOpen(false)}
        results={results}
        moodFilter={mood}
        genreFilter={genre}
      />

      {!isSharedView && !hasSearched && (
        <>
          <FeaturesSection />
          <AiFeatureSection />
          <FinalCta />
        </>
      )}

      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <MainContent />
    </Suspense>
  );
}
