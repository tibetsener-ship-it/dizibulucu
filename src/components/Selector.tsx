'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for easier tailwind class merging
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectorProps {
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
}

export function Selector({ label, options, value, onChange }: SelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.id === value);

  return (
    <div className="relative w-full md:w-64">
      <label className="block text-sm font-medium text-white/50 mb-2 uppercase tracking-wider">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl",
          "bg-white/5 border border-white/10 text-left transition-all duration-300",
          "hover:bg-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50",
          isOpen && "ring-2 ring-primary/50 border-primary/50 bg-white/10"
        )}
      >
        <span className={cn("block truncate text-lg", !selectedOption && "text-white/40")}>
          {selectedOption ? selectedOption.label : "Seçiniz"}
        </span>
        <svg
          className={cn("h-5 w-5 text-white/50 transition-transform duration-300", isOpen && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close when clicking outside */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-50 w-full mt-2 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <ul className="max-h-60 overflow-auto py-2 scrollbar-thin scrollbar-thumb-white/20">
                {options.map((option) => {
                  const isSelected = value === option.id;
                  return (
                    <li
                      key={option.id}
                      onClick={() => {
                        onChange(option.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "relative cursor-pointer select-none py-3 pl-4 pr-9 transition-colors",
                        "hover:bg-white/10 hover:text-white text-white/70",
                        isSelected && "bg-primary/20 text-primary font-medium"
                      )}
                    >
                      <span className="block truncate">{option.label}</span>
                      {isSelected ? (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
