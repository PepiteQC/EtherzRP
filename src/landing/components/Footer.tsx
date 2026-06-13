export default function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-gray-900/80 bg-black overflow-hidden">
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-purple-700/60 to-transparent" />

      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-purple-600 rounded-lg rotate-45" />
                <div className="absolute inset-1 bg-cyan-500 rounded-md rotate-[22deg] opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-orbitron font-black text-sm">E</span>
                </div>
              </div>
              <div>
                <div className="font-orbitron font-black text-white text-xl">ETHERWORLD RP</div>
                <div className="text-xs text-cyan-400 font-rajdhani tracking-[0.4em]">QUÉBEC CITY</div>
              </div>
            </div>
            <p className="font-rajdhani text-gray-500 leading-relaxed max-w-sm mb-6">
              Le serveur FiveM roleplay le plus immersif du Québec.
              Bienvenue dans un monde où chaque décision compte.
            </p>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <span className="font-rajdhani text-green-400 font-semibold text-sm">Serveur en ligne — 47 joueurs actifs</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-orbitron font-bold text-white text-sm mb-4 tracking-widest">NAVIGATION</h4>
            <ul className="space-y-2">
              {[
                { label: 'Accueil', id: 'hero' },
                { label: 'À Propos', id: 'about' },
                { label: 'Lieux & Monde', id: 'lieux' },
                { label: 'Factions', id: 'factions' },
                { label: 'Règlement', id: 'rules' },
                { label: 'Rejoindre', id: 'join' },
              ].map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="font-rajdhani text-gray-500 hover:text-purple-400 transition-colors text-sm"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-orbitron font-bold text-white text-sm mb-4 tracking-widest">SERVEUR</h4>
            <ul className="space-y-3">
              <li className="font-rajdhani text-sm">
                <span className="text-gray-600">Plateforme</span>
                <span className="text-gray-300 ml-2">FiveM</span>
              </li>
              <li className="font-rajdhani text-sm">
                <span className="text-gray-600">Langue</span>
                <span className="text-gray-300 ml-2">🇫🇷 Français</span>
              </li>
              <li className="font-rajdhani text-sm">
                <span className="text-gray-600">Capacité</span>
                <span className="text-gray-300 ml-2">128 slots</span>
              </li>
              <li className="font-rajdhani text-sm">
                <span className="text-gray-600">Âge minimum</span>
                <span className="text-gray-300 ml-2">16 ans</span>
              </li>
              <li className="font-rajdhani text-sm">
                <span className="text-gray-600">Version RP</span>
                <span className="text-purple-400 ml-2">v1.0</span>
              </li>
            </ul>

            {/* Social */}
            <div className="mt-6 flex gap-3">
              <button className="w-10 h-10 rounded-xl bg-[#5865f2]/20 border border-[#5865f2]/30 hover:bg-[#5865f2]/30 transition-colors flex items-center justify-center">
                <svg className="w-5 h-5 text-[#5865f2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.013.043.031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </button>
              <button className="w-10 h-10 rounded-xl bg-red-900/20 border border-red-700/30 hover:bg-red-900/30 transition-colors flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-rajdhani text-gray-600 text-sm">
            © 2026 ETHERWORLD RP QUÉBEC. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <button className="font-rajdhani text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Politique de confidentialité
            </button>
            <button className="font-rajdhani text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Conditions d'utilisation
            </button>
            <button className="font-rajdhani text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
