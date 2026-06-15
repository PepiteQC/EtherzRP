/**
 * src/world/interiors/InteriorManager.tsx
 * 
 * Gestionnaire Maître de Rendu des Scènes Intérieures d'EtherWorld RP (Production).
 * Orchestre la transition sans chargements inutiles et affiche l'intérieur 3D adéquat
 * en suspendant l'affichage des Chunks extérieurs pour préserver les 60 FPS.
 */

import React, { useState } from 'react';
import DepanneurInterior from './DepanneurInterior';
import GarageInterior from './GarageInterior';
import SAPInterior from './SAPInterior';
import MotelRoomInterior from './MotelRoomInterior';
import PoliceStationInterior from './PoliceStationInterior';

export type InteriorSceneType = 'depanneur' | 'garage' | 'sap' | 'motel' | 'police';

interface ManagerProps {
  interiorId: InteriorSceneType;
  onExit: () => void;
}

export const InteriorManager: React.FC<ManagerProps> = ({ interiorId, onExit }) => {
  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <group name={`InteriorRoomGroup_${interiorId}`}>
      {/* Rendu 3D de l'Intérieur Choisi */}
      {interiorId === 'depanneur' && <DepanneurInterior onExit={onExit} onNotify={showNotify} />}
      {interiorId === 'garage'    && <GarageInterior    onExit={onExit} onNotify={showNotify} />}
      {interiorId === 'sap'       && <SAPInterior       onExit={onExit} onNotify={showNotify} />}
      {interiorId === 'motel'     && <MotelRoomInterior onExit={onExit} onNotify={showNotify} />}
      {interiorId === 'police'    && <PoliceStationInterior onExit={onExit} onNotify={showNotify} />}

      {/* Rendu de la consigne d'action RP générale */}
      {notification && (
        <mesh position={[0, 5, 0]}>
          <planeGeometry args={[12, 1.2]} />
          <meshBasicMaterial color="#166534" />
        </mesh>
      )}
    </group>
  );
};

export default InteriorManager;
