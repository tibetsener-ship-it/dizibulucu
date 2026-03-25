'use client';

import { motion } from 'framer-motion';
import { Film, Filter, Search, Sparkles, Clock, Share2, BrainCircuit, PlayCircle, EyeOff, LayoutGrid, Quote, ArrowRight, Smile, Zap } from 'lucide-react';
import React from 'react';

const scrollToApp = () => {
  const el = document.getElementById('search-app');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

export function Navbar({ onLogoClick }: { onLogoClick?: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={onLogoClick || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
        >
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">dizibulucu</span>
        </div>
        <button
          onClick={scrollToApp}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-full transition-colors border border-white/10"
        >
          Hemen Başla
        </button>
      </div>
    </nav>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex text-center items-center justify-center pt-24 pb-16 px-4 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full opacity-50 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 max-w-4xl mx-auto flex flex-col items-center"
      >
        <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-sm font-medium tracking-wide uppercase mb-8 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Yapay Zeka Destekli Dizi Öneri Motoru
        </span>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-8 leading-[1.1]">
          "Ne izlesem?" diye düşünmeyi bırak.
        </h1>
        
        <p className="text-xl sm:text-2xl text-white/50 mb-12 max-w-2xl font-light">
          İzleme zevkine, ruh haline ve zamanına göre sana özel dizi önerileri saniyeler içinde karşında.
        </p>

        <button 
          onClick={scrollToApp}
          className="group relative px-10 py-5 bg-primary hover:bg-primary-hover text-white text-lg font-bold rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(229,9,20,0.4)] hover:shadow-[0_0_80px_rgba(229,9,20,0.6)] hover:scale-105 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
        >
          <span className="relative z-10">Ne İzlesem?</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>
        
        <p className="mt-4 text-white/40 text-sm">
          10 saniyede karar ver. Saatlerce scroll yapma.
        </p>
      </motion.div>
    </section>
  );
}

export function ProblemSection() {
  return (
    <section className="py-24 px-4 relative bg-gradient-to-b from-black to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="glass-card rounded-[2rem] p-8 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full" />
          
          <h2 className="text-3xl md:text-5xl font-bold mb-10 text-white/90">
            Karar vermek izlemekten daha yorucu.
          </h2>
          
          <ul className="space-y-6 mb-12">
            {[
              { icon: PlayCircle, text: "Netflix'i aç" },
              { icon: Clock, text: "20 dakika dolaş" },
              { icon: EyeOff, text: "Hiçbir şey bulamadan kapat" }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-4 text-xl text-white/60">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <item.icon className="w-5 h-5 text-white/40" />
                </div>
                {item.text}
              </li>
            ))}
          </ul>
          
          <div className="inline-block p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-xl md:text-2xl font-medium text-white/80">
              Sorun içerik değil. <span className="text-primary font-bold">Sorun fazla seçenek.</span>
            </h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function SolutionSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            dizibulucu senin yerine seçer.
          </h2>
          <p className="text-xl text-primary font-medium tracking-wide uppercase">
            Sana en uygun 5 diziyi anında bulalım.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: LayoutGrid, title: "1. Seç", desc: "Ne izlemek istediğini belirt. (Aksiyon, Komedi...)" },
            { icon: Filter, title: "2. Filtrele", desc: "Ruh halini ekle. (Karanlık, Çerezlik...)" },
            { icon: Sparkles, title: "3. Bul", desc: "Sana özel öneriler saniyeler içinde karşında." }
          ].map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border border-white/5 group"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors border border-white/10">
                <card.icon className="w-8 h-8 text-white/70 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white/90">{card.title}</h3>
              <p className="text-white/50 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    { icon: BrainCircuit, title: "Akıllı Öneri Motoru", desc: "Özel algoritmamızla zevklerinizi eşleştirir." },
    { icon: Smile, title: "Ruh Haline Göre Seçim", desc: "Sadece tür değil, hissetmek istediğiniz duyguya odaklanır." },
    { icon: Zap, title: "Hızlı Karar", desc: "Zaman kaybetmezsiniz. En iyi seçenekler anında sunulur." },
    { icon: Share2, title: "Paylaşılabilir Sonuçlar", desc: "Bulduğunuz sonucu tek tıkla arkadaşlarınızla paylaşın." },
  ];

  return (
    <section className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.04]"
            >
              <feat.icon className="w-6 h-6 text-primary mb-4" />
              <h4 className="text-lg font-bold text-white/90 mb-2">{feat.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AiFeatureSection() {
  return (
    <section className="py-32 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-50 pointer-events-none" />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Ne istediğini anlat, <span className="text-primary italic">biz anlayalım.</span>
        </h2>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-12 text-white/50">
          <div className="flex items-center justify-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Quote className="w-4 h-4" />
            "Dark gibi ama daha az karışık"
          </div>
          <div className="flex items-center justify-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Quote className="w-4 h-4" />
            "Kafa yormayan ama sürükleyici"
          </div>
        </div>

        <div className="max-w-2xl mx-auto relative glass-card p-2 md:p-3 rounded-2xl md:rounded-full border border-white/10 shadow-2xl flex items-center">
          <Search className="w-5 h-5 text-white/30 ml-4 absolute pointer-events-none" />
          <input 
            type="text" 
            disabled
            placeholder="Yukarıdaki örnekler gibi yazın..."
            className="w-full bg-transparent text-white pl-12 pr-6 py-4 outline-none placeholder:text-white/40 cursor-not-allowed"
          />
          <button 
            disabled
            className="absolute right-2 top-2 bottom-2 md:right-3 md:top-3 md:bottom-3 px-8 bg-white text-black font-bold rounded-xl md:rounded-full opacity-50 cursor-not-allowed text-sm hidden sm:block"
          >
            Yapay Zeka
          </button>
        </div>
        <p className="mt-8 text-sm text-white/40">Yapay zeka arama motorumuzu yukarıdaki uygulama bölümünde deneyebilirsiniz.</p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="py-32 px-4 relative">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight">
          Bu akşam ne izleyeceğin belli mi?
        </h2>
        <p className="text-2xl text-white/50 mb-12">
          Değilse, çözüm burada.
        </p>
        <button 
          onClick={scrollToApp}
          className="px-12 py-6 bg-primary hover:bg-primary-hover text-white text-xl font-bold rounded-full transition-all duration-300 shadow-[0_0_50px_rgba(229,9,20,0.5)] hover:scale-105 active:scale-95"
        >
          Dizini Bul
        </button>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Film className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white/90">dizibulucu.com.tr</span>
        </div>
        
        <div className="flex gap-6 text-sm text-white/40">
          <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
          <a href="#" className="hover:text-white transition-colors">Kullanım Şartları</a>
          <a href="#" className="hover:text-white transition-colors">İletişim</a>
        </div>
        
        <p className="text-white/30 text-sm">
          © {new Date().getFullYear()} Dizibulucu. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
