/**
 * src/ui/layout/CityShell.tsx
 * 
 * Conteneur Maître d'Application (Shell) du Guichet Unique Municipal EtherWorld.
 * Bascule avec une fluidité immaculée entre l'administration civile In-Character et le monde 3D.
 */

import React, { useState } from 'react';
import TopNavigation from './TopNavigation';
import SideMenu, { type PortalTab } from './SideMenu';
import PageContainer from './PageContainer';

// Composants Services
import DashboardHome from '../dashboard/DashboardHome';
import CitizenProfile from '../dashboard/CitizenProfile';
import JobsCenter from '../dashboard/JobsCenter';
import VehiclesGarage from '../dashboard/VehiclesGarage';
import PropertiesPanel from '../dashboard/PropertiesPanel';
import InventoryPanel from '../dashboard/InventoryPanel';
import CityServices from '../dashboard/CityServices';
import SettingsPanel from '../dashboard/SettingsPanel';

// Moteur Monde 3D Réflectif
import { GameWorldManager } from '../../world/scenes/GameScene';
import CivilianHUD from '../hud/CivilianHUD';

export const CityShell: React.FC = () => {
  const [currentTab, setCurrentTab]     = useState<PortalTab>('home');
  const [isWorldActive, setIsWorldActive] = useState<boolean>(false);

  // Titres du guichet unique
  const PAGE_TITLES: Record<PortalTab, { title: string; subtitle: string }> = {
    home:       { title: "Accueil Municipal", subtitle: "Guichet unique des services publics de la Ville de Québec." },
    profile:    { title: "Dossier Accrédité", subtitle: "Certificat de citoyenneté In-Character et métriques vitales." },
    jobs:       { title: "Carrières & Salaires", subtitle: "Ratification de contrats de la fonction publique et perception salariale." },
    garage:     { title: "Registre Automobile", subtitle: "Gestion de flotte motorisée, immatriculation S.A.A.Q. et verrous." },
    properties: { title: "Cadastre Immobilier", subtitle: "Propriétés résidentielles, serrures réseau et gestion des locataires." },
    inventory:  { title: "Inventaire Personnel", subtitle: "Paquetage d'équipement, conteneurs et calcul d'encombrement RP." },
    services:   { title: "Services Publics", subtitle: "Accès prioritaire aux guichets de la Police, Paramédic et Garages." },
    settings:   { title: "Préférences Systèmes", subtitle: "Calibration de la fidélité de rendu Three.js et intervalles d'autosave." },
  };

  const currentInfo = PAGE_TITLES[currentTab];

  return (
    <div className="municipal-portal" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* 1. BARRE DE NAVIGATION SUPÉRIEURE (Sûreté QC) */}
      <TopNavigation
        isWorldActive={isWorldActive}
        onToggleWorld3D={() => setIsWorldActive(prev => !prev)}
      />

      {/* 2. CORPS CENTRAL : VIllE 3D OU GUICHET CIVIL */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {isWorldActive ? (
          <>
            {/* ✨ MONDE 3D MODE V5 SOMBRE REFLECTIF WITH 0 OBJET SOUS LA MAP */}
            <GameWorldManager />

            {/* 🛡️ HUD CIVIL Minimaliste */}
            <CivilianHUD />
          </>
        ) : (
          <>
            {/* NAVIGATION LATÉRALE (Sidebar) */}
            <SideMenu
              currentTab={currentTab}
              onTabChange={setCurrentTab}
            />

            {/* CONTENEUR BLANC/GRIS DE FORMULAIRES ET REGISTRES */}
            <PageContainer title={currentInfo.title} subtitle={currentInfo.subtitle}>
              {currentTab === 'home'       && <DashboardHome />}
              {currentTab === 'profile'    && <CitizenProfile />}
              {currentTab === 'jobs'       && <JobsCenter />}
              {currentTab === 'garage'     && <VehiclesGarage />}
              {currentTab === 'properties' && <PropertiesPanel />}
              {currentTab === 'inventory'  && <InventoryPanel />}
              {currentTab === 'services'   && <CityServices />}
              {currentTab === 'settings'   && <SettingsPanel />}
            </PageContainer>
          </>
        )}

      </div>

    </div>
  );
};

export default CityShell;
