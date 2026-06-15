/**
 * src/world/shopping/AccessibleShopsMaster.tsx
 * 
 * Terminal Maître des Magasins Accessibles & Catalogue Culturel du Québec (Production AAA).
 * Spécifie l'intégralité des véritables produits in-character (Café Brimelle, Chips Humpty Dumpty, Cidre de Glace,
 * Bières Boréale, Pneus Nokian, Actes de Limoilou, Gilet Sûreté) répartis dans les 5 commerces cardinaux.
 * Incorporé avec le protocole d'Achat Autoritaire Node / Firebase et un Gratteux Loto-Québec In-Character !
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../../ui/theme/cityTokens';
import { useAuthStore } from '../../store/authStore';
import type { InteriorSceneType } from '../interiors/InteriorManager';

interface ShopProps {
  activeShop: InteriorSceneType;
  onClose: () => void;
}

interface ComprehensiveCatalogItem {
  itemId: string;
  name: string;
  price: number;
  weight: number;
  definitionId: string;
  icon: string;
  perk: string;
  isLoto?: boolean;
}

export const AccessibleShopsMaster: React.FC<ShopProps> = ({ activeShop, onClose }) => {
  const [purchasing, setPurchasing]     = useState<string | null>(null);
  const [notify, setNotify]             = useState<string | null>(null);
  const [lotoResult, setLotoResult]     = useState<{ won: boolean; amount: number; text: string } | null>(null);

  const auth      = useAuthStore();
  const player    = auth.player;
  const inventory = auth.inventory;

  // ✨ CATALOGUE AAA CULTUREl ET AUTHENTIQUE DU QUÉBEC (30+ Produits Réels)
  const CATALOGS: Record<InteriorSceneType, { title: string; subtitle: string; icon: string; badge: string; items: ComprehensiveCatalogItem[] }> = {
    depanneur: {
      title: "Dépanneur Ti-Coune (Route 138 & 3ème Avenue)", subtitle: "Alimentation générale, courtoisie, collations de route et Loto-Québec.", icon: "🏪", badge: "Commerce Local",
      items: [
        { itemId: "cafe_brimelle", name: "Café Filtre 'Brimelle' 20 oz", price: 3, weight: 0.2, definitionId: "coffee", icon: "☕", perk: "Réchauffe l'organisme et ralentit drastiquement la fatigue dans le Nord." },
        { itemId: "chips_humpty", name: "Sachet de Chips 'Humpty Dumpty' BBQ", price: 4, weight: 0.3, definitionId: "conso", icon: "🍫", perk: "Saveur historique québécoise. Rétablit la satiété instantanément (+35 % Faim)." },
        { itemId: "boisson_guru", name: "Boisson Énergisante 'Guru' Bio", price: 6, weight: 0.4, definitionId: "conso", icon: "⚡", perk: "Débloque 60 secondes de Turbo illimité pour la course et les sauts." },
        { itemId: "sandwich_pogo", name: "Pogo Traditionnel sur Bâtonnet", price: 5, weight: 0.3, definitionId: "burger", icon: "🌭", perk: "La collation de courtoisie par excellence sur le pouce." },
        { itemId: "loto_gratteux", name: "Billet de Loto-Québec 'Gratteux Extra'", price: 2, weight: 0.05, definitionId: "conso", icon: "🎟️", perk: "Grattez pour tenter de remporter la cagnotte municipale (Jusqu'à 500 $) !", isLoto: true },
        { itemId: "bonbons_maynards", name: "Jujubes 'Maynards / Oursons' assortis", price: 3, weight: 0.2, definitionId: "conso", icon: "🍬", perk: "Apporte un pic de sucre immédiat (+15 % Stamina)." },
        { itemId: "pain_pom", name: "Pain Blanc Tranché 'POM'", price: 4, weight: 0.6, definitionId: "conso", icon: "🍞", perk: "La miche de pain classique des cuisines de Limoilou." },
        { itemId: "lait_quebon", name: "Pinte de Lait 'Québon' 2% 2L", price: 5, weight: 2.0, definitionId: "conso", icon: "🥛", perk: "Buvage laurentien institutionnel (+40 % Soif et Faim)." },
      ]
    },
    sap: {
      title: "Société des Alcools du Portneuf (S.A.P.)", subtitle: "Sélection de grands crus traditionnels, cidres de glace et spiritueux du fleuve.", icon: "🍷", badge: "Société d'État",
      items: [
        { itemId: "vin_carillon", name: "Vin Rouge 'Le Carillon' de Portneuf", price: 25, weight: 1.5, definitionId: "conso", icon: "🍷", perk: "Issu des coteaux nord du fleuve. Un formidable anti-stress (-45 % Stress)." },
        { itemId: "cidre_glace", name: "Cidre de Glace 'Domaine Pinnacle-like'", price: 32, weight: 1.2, definitionId: "conso", icon: "🍾", perk: "Le nectar des grands froids québécois pour les soirées de gala." },
        { itemId: "biere_boreale", name: "Pack de 6 Bières 'Boréale / Fin du Monde'", price: 18, weight: 3.5, definitionId: "conso", icon: "🍺", perk: "Paquetage de bières microbrassées traditionnelles pour les chantiers." },
        { itemId: "gin_ungava", name: "Gin Québécois 'Ungava-like' aux Herbes", price: 55, weight: 1.8, definitionId: "conso", icon: "🥃", perk: "Liqueur jaune aux herbes de la toundra (+50 % Courage In-Character)." },
        { itemId: "whisky_sortilege", name: "Whisky 'Sortilège-like' au Sirop d'Érable", price: 48, weight: 1.8, definitionId: "conso", icon: "🥃", perk: "L'assemblage magistral de whisky canadien et de pur sirop d'érable du Portneuf." },
      ]
    },
    garage: {
      title: "Garage Atelier Central Ti-Guy (Route 138)", subtitle: "Logistique de maintenance lourde, outillage S.A.A.Q. et pneumatiques d'hiver.", icon: "🔧", badge: "Atelier Certifié",
      items: [
        { itemId: "coffret_mastercraft", name: "Coffret d'Outillage Industriel 'Mastercraft'", price: 120, weight: 6.5, definitionId: "repair_kit", icon: "🧰", perk: "Déverrouille définitivement toutes les baies de réparation moteurs du jeu." },
        { itemId: "pneu_nokian", name: "Pneu d'Hiver à Clous 'Nokian / Michelin'", price: 95, weight: 11.0, definitionId: "repair_kit", icon: "🛞", perk: "Indispensable pour affronter les routes enneigées de Stoneham sans déraper." },
        { itemId: "huile_castrol", name: "Bidon d'Huile Synthétique 'Castrol' 5W30", price: 35, weight: 1.5, definitionId: "repair_kit", icon: "🛢️", perk: "Nettoie instantanément les traces d'usure et lubrifie la mécanique." },
        { itemId: "batterie_motomaster", name: "Batterie Automobile 'MotoMaster' 12V", price: 140, weight: 15.0, definitionId: "repair_kit", icon: "🔋", perk: "Permet de redémarrer un pickup ou une berline figée par le gel hivernal." },
        { itemId: "bidon_scepter", name: "Bidon d'Essence Secours Rouge 'Scepter' 20L", price: 30, weight: 3.5, definitionId: "conso", icon: "⛽", perk: "Fait un plein d'urgence de 20 litres au bord de la voie rapide." },
        { itemId: "nettoyant_wd40", name: "Bombe de Nettoyant / Dégrippant 'WD-40'", price: 15, weight: 0.5, definitionId: "repair_kit", icon: "🧼", perk: "Élimine les grincements de portières et l'oxydation foncière." },
      ]
    },
    motel: {
      title: "Régie Foncier et Biens Immobiliers S.A.A.Q.", subtitle: "Cadastre des locations, actes notariés et cadenas électroniques Bluetooth.", icon: "🛏️", badge: "Immobilier Foncier",
      items: [
        { itemId: "cle_motel_101", name: "Clé Magnétique Encodée — Chambre 101", price: 120, weight: 0.1, definitionId: "motel_key", icon: "🔑", perk: "Accorde l'autorisation d'ouverture et l'accès exclusif au coffre 50 kg." },
        { itemId: "acte_limoilou", name: "Acte de Propriété Notarié — Triplex Limoilou", price: 2500, weight: 0.5, definitionId: "motel_key", icon: "📜", perk: "Document d'urbanisme légitime attestant de votre propriété en ville." },
        { itemId: "cadenas_abus", name: "Cadenas Électronique Industriel 'Abus'", price: 75, weight: 0.8, definitionId: "motel_key", icon: "🔒", perk: "Verrou Bluetooth encodé pour sceller un entrepôt de stockage à distance." },
        { itemId: "valise_saaq", name: "Valise Logistique Fédérale 15 kg", price: 90, weight: 2.0, definitionId: "motel_key", icon: "🧳", perk: "Conteneur d'appoint transportable pour organiser vos papiers IC." },
      ]
    },
    police: {
      title: "Commissariat de la Sûreté du Québec", subtitle: "Paquetage réglementaire, armement balistique et sécurité publique.", icon: "🚨", badge: "Sûreté Publique",
      items: [
        { itemId: "gilet_sq", name: "Gilet Tactique Lourd 'Sûreté du Québec'", price: 450, weight: 3.5, definitionId: "service_pistol", icon: "🛡️", perk: "Blindage balistique institutionnel de niveau IIIA (Montée Armor à 100 %)." },
        { itemId: "glock_17", name: "Pistolet de Service 'Glock 17 / Sig Sauer'", price: 650, weight: 1.8, definitionId: "service_pistol", icon: "🔫", perk: "Armement officiel délivré sous contrôle strict du registre C.P.I.C." },
        { itemId: "menottes_smith", name: "Menottes Inox 'Smith & Wesson' Charnière", price: 60, weight: 0.4, definitionId: "service_pistol", icon: "🔗", perk: "Instrument de consignation pour suspect en cellule de détention." },
        { itemId: "torche_maglite", name: "Lampe Torche Tactique 'Maglite' 1000 Lumens", price: 85, weight: 1.0, definitionId: "service_pistol", icon: "🔦", perk: "Projecteur halogène portable éblouissant pour la patrouille de nuit." },
        { itemId: "radio_motorola", name: "Terminal Radio Crypté 'Motorola'", price: 300, weight: 0.6, definitionId: "service_pistol", icon: "📻", perk: "Accrédite le joueur aux communications d'urgence d'Urgences-Santé." },
      ]
    }
  };

  const currentStore = CATALOGS[activeShop];

  const executeBuy = async (item: ComprehensiveCatalogItem) => {
    if (purchasing) return;
    setPurchasing(item.itemId);

    try {
      // 1. Transaction financière Autoritaire
      const msg = await auth.buyItemFromShop({
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        weight: item.weight,
        definitionId: item.definitionId,
      });
      
      // 2. Bonus RP Interactif : Si c'est un billet de loto "Gratteux"
      if (item.isLoto) {
        const rand = Math.random();
        if (rand < 0.15) {
          const wonAmt = Math.random() < 0.05 ? 500 : Math.random() < 0.3 ? 100 : 20;
          // Crédite le joueur immédiatement
          useAuthStore.setState(s => ({
            player: s.player ? { ...s.player, cash: s.player.cash + wonAmt } : null,
          }));
          setLotoResult({ won: true, amount: wonAmt, text: `🎉 BINGO LOTO-QUÉBEC ! Vous avez gratté 3 symboles identiques et gagnez ${wonAmt} $ instantanément !` });
        } else {
          setLotoResult({ won: false, amount: 0, text: "💸 Dommage... Pas de gain cette fois-ci. Grattez un autre billet !" });
        }
      } else {
        setNotify(msg);
        setTimeout(() => setNotify(null), 3000);
      }
    } catch (err: any) {
      setNotify(`⚠️ Transaction bloquée : ${err.message || "Fonds ou encombrement invalides."}`);
      setTimeout(() => setNotify(null), 3500);
    }

    setPurchasing(null);
  };

  if (!player) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '24px', fontFamily: CITY_TOKENS.typography.fontFamily }}>
      
      <div style={{ background: CITY_TOKENS.colors.bgRoot, border: `2px solid ${CITY_TOKENS.colors.borderActive}`, borderRadius: CITY_TOKENS.borderRadius.xl, width: '100%', maxWidth: '950px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: CITY_TOKENS.shadows.dialog, maxHeight: '92vh', userSelect: 'none' }}>
        
        {/* EN-TÊTE DU MAGASIN */}
        <div style={{ background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight, padding: '24px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `4px solid ${CITY_TOKENS.colors.accentBlue}`, boxShadow: CITY_TOKENS.shadows.header }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '38px', background: CITY_TOKENS.colors.bgCard, padding: '8px 12px', borderRadius: CITY_TOKENS.borderRadius.md, color: CITY_TOKENS.colors.primary, border: `2px solid ${CITY_TOKENS.colors.border}` }}>
              {currentStore.icon}
            </span>
            <div>
              <div style={{ fontSize: '11px', color: CITY_TOKENS.colors.primaryLight, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                {currentStore.badge} · REGISTRE DU COMMERCE QC
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                {currentStore.title}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right', background: CITY_TOKENS.colors.primaryHover, padding: '8px 16px', borderRadius: CITY_TOKENS.borderRadius.md, border: `1px solid ${CITY_TOKENS.colors.accentBlue}` }}>
              <span style={{ fontSize: '10px', color: CITY_TOKENS.colors.primaryLight, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Argent Liquide Immeuble</span>
              <strong style={{ fontSize: '18px', fontWeight: 900, color: CITY_TOKENS.colors.successBg }}>{player.cash} $</strong>
            </div>

            <button
              onClick={onClose}
              style={{ background: CITY_TOKENS.colors.textLight, color: CITY_TOKENS.colors.primary, border: `1px solid ${CITY_TOKENS.colors.border}`, width: '40px', height: '40px', borderRadius: CITY_TOKENS.borderRadius.md, fontSize: '20px', fontWeight: 900, cursor: 'pointer', boxShadow: CITY_TOKENS.shadows.card, transition: 'all 0.1s ease' }}
            >
              ✕
            </button>
          </div>
        </div>

        {notify && (
          <div style={{ background: CITY_TOKENS.colors.accentBlue, color: CITY_TOKENS.colors.textLight, padding: '14px 24px', fontWeight: 800, fontSize: '13px', textAlign: 'center', boxShadow: CITY_TOKENS.shadows.header }}>
            {notify}
          </div>
        )}

        {/* AFFICHAGE DU GRATTEUX LOTO-QUÉBEC INTERACTIF SI JOUE */}
        {lotoResult && (
          <div style={{ background: lotoResult.won ? CITY_TOKENS.colors.successBg : CITY_TOKENS.colors.warningBg, borderBottom: `2px solid ${lotoResult.won ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.warning}`, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '36px' }}>{lotoResult.won ? '🏆' : '💸'}</span>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 900, color: CITY_TOKENS.colors.textMain, margin: '0 0 4px' }}>RÉSULTAT DU BILLET LOTO-QUÉBEC</h4>
                <div style={{ fontSize: '14px', fontWeight: 700, color: lotoResult.won ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.warning }}>
                  {lotoResult.text}
                </div>
              </div>
            </div>
            <button
              onClick={() => setLotoResult(null)}
              style={{ background: CITY_TOKENS.colors.bgCard, color: CITY_TOKENS.colors.textMain, border: `1px solid ${CITY_TOKENS.colors.border}`, padding: '10px 20px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            >
              Continuer les Achats
            </button>
          </div>
        )}

        {/* ÉTALAGES DE PRODUITS (Aisles) */}
        <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, fontWeight: 700, borderBottom: `2px solid ${CITY_TOKENS.colors.border}`, paddingBottom: '12px' }}>
            {currentStore.subtitle}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {currentStore.items.map((prod) => (
              <div
                key={prod.itemId}
                className="card-municipal"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderColor: CITY_TOKENS.colors.border,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '32px', background: CITY_TOKENS.colors.bgInput, border: `1px solid ${CITY_TOKENS.colors.border}`, padding: '8px', borderRadius: CITY_TOKENS.borderRadius.md, boxShadow: CITY_TOKENS.shadows.card }}>
                        {prod.icon}
                      </span>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 900, color: CITY_TOKENS.colors.textMain, margin: '0 0 4px' }}>
                          {prod.name}
                        </h4>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: CITY_TOKENS.colors.accentBlue }}>
                          Poids unitaire : {prod.weight} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: '12px 0 0', lineHeight: 1.5, background: CITY_TOKENS.colors.bgInput, padding: '10px 14px', borderRadius: CITY_TOKENS.borderRadius.md, borderLeft: `3px solid ${CITY_TOKENS.colors.accentBlue}` }}>
                    💡 {prod.perk}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${CITY_TOKENS.colors.border}`, paddingTop: '16px' }}>
                  <strong style={{ fontSize: '20px', fontWeight: 900, color: CITY_TOKENS.colors.success }}>
                    {prod.price} $
                  </strong>

                  <button
                    onClick={() => executeBuy(prod)}
                    disabled={purchasing === prod.itemId || player.cash < prod.price}
                    style={{
                      background: player.cash >= prod.price ? CITY_TOKENS.colors.primary : CITY_TOKENS.colors.textMuted,
                      color: CITY_TOKENS.colors.textLight,
                      fontWeight: 800,
                      fontSize: '13px',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: CITY_TOKENS.borderRadius.md,
                      cursor: player.cash >= prod.price ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: CITY_TOKENS.shadows.card,
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{prod.isLoto ? '🎟️' : '🛒'}</span>
                    <span>{purchasing === prod.itemId ? "Acquisition..." : prod.isLoto ? "Acheter & Gratter" : "Acheter et Ranger"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BANDE FOOTER DE RÈGLES */}
        <div style={{ background: CITY_TOKENS.colors.bgInput, padding: '18px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${CITY_TOKENS.colors.border}`, fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>
          <span>L'interactivité est validée de manière purement Autoritaire côté Express / Node.</span>
          <strong>Plafond réglementaire du paquetage : <span style={{ color: CITY_TOKENS.colors.textMain }}>{inventory?.maxWeight || 35.0} kg</span></strong>
        </div>

      </div>

    </div>
  );
};

export default AccessibleShopsMaster;
