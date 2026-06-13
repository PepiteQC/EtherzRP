import { useRef, useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const ruleCategories = [
  {
    id: 'general',
    icon: '📜',
    title: 'Règles Générales',
    color: '#a855f7',
    rules: [
      'Respect entre joueurs obligatoire — aucune insulte OOC (hors personnage).',
      'Âge minimum: 16 ans. Aucune exception.',
      'Le français est la langue principale du serveur.',
      'Tout contenu haineux, raciste ou discriminatoire = bannissement permanent.',
      'Les décisions du staff sont finales. Contestation via ticket Discord uniquement.',
    ],
  },
  {
    id: 'rp',
    icon: '🎭',
    title: 'Règles de Roleplay',
    color: '#06b6d4',
    rules: [
      'No FailRP — ton personnage doit agir de façon réaliste en toutes circonstances.',
      'No Metagaming — interdit d\'utiliser des infos obtenues hors RP (Discord, stream, etc.).',
      'No Powergaming — tu ne peux pas forcer une action sur un autre joueur sans lui laisser une chance.',
      'Fear RP obligatoire — si on te menace avec une arme, ton personnage a peur.',
      'New Life Rule — après la mort, ton personnage oublie les circonstances de sa mort.',
    ],
  },
  {
    id: 'combat',
    icon: '⚔️',
    title: 'Combat & Criminalité',
    color: '#ef4444',
    rules: [
      'No RDM (Random Deathmatch) — tuer sans raison RP valable est interdit.',
      'No VDM (Vehicle Deathmatch) — utiliser un véhicule comme arme sans contexte RP.',
      'Initiation obligatoire avant toute action hostile.',
      'Les guerres de gangs doivent être déclarées et validées par le staff.',
      'Maximum 6 joueurs par groupe lors d\'une action criminelle majeure.',
    ],
  },
  {
    id: 'zones',
    icon: '🛡️',
    title: 'Zones & Limites',
    color: '#22c55e',
    rules: [
      'L\'hôpital est une zone safe — aucune violence tolérée.',
      'Pas de crime dans les 10 minutes suivant un spawn/respawn.',
      'Les zones vertes (spawns, services publics) sont protégées.',
      'Le combat logging (déconnexion pendant une action RP) est sanctionné.',
      'Respect des scènes RP en cours — ne pas interférer sans raison valable.',
    ],
  },
];

export default function RulesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.05 });
  const [openCategory, setOpenCategory] = useState<string | null>('general');

  return (
    <section id="rules" ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#06030c] to-black" />
      <div className="absolute inset-0 grid-bg opacity-15" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-700/40 text-xs font-rajdhani text-yellow-400 tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            RÈGLEMENT OFFICIEL
          </div>
          <h2 className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-white mb-4">
            LES <span className="gradient-text">RÈGLES DU JEU</span>
          </h2>
          <p className="font-rajdhani text-xl text-gray-400 max-w-2xl mx-auto">
            Un bon RP commence par le respect des règles. L'ignorance n'est pas une excuse —
            lis attentivement avant de rejoindre.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {ruleCategories.map((cat, i) => {
            const isOpen = openCategory === cat.id;
            return (
              <div
                key={cat.id}
                className={`rounded-2xl bg-black/60 backdrop-blur-sm border transition-all duration-500 overflow-hidden ${
                  isOpen ? 'border-purple-700/50' : 'border-gray-800/50'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <button
                  onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                  className="w-full flex items-center gap-4 p-6 text-left"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}40` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-orbitron font-bold text-white text-lg">{cat.title}</h3>
                    <p className="font-rajdhani text-gray-500 text-sm">{cat.rules.length} règles essentielles</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6">
                    <ul className="space-y-3 border-t border-gray-800/60 pt-5">
                      {cat.rules.map((rule, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-orbitron font-black text-[10px] mt-0.5"
                            style={{ background: `${cat.color}20`, color: cat.color }}
                          >
                            {j + 1}
                          </span>
                          <span className="font-rajdhani text-gray-300 leading-relaxed">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <div className={`mt-10 p-6 rounded-2xl bg-red-950/20 border border-red-800/40 flex items-start gap-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-3xl">⚠️</span>
          <div>
            <h4 className="font-orbitron font-bold text-red-400 text-sm mb-1">AVERTISSEMENT</h4>
            <p className="font-rajdhani text-gray-400 leading-relaxed">
              Le non-respect du règlement entraîne des sanctions progressives: avertissement, kick,
              bannissement temporaire ou permanent selon la gravité. Le staff se réserve le droit
              de sanctionner tout comportement nuisible même non listé ici.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
