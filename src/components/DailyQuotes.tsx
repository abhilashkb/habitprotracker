import React, { useState, useEffect } from "react";
import { Quote } from "../types";
import { Quote as QuoteIcon, Heart, Shuffle, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";

interface DailyQuotesProps {
  quotes: Quote[];
  onToggleFavorite: (id: string) => Promise<void>;
}

export default function DailyQuotes({ quotes, onToggleFavorite }: DailyQuotesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAnimating, setIsAnimating] = useState(false);

  // Group categories
  const categories = ["All", ...Array.from(new Set(quotes.map((q) => q.category)))];

  // Filter based on selected category
  const filteredQuotes = selectedCategory === "All"
    ? quotes
    : quotes.filter((q) => q.category === selectedCategory);

  // Sync index if filtered list shifts
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  const activeQuote = filteredQuotes[currentIndex] || null;

  const handleShuffle = () => {
    if (filteredQuotes.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      let rand = currentIndex;
      while (rand === currentIndex) {
        rand = Math.floor(Math.random() * filteredQuotes.length);
      }
      setCurrentIndex(rand);
      setIsAnimating(false);
    }, 200);
  };

  const handlePrev = () => {
    if (filteredQuotes.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? filteredQuotes.length - 1 : prev - 1));
      setIsAnimating(false);
    }, 200);
  };

  const handleNext = () => {
    if (filteredQuotes.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === filteredQuotes.length - 1 ? 0 : prev + 1));
      setIsAnimating(false);
    }, 200);
  };

  // Only favorite quotes
  const favoriteQuotes = quotes.filter((q) => q.isFavorite);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="quotes-container">
      {/* Primary Quote Slide Card */}
      <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        {/* Subtle Background Glow Vector */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between z-10">
          <span className="text-[10px] uppercase tracking-wider font-mono bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-indigo-200">
            {activeQuote ? activeQuote.category : "Inspiration"}
          </span>
          <div className="flex items-center gap-1">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 hover:bg-white/15 text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={`my-5 transition-opacity duration-200 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
          {activeQuote ? (
            <div className="flex gap-3">
              <QuoteIcon className="w-8 h-8 text-indigo-400 opacity-40 shrink-0 transform -scale-x-100" />
              <div>
                <p className="text-sm sm:text-base font-medium leading-relaxed font-sans text-slate-100 italic">
                  "{activeQuote.quote}"
                </p>
                <p className="text-xs text-indigo-300 font-semibold mt-3 font-mono not-italic">
                  — {activeQuote.author}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">No quotes available in this category.</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 z-10">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={filteredQuotes.length <= 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous quote"
            >
              <ChevronLeft className="w-4 h-4 text-slate-200" />
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              {filteredQuotes.length > 0 ? `${currentIndex + 1}/${filteredQuotes.length}` : "0/0"}
            </span>
            <button
              onClick={handleNext}
              disabled={filteredQuotes.length <= 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next quote"
            >
              <ChevronRight className="w-4 h-4 text-slate-200" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeQuote && (
              <button
                onClick={() => onToggleFavorite(activeQuote.id)}
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  activeQuote.isFavorite
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-white/5 hover:bg-white/10 text-slate-300"
                }`}
                title={activeQuote.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`w-4 h-4 ${activeQuote.isFavorite ? "fill-rose-400 text-rose-300" : ""}`} />
                {activeQuote.isFavorite ? "Saved" : "Save"}
              </button>
            )}
            <button
              onClick={handleShuffle}
              disabled={filteredQuotes.length <= 1}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Shuffle quotes"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Favorite Quotes Index List Drawer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-3 select-none">
            <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
            Your Favorites ({favoriteQuotes.length})
          </h4>
          {favoriteQuotes.length === 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-dashed border-slate-250 dark:border-slate-800 text-center py-6">
              <Heart className="w-5 h-5 text-slate-350 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                No favorited insights yet. Click 'Save' on any card to store your daily wisdom benchmarks here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[148px] overflow-y-auto pr-1">
              {favoriteQuotes.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-50/60 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl text-xs relative group transition-all hover:bg-slate-50 hover:shadow-xs"
                >
                  <p className="text-slate-600 dark:text-slate-300 truncate pr-5 font-sans italic">
                    "{q.quote}"
                  </p>
                  <p className="text-[10px] text-indigo-500 font-mono mt-1 text-right font-semibold">— {q.author}</p>
                  <button
                    onClick={() => onToggleFavorite(q.id)}
                    className="absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition-opacity"
                    title="Remove Favorite"
                  >
                    <Heart className="w-3 h-3 fill-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3.5 mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>CURATED DAILY STRATEGY</span>
          <span>100% OFFLINE CACHE</span>
        </div>
      </div>
    </div>
  );
}
