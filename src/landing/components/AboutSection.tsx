import { useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const features = [
  {
    icon: '🌆',
    title: 'Québec City Vivante',
    desc: 'Une reproduction immersive de la ville de Québec — ses quartiers, ses commerces, son ambiance unique. Chaque rue raconte une histoire.',
    color: '#a855f7',
  },
  {
    icon: '💼',
    title: 'Économie Réaliste',
    desc: 'Jobs légaux, commerces gérés par les joueurs, marché noir, blanchiment. L\'argent se gagne — et se perd — selon tes choix.',
    color: '#22c55e',
  },
  {
    icon: '⚔️',
    title: 'Factions en Guerre',
    desc: 'Police, EMS, gouvernement, cartels et indépendants. Alliances, trahisons, guerres de territoire — la politique de la rue est impitoyable.',
    color: '#ef4444',
  },
  {
    icon: '🎭',
    title: 'RP Sérieux & Profond',
    desc: 'Personnages crédibles, histoires de fond, conséquences permanentes. Ici, le roleplay n\'est pas une option — c\'est la loi.',
    color: '#06b6d4',
  },
  {
    icon: '🚔',
    title: 'Justice & Criminalité',
    desc: 'Système judiciaire complet: arrestations, procès, casier. Le crime paie... jusqu\'à ce que la SPVQ te rattrape.',
    color: '#3b82f6',
  },
  {
    icon: '🇨🇦',
    title: '100% Québécois',
    desc: 'Communauté francophone, références locales, culture québécoise assumée. Le seul serveur qui sent vraiment la poutine.',
    color: '#f59e0b',
  },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.05 });

  return (
    <section id="about" ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050310] to-black" />
      <div className="absolute inset-0 grid-bg opacity-15" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-700/40 text-xs font-rajdhani text-purple-400 tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            À PROPOS DU SERVEUR
          </div>
          <h2 className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-white mb-4">
            UN MONDE <span className="gradient-text">À PART</span>
          </h2>
          <p className="font-rajdhani text-xl text-gray-400 max-w-2xl mx-auto">
            ETHERWORLD RP n'est pas juste un serveur — c'est un univers persistant où ton personnage
            vit, évolue et laisse sa marque sur Québec City.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`card-hover p-7 rounded-2xl bg-black/60 backdrop-blur-sm border border-gray-800/50 hover:border-purple-700/40 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-5"
                style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}40` }}
              >
                {feature.icon}
              </div>
              <h3 className="font-orbitron font-bold text-white text-lg mb-3">{feature.title}</h3>
              <p className="font-rajdhani text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
