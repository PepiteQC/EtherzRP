/**
 * AdminConsoleExample.tsx - Exemple d'intégration
 * Montre comment intégrer la console admin dans votre app
 */

import React, { useEffect, useRef } from 'react';
import { AdminConsoleManager, AdminConsoleUI, useAdminConsole, PermissionLevel } from '@/systems/admin';
import { AuthContext } from '@/context/AuthContext';

interface AdminConsoleExampleProps {
  children?: React.ReactNode;
}

/**
 * Composant wrapper qui intègre la console admin
 */
export const AdminConsoleProvider: React.FC<AdminConsoleExampleProps> = ({ children }) => {
  const managerRef = useRef<AdminConsoleManager | null>(null);
  const authContext = React.useContext(AuthContext);
  const { isOpen, setIsOpen } = useAdminConsole(
    authContext?.user?.id || 'unknown',
    authContext?.user?.name || 'Player',
    authContext?.user?.permissionLevel || PermissionLevel.USER
  );

  // Initialiser le manager une seule fois
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new AdminConsoleManager({
        enableLogging: true,
        logToConsole: true,
        logToFirebase: false, // À activer après intégration Firebase
      });

      // Initialiser l'utilisateur courant s'il est admin
      if (authContext?.user && authContext.user.permissionLevel > PermissionLevel.USER) {
        managerRef.current.initializeAdmin({
          id: authContext.user.id,
          name: authContext.user.name,
          permissionLevel: authContext.user.permissionLevel,
        });
      }

      // Écouter les commandes
      managerRef.current.onCommandLogged((log) => {
        console.log(`[ADMIN LOG] ${log.adminName}: /${log.commandName}`);
        // Optionnellement envoyer à un système de notification
      });

      // Exposer globalement pour dev
      (window as any).adminConsole = managerRef.current;
    }
  }, [authContext?.user]);

  // Mettre à jour l'utilisateur s'il change
  useEffect(() => {
    if (
      managerRef.current &&
      authContext?.user &&
      authContext.user.permissionLevel > PermissionLevel.USER
    ) {
      managerRef.current.initializeAdmin({
        id: authContext.user.id,
        name: authContext.user.name,
        permissionLevel: authContext.user.permissionLevel,
      });
    }
  }, [authContext?.user]);

  return (
    <>
      {children}
      {authContext?.user && authContext.user.permissionLevel > PermissionLevel.USER && (
        <AdminConsoleUI
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          playerId={authContext.user.id}
          playerName={authContext.user.name}
          permissionLevel={authContext.user.permissionLevel}
          onCommand={async (command, result) => {
            if (managerRef.current) {
              await managerRef.current.executeCommand(command, authContext.user.id);
            }
          }}
        />
      )}
    </>
  );
};

/**
 * Utilisation dans App.tsx
 *
 * import { AdminConsoleProvider } from '@/systems/admin/AdminConsoleExample';
 *
 * function App() {
 *   return (
 *     <AdminConsoleProvider>
 *       <YourGameComponent />
 *     </AdminConsoleProvider>
 *   );
 * }
 */

export default AdminConsoleProvider;
