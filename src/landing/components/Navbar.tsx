import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

const navLinks = [
  { label: 'Accueil', id: 'hero' },
  { label: 'À Propos', id: 'about' },
  { label: 'Lieux', id: 'lieux' },
  { label: 'Factions', id: 'factions' },
  { label: 'Règlement', id: 'rules' },
  { label: 'Rejoindre', id: 'join' },
];

export default function Navbar() {
  const { openModal, isLoggedIn, username, logout, enterGame } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/85 backdrop-blur-xl border-b border-purple-900/30 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-purple-600 rounded-lg rotate-45" />
            <div className="absolute inset-1 bg-cyan-500 rounded-md rotate-[22deg] opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-orbitron font-black text-xs">E</span>
            </div>
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-orbitron font-black text-white text-sm leading-none">ETHERWORLD RP</div>
            <div className="text-[10px] text-cyan-400 font-rajdhani tracking-[0.3em]">QUÉBEC CITY</div>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="px-4 py-2 rounded-lg font-rajdhani font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 tracking-wider uppercase transition-all"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={enterGame}
                className="btn-primary px-5 py-2 rounded-lg font-orbitron font-bold text-white text-xs tracking-widest uppercase"
              >
                🎮 JOUER
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-900/20 border border-purple-700/40">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="font-rajdhani font-bold text-white text-sm">{username}</span>
              </div>
              <button
                onClick={logout}
                className="font-rajdhani text-gray-500 hover:text-red-400 text-sm transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openModal('login')}
                className="hidden sm:block font-rajdhani font-bold text-gray-300 hover:text-white text-sm tracking-wider uppercase transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => openModal('register')}
                className="btn-primary px-5 py-2 rounded-lg font-orbitron font-bold text-white text-xs tracking-widest uppercase"
              >
                S'INSCRIRE
              </button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-purple-900/30 mt-3">
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="px-4 py-3 rounded-lg font-rajdhani font-semibold text-gray-300 hover:text-white hover:bg-white/5 tracking-wider uppercase text-left transition-all"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
