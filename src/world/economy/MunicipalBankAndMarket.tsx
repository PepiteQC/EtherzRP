/**
 * src/world/economy/MunicipalBankAndMarket.tsx
 * 
 * Centre Financier, Banques & Bourse du Portneuf (Production AAA).
 * Encadre les opérations de guichet ATM (Déposer, Retirer, Virer) et le trading boursier In-Character
 * sous l'autorité absolue de Node et Cloud Firestore.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../../ui/theme/cityTokens';
import { useAuthStore } from '../../store/authStore';

interface FinancialPortalProps {
  onClose: () => void;
}

export const MunicipalBankAndMarket: React.FC<FinancialPortalProps> = ({ onClose }) => {
  const [activePortalTab, setActivePortalTab] = useState<'bank' | 'market'>('bank');
  const [bankingAction, setBankingAction]     = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amountInput, setAmountInput]         = useState('');
  const [targetAccountInput, setTargetAccountInput] = useState('');
  const [notify, setNotify]                   = useState<string | null>(null);

  const auth   = useAuthStore();
  const player = auth.player;

  const MARKET_COMMODITIES = [
    { id: 'timber', name: 'Grumes de Bois Brutes (Saint-Raymond)', unitPrice: 120, trend: '+4.5 %', icon: '🌲', tax: '15 %' },
    { id: 'cider',  name: 'Casiers de Cidre de Glace (Neuville)',    unitPrice: 85,  trend: '-1.2 %', icon: '🍾', tax: '15 %' },
    { id: 'parts',  name: 'Kits Logistiques Mécaniques (Ti-Guy)',    unitPrice: 210, trend: '+8.9 %', icon: '🔧', tax: '5 %'  },
  ];

  const showNotice = (msg: string) => {
    setNotify(msg);
    setTimeout(() => setNotify(null), 3500);
  };

  const handleBankingOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      showNotice("⚠️ Veuillez saisir un montant numérique strictement positif.");
      return;
    }

    try {
      const msg = await auth.executeBankingTx({
        action: bankingAction,
        amount: amt,
        targetUid: bankingAction === 'transfer' ? targetAccountInput.trim() : undefined,
      });
      showNotice(msg);
      setAmountInput('');
      setTargetAccountInput('');
    } catch (err: any) {
      showNotice(`⚠️ Saisie refusée : ${err.message || "Opération impossible."}`);
    }
  };

  const handleCommodityTrade = async (commName: string, tradeType: 'buy' | 'sell', unitCost: number) => {
    try {
      const msg = await auth.executeMarketTx({
        tradeType,
        resourceName: commName,
        totalValue: unitCost,
      });
      showNotice(msg);
    } catch (err: any) {
      showNotice(`⚠️ Ordre boursier rejeté : ${err.message || "Fonds bancaires insuffisants."}`);
    }
  };

  if (!player) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(10px)', padding: '24px', fontFamily: CITY_TOKENS.typography.fontFamily, userSelect: 'none' }}>
      
      <div style={{ background: CITY_TOKENS.colors.bgCard, border: `2px solid ${CITY_TOKENS.colors.borderActive}`, borderRadius: CITY_TOKENS.borderRadius.xl, width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: CITY_TOKENS.shadows.dialog, maxHeight: '92vh' }}>
        
        {/* HEADER FINANCIER */}
        <div style={{ background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight, padding: '24px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `4px solid ${CITY_TOKENS.colors.accentBlue}`, boxShadow: CITY_TOKENS.shadows.header }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '38px', background: CITY_TOKENS.colors.bgCard, padding: '8px 14px', borderRadius: CITY_TOKENS.borderRadius.md, color: CITY_TOKENS.colors.primary, border: `2px solid ${CITY_TOKENS.colors.accentBlue}` }}>
              {activePortalTab === 'bank' ? '🏦' : '📈'}
            </span>
            <div>
              <div style={{ fontSize: '11px', color: CITY_TOKENS.colors.primaryLight, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                RÉGIE FEDERAlE & TRÉSOR PUBLIC
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                {activePortalTab === 'bank' ? "Banque Nationale du Québec & ATMs" : "Bourse du Commerce & Marché des Ressources"}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', background: CITY_TOKENS.colors.primaryHover, padding: '6px', borderRadius: CITY_TOKENS.borderRadius.md, border: `1px solid ${CITY_TOKENS.colors.accentBlue}` }}>
              <button
                onClick={() => { setActivePortalTab('bank'); setNotify(null); }}
                style={{ ...topBtnStyle, background: activePortalTab === 'bank' ? CITY_TOKENS.colors.bgCard : 'transparent', color: activePortalTab === 'bank' ? CITY_TOKENS.colors.primary : CITY_TOKENS.colors.textLight }}
              >
                🏦 Comptoir ATMs
              </button>
              <button
                onClick={() => { setActivePortalTab('market'); setNotify(null); }}
                style={{ ...topBtnStyle, background: activePortalTab === 'market' ? CITY_TOKENS.colors.bgCard : 'transparent', color: activePortalTab === 'market' ? CITY_TOKENS.colors.primary : CITY_TOKENS.colors.textLight }}
              >
                📈 Bourse Locale
              </button>
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
          <div style={{ background: CITY_TOKENS.colors.accentBlue, color: CITY_TOKENS.colors.textLight, padding: '14px 24px', fontWeight: 900, fontSize: '13px', textAlign: 'center', boxShadow: CITY_TOKENS.shadows.header }}>
            {notify}
          </div>
        )}

        {/* CONTENU 1 : BANQUE NATIONAlE & ATMs */}
        {activePortalTab === 'bank' && (
          <div style={{ padding: '28px 36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', overflowY: 'auto', flex: 1 }}>
            
            {/* SOLDES PROTÉGÉS */}
            <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: CITY_TOKENS.colors.bgRoot, border: `2px solid ${CITY_TOKENS.colors.primary}` }}>
              <div>
                <span style={{ fontSize: '11px', color: CITY_TOKENS.colors.textSecondary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '14px' }}>Soldes In-Character Protégés</span>
                
                <div style={{ background: CITY_TOKENS.colors.bgCard, padding: '20px', borderRadius: CITY_TOKENS.borderRadius.md, border: `1px solid ${CITY_TOKENS.colors.border}`, marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: CITY_TOKENS.shadows.card }}>
                  <div>
                    <span style={{ fontSize: '11px', color: CITY_TOKENS.colors.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Compte en Banque</span>
                    <strong style={{ fontSize: '28px', fontWeight: 900, color: CITY_TOKENS.colors.primary }}>{player.bank} $</strong>
                  </div>
                  <span style={{ fontSize: '28px' }}>💳</span>
                </div>

                <div style={{ background: CITY_TOKENS.colors.successBg, padding: '20px', borderRadius: CITY_TOKENS.borderRadius.md, border: `1px solid ${CITY_TOKENS.colors.success}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: CITY_TOKENS.shadows.card }}>
                  <div>
                    <span style={{ fontSize: '11px', color: CITY_TOKENS.colors.success, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Especes en Poche / Sac</span>
                    <strong style={{ fontSize: '24px', fontWeight: 900, color: CITY_TOKENS.colors.success }}>{player.cash} $</strong>
                  </div>
                  <span style={{ fontSize: '28px' }}>💵</span>
                </div>
              </div>

              <div style={{ background: CITY_TOKENS.colors.warningBg, color: CITY_TOKENS.colors.warning, padding: '14px', borderRadius: CITY_TOKENS.borderRadius.sm, fontSize: '12px', fontWeight: 800, lineHeight: 1.5 }}>
                💡 Règle de Banque : Le client ne modifie jamais ses soldes de lui-même. Chaque virement est notarié par une transaction atomique Node.
              </div>
            </div>

            {/* FORMULAIRE AUTORITAIRE DE GUICHET */}
            <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderColor: CITY_TOKENS.colors.accentBlue }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: CITY_TOKENS.colors.primary }}>
                ⚙️ Exécuter une Opération au Guichet ATM
              </h3>

              {/* Aiguillage d'action */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: CITY_TOKENS.colors.bgInput, padding: '6px', borderRadius: CITY_TOKENS.borderRadius.sm, border: `1px solid ${CITY_TOKENS.colors.border}` }}>
                {(['deposit', 'withdraw', 'transfer'] as const).map(act => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setBankingAction(act)}
                    style={{
                      background: bankingAction === act ? CITY_TOKENS.colors.accentBlue : 'transparent',
                      color: bankingAction === act ? '#fff' : CITY_TOKENS.colors.textSecondary,
                      border: 'none', padding: '10px', borderRadius: '4px',
                      fontWeight: bankingAction === act ? 900 : 700, fontSize: '12px',
                      cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.1s ease',
                    }}
                  >
                    {act === 'deposit' ? 'Déposer' : act === 'withdraw' ? 'Retirer' : 'Virement'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleBankingOperation} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: CITY_TOKENS.colors.textMain, textTransform: 'uppercase' }}>
                    Montant de la Transaction ($)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    placeholder="Ex: 500 $"
                    style={{ width: '100%', padding: '14px', borderRadius: CITY_TOKENS.borderRadius.sm, border: `1px solid ${CITY_TOKENS.colors.border}`, fontSize: '16px', fontWeight: 800, background: CITY_TOKENS.colors.bgInput }}
                  />
                </div>

                {bankingAction === 'transfer' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: CITY_TOKENS.colors.textMain, textTransform: 'uppercase' }}>
                      Identifiant Citoyen Destinataire (UID / targetUid)
                    </label>
                    <input
                      type="text"
                      value={targetAccountInput}
                      onChange={e => setTargetAccountInput(e.target.value)}
                      placeholder="Ex: citoyen_maxime, ou UID..."
                      style={{ width: '100%', padding: '14px', borderRadius: CITY_TOKENS.borderRadius.sm, border: `1px solid ${CITY_TOKENS.colors.border}`, fontSize: '14px', fontWeight: 600, background: CITY_TOKENS.colors.bgInput }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    marginTop: 'auto', background: CITY_TOKENS.colors.primary, color: '#fff',
                    border: 'none', padding: '16px', borderRadius: CITY_TOKENS.borderRadius.md,
                    fontWeight: 900, fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: CITY_TOKENS.shadows.card, transition: 'all 0.1s ease',
                  }}
                >
                  Confirmer et Envoyer l'Ordre au Trésor
                </button>
              </form>

            </div>

          </div>
        )}

        {/* CONTENU 2 : BOURSE DU COMMERCE & TRADING */}
        {activePortalTab === 'market' && (
          <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, fontWeight: 600, borderBottom: `1px solid ${CITY_TOKENS.colors.border}`, paddingBottom: '10px' }}>
              Indices boursiers des matières premières laurentiennes. Taxe d'accise municipale appliquée en direct.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {MARKET_COMMODITIES.map((comm) => (
                <div
                  key={comm.id}
                  className="card-municipal"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', border: `2px solid ${CITY_TOKENS.colors.border}` }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '36px' }}>{comm.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: comm.trend.includes('+') ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.danger, background: comm.trend.includes('+') ? CITY_TOKENS.colors.successBg : CITY_TOKENS.colors.dangerBg, padding: '4px 10px', borderRadius: '6px' }}>
                        {comm.trend}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: CITY_TOKENS.colors.textMain, margin: '0 0 6px' }}>
                      {comm.name}
                    </h4>

                    <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textMuted, marginBottom: '16px' }}>
                      Taxe municipale d'accise : <strong style={{ color: CITY_TOKENS.colors.primary }}>{comm.tax}</strong>
                    </div>

                    <div style={{ background: CITY_TOKENS.colors.bgInput, padding: '14px', borderRadius: '8px', border: `1px solid ${CITY_TOKENS.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: CITY_TOKENS.colors.textSecondary }}>Valeur Unitaire Boursière :</span>
                      <strong style={{ fontSize: '20px', fontWeight: 900, color: CITY_TOKENS.colors.primary }}>{comm.unitPrice} $</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleCommodityTrade(comm.name, 'buy', comm.unitPrice)}
                      style={{ ...marketBtnStyle, background: CITY_TOKENS.colors.primary, color: '#fff' }}
                    >
                      📉 Acheter Titre
                    </button>
                    <button
                      onClick={() => handleCommodityTrade(comm.name, 'sell', comm.unitPrice)}
                      style={{ ...marketBtnStyle, background: CITY_TOKENS.colors.success, color: '#fff' }}
                    >
                      📈 Vendre Titre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ background: CITY_TOKENS.colors.bgInput, padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${CITY_TOKENS.colors.border}`, fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>
          <span>L'ensemble des transferts et ordres de bourse sont consignés de manière infalsifiable par le Trésor Fédéral.</span>
          <strong>Solde Protégé en RAM : <span style={{ color: CITY_TOKENS.colors.primary }}>{player.bank} $</span></strong>
        </div>

      </div>

    </div>
  );
};

const topBtnStyle: React.CSSProperties = {
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  fontWeight: 900,
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
};

const marketBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 900,
  fontSize: '13px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  boxShadow: CITY_TOKENS.shadows.card,
};

export default MunicipalBankAndMarket;
