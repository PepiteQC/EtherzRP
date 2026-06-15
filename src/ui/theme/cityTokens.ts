/**
 * src/ui/theme/cityTokens.ts
 * 
 * Jetons de Design Officiels du Portail Civil EtherWorld (Québec RP).
 * Fait respecter la directive visuelle :
 * - Blanc cassé / gris clair / Bleu municipal (Ambiance service public & ville moderne)
 * - Remplace tout effet Cyberpunk, FiveM ou néon par une esthétique institutionnelle propre.
 */

export const CITY_TOKENS = {
  colors: {
    // Palette Institutionnelle Principale
    primary:        "#003366", // Bleu drapeau du Québec (Sûreté & Municipal)
    primaryHover:   "#004080",
    primaryLight:   "#e6f0fa", // Fond d'accentuation doux
    
    // Fonds (Backgrounds)
    bgRoot:         "#f1f5f9", // Gris clair / Blanc cassé très propre
    bgCard:         "#ffffff", // Blanc pur pour les cartes
    bgInput:        "#f8fafc",
    bgSidebar:      "#ffffff",
    
    // Textes & Typographie
    textMain:       "#0f172a", // Ardoise très foncée pour lisibilité maximale
    textSecondary:  "#475569", // Gris ardoise moyen
    textMuted:      "#94a3b8",
    textLight:      "#ffffff",
    
    // Bordures & Séparateurs
    border:         "#e2e8f0",
    borderActive:   "#0284c7",
    
    // Accents & Statuts
    accentBlue:     "#0284c7", // Bleu service public moderne
    success:        "#16a34a", // Vert municipal validé
    successBg:      "#dcfce7",
    warning:        "#d97706", // Orange signalisation
    warningBg:      "#fef3c7",
    danger:         "#dc2626", // Rouge urgence
    dangerBg:       "#fee2e2",
  },
  
  shadows: {
    card:    "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    dialog:  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    header:  "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  },
  
  borderRadius: {
    sm:   "4px",
    md:   "8px",
    lg:   "12px",
    xl:   "16px",
    full: "9999px",
  },

  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
} as const;

export default CITY_TOKENS;
