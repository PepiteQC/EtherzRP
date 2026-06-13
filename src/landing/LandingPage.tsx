/**
 * LandingPage — Site vitrine ETHERWORLD RP QUÉBEC
 *
 * Page d'accueil affichée avant le jeu.
 * Le bouton "JOUER" (navbar, une fois connecté) ou "Lancer le jeu"
 * appelle onEnterGame pour basculer vers le jeu 3D.
 */
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import LieuxSection from './components/LieuxSection';
import FactionsSection from './components/FactionsSection';
import RulesSection from './components/RulesSection';
import JoinSection from './components/JoinSection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import LiveDashboard from './components/LiveDashboard';
import FloatingActions from './components/FloatingActions';
import { useStore } from './store/useStore';
import './landing.css';

interface LandingPageProps {
  onEnterGame: () => void;
}

export default function LandingPage({ onEnterGame }: LandingPageProps) {
  const setOnEnterGame = useStore(s => s.setOnEnterGame);

  // Le body du jeu a overflow:hidden — on l'autorise pour la landing
  useEffect(() => {
    document.body.classList.add('landing-active');
    setOnEnterGame(onEnterGame);
    return () => document.body.classList.remove('landing-active');
  }, [onEnterGame, setOnEnterGame]);

  return (
    <div className="landing-root">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <LieuxSection />
        <FactionsSection />
        <RulesSection />
        <JoinSection />
      </main>
      <Footer />
      <AuthModal />
      <LiveDashboard />
      <FloatingActions />

      {/* Bouton direct vers le jeu */}
      <button
        onClick={onEnterGame}
        className="fixed top-20 right-4 z-40 btn-secondary px-4 py-2 rounded-lg font-orbitron font-bold text-cyan-400 text-xs tracking-widest uppercase"
        title="Accéder directement au jeu"
      >
        🎮 LANCER LE JEU →
      </button>
    </div>
  );
}
