/**
 * src/ui/layout/PageContainer.tsx
 * 
 * Conteneur Général de Page de Service Municipal.
 * Encadre les formulaires et données avec une présentation immaculée sur fond blanc.
 */

import React, { type ReactNode } from 'react';
import CITY_TOKENS from '../theme/cityTokens';

interface PageContainerProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ title, subtitle, children, actions }) => {
  return (
    <main
      style={{
        flex: 1,
        background: CITY_TOKENS.colors.bgRoot,
        padding: '36px 48px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* EN-TÊTE DE SECTION */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: CITY_TOKENS.colors.textMain, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              {title}
            </h1>
            <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
              {subtitle}
            </p>
          </div>
          {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
        </div>

        {/* CONTENU ENFANT IMMACULE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {children}
        </div>
      </div>
    </main>
  );
};

export default PageContainer;
