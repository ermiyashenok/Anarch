import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import Papa from "papaparse";
import { 
  Home, 
  Search as SearchIcon, 
  TrendingUp, 
  Tv, 
  Film, 
  Plus, 
  Menu, 
  X,
  Play,
  Info,
  ChevronLeft,
  Check,
  Dice5,
  Upload,
  Trash2,
  ArchiveX,
  User,
  Settings
} from "lucide-react";
import { tmdbService, getImageUrl } from "./services/tmdb";
import { Movie, MovieDetails, Cast } from "./types";
import { cn } from "./lib/utils";

// --- Utils ---

const uniqueMovies = (movies: Movie[]) => {
  const seen = new Set();
  return movies.filter(movie => {
    if (!movie || seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
};

// --- Components ---

const ScrollAnimatedItem = ({ children, className, initial = { opacity: 0, y: 20 } }: { children: React.ReactNode, className?: string, initial?: any, key?: any }) => {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.8, 0.9, 1],
    [0.3, 0.5, 1, 1, 0.5, 0.3]
  );

  return (
    <motion.div 
      ref={ref}
      style={{ opacity }}
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const WatchlistItem = ({ 
  movie, 
  onClick, 
  onRemove 
}: { 
  movie: Movie, 
  onClick: (movie: Movie) => void, 
  onRemove: (e: React.MouseEvent) => void,
  key?: any 
}) => {
  return (
    <ScrollAnimatedItem className="group relative">
      <MovieCard 
        movie={movie} 
        onClick={onClick} 
        className="w-full"
      />
      <div className="absolute -bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
        <button 
          onClick={onRemove}
          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md shadow-lg transition-all active:scale-95"
        >
          <Trash2 size={14} /> Remove 
        </button>
      </div>
    </ScrollAnimatedItem>
  );
};

const Navbar = ({ activeTab, setActiveTab, onCsvUpload, onSearchClick }: { activeTab: string, setActiveTab: (tab: string) => void, onCsvUpload: () => void, onSearchClick: () => void }) => {
  const tabs = [
    { id: "discovery", label: "Discovery", icon: Film },
    { id: "movies", label: "Movies", icon: Film },
    { id: "tv", label: "Series", icon: Tv },
    { id: "watchlist", label: "Watchlist", icon: Plus },
    { id: "trending", label: "Recent", icon: TrendingUp },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-brand-bg/80 backdrop-blur-2xl border-b border-white/5 z-50 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab("home")}>
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-black text-brand-bg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-brand-primary/20">A</div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl tracking-tighter text-white italic leading-none">ANARCH</span>
            <span className="text-[8px] font-black tracking-[0.4em] text-brand-primary uppercase">Films & Series</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative group",
                activeTab === tab.id ? "text-white" : "text-white/30 hover:text-white"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl -z-10"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onSearchClick}
          className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          title="Search"
        >
          <SearchIcon size={20} />
        </button>
        <button 
          onClick={() => setActiveTab("account")}
          className={cn(
            "flex items-center gap-2 p-2 rounded-xl transition-all border",
            activeTab === "account" 
              ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-lg shadow-brand-primary/10" 
              : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
          )}
          title="Account"
        >
          <User size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block pr-1">Account</span>
        </button>
      </div>
    </nav>
  );
};

const SearchOverlay = ({ 
  isOpen, 
  onClose, 
  onMovieClick,
  query,
  setQuery,
  results
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onMovieClick: (m: Movie) => void,
  query: string,
  setQuery: (q: string) => void,
  results: Movie[]
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-brand-bg/60 backdrop-blur-xl overflow-y-auto no-scrollbar pt-20 px-4 md:px-20"
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center mb-16 px-4">
              <div className="relative flex-1 max-w-xl group">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={20} />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search titles..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-12 text-lg font-medium outline-none focus:border-brand-primary/40 focus:bg-white/10 transition-all placeholder:text-white/10"
                />
                {query && (
                  <button 
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button 
                onClick={onClose}
                className="ml-6 p-4 text-white/30 hover:text-white transition-all flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10">
                  <X size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Close</span>
              </button>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
                {results.map((movie) => (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <MovieCard 
                      movie={movie} 
                      onClick={(m) => {
                        onMovieClick(m);
                        onClose();
                      }} 
                      className="w-full h-full"
                    />
                  </motion.div>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <SearchIcon className="text-white/10" size={32} />
                </div>
                <h3 className="text-xl font-display font-bold mb-2 text-white/60">No results found for "{query}"</h3>
                <p className="text-white/30 max-w-xs">Double check your spelling or try searching for something else.</p>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center">
                <h3 className="text-4xl font-display font-black text-white/10 italic">Type to search...</h3>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MovieCard = ({ movie, onClick, className, colorful = true }: { movie: Movie, onClick: (movie: Movie) => void, className?: string, colorful?: boolean, key?: any }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(movie)}
      className={cn("relative aspect-video rounded-lg overflow-hidden cursor-pointer group bg-zinc-900 border border-white/5", className)}
    >
      <img 
        src={getImageUrl(movie.backdrop_path || movie.poster_path)} 
        alt={movie.title || movie.name}
        className={cn(
          "w-full h-full object-cover transition-all duration-700 ease-in-out scale-105 group-hover:scale-100 opacity-60 group-hover:opacity-100",
          colorful ? "grayscale-0 opacity-100" : "grayscale group-hover:grayscale-0"
        )}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
        <p className="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">{movie.title || movie.name}</p>
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
          {new Date(movie.release_date || movie.first_air_date || "").getFullYear()} • {movie.vote_average?.toFixed(1) || "N/A"}
        </p>
      </div>
    </motion.div>
  );
};

const MovieSection = ({ title, movies, onMovieClick, onSeeAll, actions }: { title: string, movies: Movie[], onMovieClick: (movie: Movie) => void, onSeeAll?: () => void, actions?: React.ReactNode }) => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">{title}</h2>
          {actions}
        </div>
        {onSeeAll && (
          <span 
            onClick={onSeeAll}
            className="text-[10px] text-brand-primary font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
          >
            See all
          </span>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} className="flex-none w-64 md:w-80" />
        ))}
      </div>
    </section>
  );
};

const DetailsView = ({ movie, onBack, watchlist, onToggleWatchlist }: { movie: Movie, onBack: () => void, watchlist: Movie[], onToggleWatchlist: (m: Movie) => void }) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  const isInWatchlist = watchlist.some(m => m.id === movie.id);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const type = movie.title ? "movie" : "tv";
        const [data, castData, videosData] = await Promise.all([
          tmdbService.getDetails(movie.id, type),
          tmdbService.getCredits(movie.id, type),
          tmdbService.getVideos(movie.id, type)
        ]);
        setDetails(data);
        setCast(castData);
        const trailer = videosData.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) setTrailerKey(trailer.key);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [movie]);

  if (loading) return (
    <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Film className="text-brand-primary" size={48} />
      </motion.div>
    </div>
  );

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[60] bg-brand-bg overflow-y-auto no-scrollbar"
    >
      <div className="relative h-[60vh] md:h-[80vh] w-full">
            <img 
              src={getImageUrl(movie.backdrop_path, "original")} 
              alt={movie.title || movie.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent" />
            
            <button 
              onClick={onBack}
              className="absolute top-8 left-8 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="absolute bottom-12 left-8 md:left-16 max-w-2xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-7xl font-display font-black tracking-tight mb-4"
              >
                {movie.title || movie.name}
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-6 mb-6 text-zinc-300 font-medium"
              >
                <span className="flex items-center gap-1 text-yellow-500">
                  ★ {movie.vote_average?.toFixed(1) || "N/A"}
                </span>
                <span>{new Date(movie.release_date || movie.first_air_date || "").getFullYear()}</span>
                <span>{details?.runtime ? `${details.runtime} min` : `${details?.number_of_seasons || 1} Seasons`}</span>
                <span className="px-2 py-0.5 border border-zinc-600 rounded text-xs uppercase tracking-wider">HD</span>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-zinc-400 text-lg md:text-xl line-clamp-3 mb-8"
              >
                {movie.overview}
              </motion.p>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (details?.imdb_id) {
                      window.open(`https://www.playimdb.com/title/${details.imdb_id}/`, '_blank');
                    } else {
                      const query = movie.title || movie.name;
                      window.open(`https://www.playimdb.com/find?q=${encodeURIComponent(query!)}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
                >
                  <Play size={24} className="fill-black" /> Play Now
                </button>
                {trailerKey && (
                  <button 
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95 shadow-xl"
                  >
                    Watch Trailer
                  </button>
                )}
                <button 
                  onClick={() => onToggleWatchlist(movie)}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl backdrop-blur-md border border-white/5",
                    isInWatchlist 
                      ? "bg-brand-primary text-white hover:bg-brand-primary/90" 
                      : "bg-zinc-800/80 text-white hover:bg-zinc-700"
                  )}
                >
                  {isInWatchlist ? <Check size={24} /> : <Plus size={24} />}
                  {isInWatchlist ? "In My List" : "Add to List"}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 md:px-16 py-12 -mt-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-display font-bold mb-6">About</h3>
                <div className="text-zinc-400 text-lg leading-relaxed mb-12">
                  {details?.tagline && <span className="italic block mb-4 text-zinc-100 leading-tight font-display text-xl font-medium">"{details.tagline}"</span>}
                  <p>{movie.overview}</p>
                </div>

                <h3 className="text-2xl font-display font-bold mb-6">Top Cast</h3>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
                  {cast.map((actor) => (
                    <a 
                      key={actor.id} 
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(actor.name.replace(/ /g, '_'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-none w-32 text-center group/actor block cursor-pointer transition-transform hover:-translate-y-1"
                    >
                      <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-2 border-zinc-800 ring-2 ring-transparent group-hover/actor:ring-brand-primary transition-all shadow-lg">
                        <img 
                          src={getImageUrl(actor.profile_path)} 
                          alt={actor.name} 
                          className="w-full h-full object-cover group-hover/actor:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h5 className="font-bold text-sm line-clamp-1 group-hover/actor:text-brand-primary transition-colors">{actor.name}</h5>
                      <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{actor.character}</p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Sidebar Area (Genres etc) */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-4">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {details?.genres.map((genre) => (
                      <span key={genre.id} className="px-4 py-2 bg-zinc-900 rounded-full text-zinc-300 text-sm font-medium border border-zinc-800">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-4">Available on</h4>
                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 flex items-center justify-center">
                    <span className="text-zinc-500">Vidsrc HD Stream Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </motion.div>

    <AnimatePresence>
      {showTrailer && trailerKey && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowTrailer(false)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <button 
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full transition-all z-10"
            >
              <X size={24} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

const AccountView = ({ 
  user, 
  history, 
  watchlist, 
  onCsvUpload, 
  onClearHistory, 
  onMovieClick 
}: { 
  user: any, 
  history: Movie[], 
  watchlist: Movie[], 
  onCsvUpload: () => void,
  onClearHistory: () => void,
  onMovieClick: (m: Movie) => void
}) => {
  return (
    <div className="max-w-5xl mx-auto pb-32 pt-10">
      {/* Profile Header - Minimalist */}
      <section className="mb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-brand-primary to-brand-primary/40 text-brand-bg text-4xl font-black mb-4 shadow-[0_0_50px_-12px_rgba(var(--brand-primary-rgb),0.5)]">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-7xl md:text-8xl font-display font-black tracking-tighter uppercase italic text-white leading-none">
            {user.name}
          </h2>
          <div className="flex items-center justify-center gap-12 pt-8">
            <div className="text-center group cursor-default">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-brand-primary transition-colors">Watched</p>
              <p className="text-4xl font-display font-black text-white">{history.length}</p>
            </div>
            <div className="w-[1px] h-12 bg-white/5" />
            <div className="text-center group cursor-default">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-brand-primary transition-colors">Saved</p>
              <p className="text-4xl font-display font-black text-white">{watchlist.length}</p>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-20">
        {/* Left Column: Actions */}
        <div className="md:col-span-4 space-y-16">
          <div className="space-y-8">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] px-1">Control Center</h3>
            <div className="flex flex-col gap-4">
              <button 
                onClick={onCsvUpload}
                className="group flex items-center justify-between w-full p-6 text-left hover:bg-white/[0.03] rounded-3xl transition-all border border-transparent hover:border-white/5"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white mb-1 group-hover:text-brand-primary transition-colors">Sync Database</p>
                  <p className="text-[10px] text-zinc-500 font-bold">Import CSV Watchlist</p>
                </div>
                <Upload size={18} className="text-white/20 group-hover:text-brand-primary transition-colors" />
              </button>

              <button 
                onClick={onClearHistory}
                className="group flex items-center justify-between w-full p-6 text-left hover:bg-white/[0.03] rounded-3xl transition-all border border-transparent hover:border-white/5"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white mb-1 group-hover:text-red-500 transition-colors">Flush History</p>
                  <p className="text-[10px] text-zinc-500 font-bold">Clear all viewing records</p>
                </div>
                <Trash2 size={18} className="text-white/20 group-hover:text-red-500 transition-colors" />
              </button>

              <button 
                className="group flex items-center justify-between w-full p-6 text-left opacity-30 cursor-not-allowed"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Preferences</p>
                  <p className="text-[10px] text-zinc-500 font-bold">App & UI Settings</p>
                </div>
                <Settings size={18} className="text-white/20" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: History List */}
        <div className="md:col-span-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Recent Activity</h3>
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Live Stream History</span>
            </div>

            {history.length > 0 ? (
              <div className="space-y-1">
                {history.slice(0, 10).map((movie, idx) => (
                  <motion.div 
                    key={movie.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onMovieClick(movie)}
                    className="group flex items-center gap-6 p-4 hover:bg-white/[0.03] rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden flex-none">
                      <img 
                        src={getImageUrl(movie.backdrop_path || movie.poster_path)} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-brand-primary transition-colors truncate">
                        {movie.title || movie.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                        {new Date(movie.release_date || movie.first_air_date || "").getFullYear()} • {movie.media_type || "Content"}
                      </p>
                    </div>
                    <ChevronLeft className="rotate-180 text-white/10 group-hover:text-white transition-all" size={16} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <TrendingUp className="text-white/5 mb-4" size={48} />
                <p className="text-white/10 font-black uppercase tracking-[0.2em] text-xs">No Stream History</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [discoveryType, setDiscoveryType] = useState<"movie" | "tv">("movie");
  const [searchQuery, setSearchQuery] = useState("");
  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string; backdrops: string[] }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string } | null>(null);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [genrePage, setGenrePage] = useState(1);
  const [viewAllSection, setViewAllSection] = useState<{ title: string, movies: Movie[], type?: string } | null>(null);
  const [viewAllPage, setViewAllPage] = useState(1);
  const [user] = useState({
    name: "Anarchist_01",
    joined: "May 2026",
    email: "anarch@streaming.app"
  });
  const scrollSentinelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewAllSection || !scrollSentinelRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreViewAll();
      }
    }, { threshold: 1.0 });

    observer.observe(scrollSentinelRef.current);
    return () => observer.disconnect();
  }, [viewAllSection, viewAllPage]);

  const loadMoreViewAll = async () => {
    if (!viewAllSection) return;
    const nextPage = viewAllPage + 1;
    let more: Movie[] = [];
    try {
      if (viewAllSection.title === "Trending Global") {
        more = await tmdbService.getTrending("all", nextPage);
      } else if (viewAllSection.title === "Popular Movies") {
        more = await tmdbService.getPopular("movie", nextPage);
      } else if (viewAllSection.title === "Series Archive") {
        more = await tmdbService.getSeries(nextPage);
      } else if (viewAllSection.title === "Top Rated Content") {
        more = await tmdbService.getTopRated("movie", nextPage);
      } else if (viewAllSection.title === "Coming Soon") {
        more = await tmdbService.getUpcoming(nextPage);
      }

      if (more.length > 0) {
        setViewAllSection(prev => prev ? { ...prev, movies: uniqueMovies([...prev.movies, ...more]) } : null);
        setViewAllPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const [watchlist, setWatchlist] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem("anarch_watchlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem("anarch_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("anarch_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("anarch_history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (movie: Movie) => {
    setHistory(prev => {
      const filtered = prev.filter(m => m.id !== movie.id);
      return [movie, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    if (movie) addToHistory(movie);
  };

  const handlePlayNow = async (movie: Movie) => {
    try {
      const type = movie.title ? "movie" : "tv";
      const details = await tmdbService.getDetails(movie.id, type);
      if (details.imdb_id) {
        window.open(`https://www.playimdb.com/title/${details.imdb_id}/`, '_blank');
      } else {
        const query = movie.title || movie.name;
        window.open(`https://www.playimdb.com/find?q=${encodeURIComponent(query!)}`, '_blank');
      }
    } catch (error) {
      console.error("Error playing now", error);
      const query = movie.title || movie.name;
      window.open(`https://www.playimdb.com/find?q=${encodeURIComponent(query!)}`, '_blank');
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const newMovies: Movie[] = [];
        
        for (const row of rows) {
          const query = row.title || row.Title || row.name || row.Name;
          if (query) {
            try {
              const searchResults = await tmdbService.search(query);
              if (searchResults.length > 0) {
                newMovies.push(searchResults[0]);
              }
            } catch (err) {
              console.error(`Error searching for ${query}`, err);
            }
          }
        }

        if (newMovies.length > 0) {
          setWatchlist(prev => uniqueMovies([...prev, ...newMovies]));
          setActiveTab("watchlist");
        }
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickRandomWatchlist = () => {
    if (watchlist.length === 0) return;
    const randomIndex = Math.floor(Math.random() * watchlist.length);
    setSelectedMovie(watchlist[randomIndex]);
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist(prev => prev.filter(m => m.id !== id));
  };

  const clearWatchlist = () => {
    setWatchlist([]);
    setShowClearConfirm(false);
  };

  const toggleWatchlist = (movie: Movie) => {
    setWatchlist(prev => {
      const exists = prev.find(m => m.id === movie.id);
      if (exists) {
        return prev.filter(m => m.id !== movie.id);
      }
      return [...prev, movie];
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        setError(null);
        const [trendData, popData, topData, upData, seriesData, genreData] = await Promise.all([
          tmdbService.getTrending(),
          tmdbService.getPopular(),
          tmdbService.getTopRated(),
          tmdbService.getUpcoming(),
          tmdbService.getSeries(),
          tmdbService.getGenres(discoveryType),
        ]);
        setTrending(uniqueMovies(trendData));
        setPopular(uniqueMovies(popData));
        setTopRated(uniqueMovies(topData));
        setUpcoming(uniqueMovies(upData));
        setSeries(uniqueMovies(seriesData));
        
        // Enrich genres with top movie backdrops, ensuring unique selection
        const usedBackdropPaths = new Set<string>();
        const enrichedGenres = await Promise.all(genreData.map(async (g) => {
          const topMovies = await tmdbService.getTopMoviesForGenre(g.id, discoveryType);
          const backdrops: string[] = [];
          
          for (const movie of topMovies) {
            const path = movie.backdrop_path || movie.poster_path;
            if (path && !usedBackdropPaths.has(path)) {
              backdrops.push(path);
              usedBackdropPaths.add(path);
              if (backdrops.length >= 3) break;
            }
          }

          // Fallback if not enough unique ones
          if (backdrops.length < 3) {
            for (const movie of topMovies) {
              const path = movie.backdrop_path || movie.poster_path;
              if (path && !backdrops.includes(path)) {
                backdrops.push(path);
                if (backdrops.length >= 3) break;
              }
            }
          }

          return { ...g, backdrops };
        }));
        setGenres(enrichedGenres);
      } catch (error: any) {
        console.error(error);
        if (error.message === "TMDB_API_KEY_MISSING" || error.response?.status === 401) {
          setError("API_KEY_ERROR");
        } else {
          setError("FETCH_ERROR");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [discoveryType]);

  useEffect(() => {
    if (selectedGenre) {
      const fetchGenreMovies = async () => {
        try {
          const movies = await tmdbService.getMoviesByGenre(selectedGenre.id, discoveryType, 1);
          setGenreMovies(uniqueMovies(movies));
          setGenrePage(1);
        } catch (err) {
          console.error(err);
        }
      };
      fetchGenreMovies();
    }
  }, [selectedGenre, discoveryType]);

  const loadMoreGenreMovies = async () => {
    if (!selectedGenre) return;
    const nextPage = genrePage + 1;
    try {
      const more = await tmdbService.getMoviesByGenre(selectedGenre.id, discoveryType, nextPage);
      setGenreMovies(prev => uniqueMovies([...prev, ...more]));
      setGenrePage(nextPage);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delayDebounce = setTimeout(async () => {
        const results = await tmdbService.search(searchQuery);
        setSearchResults(uniqueMovies(results.filter(r => r.poster_path || r.backdrop_path)));
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Auto-cycling featured movie
  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % Math.min(trending.length, 10));
    }, 5000);
    return () => clearInterval(interval);
  }, [trending]);

  const featured = trending[featuredIndex];

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      if (activeTab === "movies") {
        const more = await tmdbService.getPopular("movie", nextPage);
        setPopular(prev => uniqueMovies([...prev, ...more]));
      } else if (activeTab === "tv") {
        const more = await tmdbService.getSeries(nextPage);
        setSeries(prev => uniqueMovies([...prev, ...more]));
      } else if (activeTab === "trending") {
        const more = await tmdbService.getTrending("all", nextPage);
        setTrending(prev => uniqueMovies([...prev, ...more]));
      }
    } catch (err) {
      console.error("Failed to load more", err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-brand-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-brand-primary rounded flex items-center justify-center font-black text-2xl text-white">A</div>
          <h2 className="text-2xl font-display font-black tracking-[0.5em] text-white italic">ANARCH</h2>
        </motion.div>
      </div>
    );
  }

  if (error === "API_KEY_ERROR") {
    return (
      <div className="h-screen bg-brand-bg flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-zinc-900 border border-brand-primary/20 rounded-3xl p-10 text-center">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="text-brand-primary" size={40} />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4 italic uppercase tracking-tighter">API Key Required</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Please add your <span className="text-white font-bold">VITE_TMDB_API_KEY</span> in the Secrets panel to access movie data.
          </p>
          <a 
            href="https://www.themoviedb.org/settings/api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block w-full py-4 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/80 transition-all active:scale-95"
          >
            Get API Key
          </a>
        </div>
      </div>
    );
  }

  const openSeeAll = (title: string, movies: Movie[]) => {
    setViewAllSection({ title, movies });
    setViewAllPage(1);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white selection:bg-brand-primary selection:text-white overflow-x-hidden">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onCsvUpload={() => fileInputRef.current?.click()}
        onSearchClick={() => setShowSearchOverlay(true)}
      />

      <SearchOverlay 
        isOpen={showSearchOverlay}
        onClose={() => {
          setShowSearchOverlay(false);
          setSearchQuery("");
        }}
        query={searchQuery}
        setQuery={setSearchQuery}
        results={searchResults}
        onMovieClick={handleMovieSelect}
      />

      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleCsvUpload} 
      />

      <main className="min-h-screen pt-16 transition-all duration-300 flex flex-col relative overflow-x-hidden">
        <div className="flex-1 px-10 py-10 space-y-16 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
                {activeTab === "home" && featured && (
                  <section 
                    className="relative h-[60vh] min-h-[500px] w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden group cursor-pointer -mt-10 mb-16"
                    onClick={() => handleMovieSelect(featured)}
                  >
                    <img 
                      src={getImageUrl(featured.backdrop_path, "original")} 
                      alt="Featured Movie"
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-brand-bg to-transparent" />
                    
                    <div className="absolute bottom-20 left-10 md:left-20 max-w-xl z-20">
                      <span className="px-3 py-1 bg-brand-primary text-[10px] font-bold rounded uppercase tracking-widest mb-4 inline-block">Featured Production</span>
                      <h2 className="text-7xl font-black text-white mb-4 leading-none uppercase tracking-tighter drop-shadow-2xl">{featured.title || featured.name}</h2>
                      <p className="text-white/80 text-lg mb-8 line-clamp-2 max-w-md drop-shadow">{featured.overview}</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayNow(featured);
                          }}
                          className="px-10 py-4 bg-white text-black font-black rounded text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                        >
                          Play Now
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovieSelect(featured);
                          }}
                          className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black rounded text-sm uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* Dynamic Content based on tab */}
                {activeTab === "home" && (
                  <>
                    <ScrollAnimatedItem>
                      <MovieSection 
                        title="Trending Global" 
                        movies={trending} 
                        onMovieClick={handleMovieSelect} 
                        onSeeAll={() => openSeeAll("Trending Global", trending)}
                      />
                    </ScrollAnimatedItem>
                    <ScrollAnimatedItem>
                      <MovieSection 
                        title="Popular Movies" 
                        movies={popular} 
                        onMovieClick={handleMovieSelect} 
                        onSeeAll={() => openSeeAll("Popular Movies", popular)}
                      />
                    </ScrollAnimatedItem>
                    <ScrollAnimatedItem>
                      <MovieSection 
                        title="Series Archive" 
                        movies={series} 
                        onMovieClick={handleMovieSelect} 
                        onSeeAll={() => openSeeAll("Series Archive", series)}
                      />
                    </ScrollAnimatedItem>
                    <ScrollAnimatedItem>
                      <MovieSection 
                        title="Top Rated Content" 
                        movies={topRated} 
                        onMovieClick={handleMovieSelect} 
                        onSeeAll={() => openSeeAll("Top Rated Content", topRated)}
                      />
                    </ScrollAnimatedItem>
                    <ScrollAnimatedItem>
                      <MovieSection 
                        title="Coming Soon" 
                        movies={upcoming} 
                        onMovieClick={handleMovieSelect} 
                        onSeeAll={() => openSeeAll("Coming Soon", upcoming)}
                      />
                    </ScrollAnimatedItem>
                  </>
                )}
                {activeTab === "discovery" && (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                      <div className="flex flex-col gap-2">
                        <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">Discovery Categories</h2>
                        <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                          <button 
                            onClick={() => {
                              setDiscoveryType("movie");
                              setSelectedGenre(null);
                            }}
                            className={cn(
                              "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              discoveryType === "movie" ? "bg-brand-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                            )}
                          >
                            Movies
                          </button>
                          <button 
                            onClick={() => {
                              setDiscoveryType("tv");
                              setSelectedGenre(null);
                            }}
                            className={cn(
                              "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              discoveryType === "tv" ? "bg-brand-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                            )}
                          >
                            Series
                          </button>
                        </div>
                      </div>
                      <div className="relative w-full md:w-72 group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary" size={16} />
                        <input 
                          type="text"
                          placeholder="Search genres..."
                          value={genreSearchQuery}
                          onChange={(e) => setGenreSearchQuery(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand-primary/50 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {genres.filter(g => g.name.toLowerCase().includes(genreSearchQuery.toLowerCase())).map((genre) => (
                        <motion.button
                          key={genre.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedGenre(genre);
                            setTimeout(() => {
                              document.getElementById('genre-results')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className={cn(
                            "relative w-full aspect-[16/6] rounded-2xl overflow-hidden group border transition-all",
                            selectedGenre?.id === genre.id ? "border-brand-primary shadow-lg shadow-brand-primary/20 scale-102" : "border-white/5"
                          )}
                        >
                          <div className="absolute inset-0 flex gap-[1px]">
                            {genre.backdrops && genre.backdrops.length > 0 ? (
                              genre.backdrops.map((backdrop, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex-1 relative overflow-hidden"
                                >
                                  <img 
                                    src={getImageUrl(backdrop)}
                                    alt={genre.name}
                                    className={cn(
                                      "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
                                      idx === 0 ? "delay-0" : idx === 1 ? "delay-75" : "delay-150"
                                    )}
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="absolute inset-0 bg-zinc-800" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <span className="absolute bottom-4 left-4 right-4 font-black uppercase text-[10px] tracking-widest text-left line-clamp-2">{genre.name}</span>
                        </motion.button>
                      ))}
                    </div>

                    {selectedGenre && (
                      <div id="genre-results" className="pt-12 border-t border-white/5 space-y-8">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">
                            {selectedGenre.name} <span className="text-brand-primary text-sm not-italic ml-2 opacity-50">Results</span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {genreMovies.map(movie => (
                            <ScrollAnimatedItem key={movie.id}>
                              <MovieCard movie={movie} onClick={handleMovieSelect} className="w-full" />
                            </ScrollAnimatedItem>
                          ))}
                        </div>

                        <div className="flex justify-center pt-8 pb-32">
                          <button 
                            onClick={loadMoreGenreMovies}
                            className="px-12 py-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-black rounded uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-lg shadow-brand-primary/10"
                          >
                            More {selectedGenre.name} Results
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "movies" && (
                  <>
                    <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-8 px-2">Movies Library</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {popular.map(movie => (
                        <ScrollAnimatedItem key={movie.id}>
                          <MovieCard movie={movie} onClick={handleMovieSelect} className="w-full" />
                        </ScrollAnimatedItem>
                      ))}
                    </div>
                    <div className="flex justify-center pt-8">
                      <button 
                        onClick={loadMore}
                        className="px-12 py-4 bg-white/5 border border-white/10 text-white font-black rounded uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Load More Movies
                      </button>
                    </div>
                  </>
                )}
                {activeTab === "tv" && (
                  <>
                    <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-8 px-2">Series Archive</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {series.map(movie => (
                        <ScrollAnimatedItem key={movie.id}>
                          <MovieCard movie={movie} onClick={handleMovieSelect} className="w-full" />
                        </ScrollAnimatedItem>
                      ))}
                    </div>
                    <div className="flex justify-center pt-8">
                      <button 
                        onClick={loadMore}
                        className="px-12 py-4 bg-white/5 border border-white/10 text-white font-black rounded uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Load More Series
                      </button>
                    </div>
                  </>
                )}
                {activeTab === "watchlist" && (
                  <div className="space-y-12">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">My Collection</h2>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={pickRandomWatchlist}
                            className="flex items-center gap-3 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                          >
                            <Dice5 size={16} /> Random Pick
                          </button>
                          
                          {watchlist.length > 0 && (
                            <button 
                              onClick={() => setShowClearConfirm(true)}
                              className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-red-500 hover:text-white text-white/40 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                              <ArchiveX size={16} /> Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{watchlist.length} Titles Saved</p>
                    </div>
                    
                    {watchlist.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-8 pb-32">
                        {watchlist.map((movie) => (
                          <WatchlistItem 
                            key={movie.id}
                            movie={movie}
                            onClick={handleMovieSelect}
                            onRemove={(e) => {
                              e.stopPropagation();
                              removeFromWatchlist(movie.id);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                          <Plus className="text-white/20" size={32} />
                        </div>
                        <h3 className="text-xl font-display font-bold mb-2">Your collection is empty</h3>
                        <p className="text-white/40 max-w-xs">Start adding movies or series to build your ultimate watchlist.</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "trending" && (
                  <>
                    <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-8 px-2">Viewing History</h2>
                    {history.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {history.map(movie => (
                          <div key={movie.id}>
                            <MovieCard movie={movie} onClick={handleMovieSelect} className="w-full" colorful={false} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                          <TrendingUp className="text-white/20" size={32} />
                        </div>
                        <h3 className="text-xl font-display font-bold mb-2">History is empty</h3>
                        <p className="text-white/40 max-w-xs">Titles you view will appear here for quick access.</p>
                      </div>
                    )}
                  </>
                )}
                {activeTab === "account" && (
                  <AccountView 
                    user={user}
                    history={history}
                    watchlist={watchlist}
                    onCsvUpload={() => fileInputRef.current?.click()}
                    onClearHistory={() => setHistory([])}
                    onMovieClick={handleMovieSelect}
                  />
                )}
              </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay Modal for Details */}
      <AnimatePresence>
        {viewAllSection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-brand-bg/95 backdrop-blur-3xl overflow-y-auto no-scrollbar pt-24 px-8 md:px-20"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-16 px-2">
                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">Viewing Collection</h2>
                  <h3 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                    {viewAllSection.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setViewAllSection(null)}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
                {viewAllSection.movies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <MovieCard 
                      movie={movie} 
                      onClick={handleMovieSelect} 
                      className="w-full"
                      colorful={true}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Scroll Sentinel */}
              <div ref={scrollSentinelRef} className="h-20 w-full flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full"
                />
              </div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="w-1 h-12 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ y: [0, 48, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-full h-1/3 bg-brand-primary"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMovie && (
          <DetailsView 
            movie={selectedMovie} 
            onBack={() => setSelectedMovie(null)} 
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
          />
        )}
      </AnimatePresence>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArchiveX className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Clear Watchlist?</h3>
              <p className="text-white/40 mb-8 text-sm">Are you sure you want to remove all saved titles? This action cannot be undone.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={clearWatchlist}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-red-600 transition-colors"
                >
                  Yes, Clear All
                </button>
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full py-4 bg-white/5 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
