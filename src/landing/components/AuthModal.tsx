import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function AuthModal() {
  const { activeModal, closeModal, login } = useStore();
  const [tab, setTab] = useState<'login' | 'register'>(activeModal === 'register' ? 'register' : 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    charName: '',
    age: '',
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (activeModal !== 'login' && activeModal !== 'register') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate auth
    await new Promise(r => setTimeout(r, 1500));

    if (tab === 'login') {
      if (formData.email && formData.password) {
        login(formData.email.split('@')[0]);
        setSuccess('Connexion réussie! Bienvenue dans ETHERWORLD.');
        setTimeout(closeModal, 1500);
      } else {
        setError('Email et mot de passe requis.');
      }
    } else {
      if (!formData.agree) {
        setError('Tu dois accepter le règlement pour continuer.');
        setLoading(false);
        return;
      }
      if (formData.email && formData.password && formData.username && formData.charName) {
        login(formData.username);
        setSuccess('Compte créé! Bienvenue dans ETHERWORLD RP QUÉBEC!');
        setTimeout(closeModal, 1500);
      } else {
        setError('Tous les champs sont requis.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md">
        <div className="relative bg-[#030712] border border-purple-700/40 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20">

          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-purple-400/60 blur-sm" />

          {/* Header */}
          <div className="relative p-6 pb-0">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-purple-600 rounded-lg rotate-45" />
                <div className="absolute inset-1 bg-cyan-500 rounded-md rotate-[22deg] opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-orbitron font-black text-sm">E</span>
                </div>
              </div>
              <div>
                <div className="font-orbitron font-black text-white">ETHERWORLD RP</div>
                <div className="text-xs text-cyan-400 font-rajdhani tracking-widest">QUÉBEC CITY</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-black/60 p-1 border border-gray-800 mb-6">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-rajdhani font-bold text-sm tracking-wider uppercase transition-all ${
                    tab === t
                      ? 'bg-purple-700 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm font-rajdhani">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-900/20 border border-green-700/40 text-green-400 text-sm font-rajdhani">
                ✓ {success}
              </div>
            )}

            <div className="space-y-4">

              {tab === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-rajdhani text-gray-500 tracking-widest uppercase mb-1.5">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                      placeholder="VotreNom123"
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-gray-700 text-white placeholder-gray-600 font-rajdhani focus:outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-rajdhani text-gray-500 tracking-widest uppercase mb-1.5">
                      Nom du personnage (IC)
                    </label>
                    <input
                      type="text"
                      value={formData.charName}
                      onChange={e => setFormData(f => ({ ...f, charName: e.target.value }))}
                      placeholder="Jean Tremblay"
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-gray-700 text-white placeholder-gray-600 font-rajdhani focus:outline-none focus:border-purple-600 transition-colors"
                    />
                    <p className="text-xs text-gray-600 font-rajdhani mt-1">Prénom + nom réaliste requis</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-rajdhani text-gray-500 tracking-widest uppercase mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="vous@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-gray-700 text-white placeholder-gray-600 font-rajdhani focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani text-gray-500 tracking-widest uppercase mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-gray-700 text-white placeholder-gray-600 font-rajdhani focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>

              {tab === 'register' && (
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setFormData(f => ({ ...f, agree: !f.agree }))}
                    className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                      formData.agree ? 'bg-purple-600 border-purple-600' : 'border-gray-600 group-hover:border-purple-600'
                    }`}
                  >
                    {formData.agree && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="font-rajdhani text-sm text-gray-400">
                    J'accepte le règlement d'ETHERWORLD RP QUÉBEC et confirme avoir <strong className="text-white">16 ans ou plus</strong>.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 rounded-xl font-orbitron font-bold text-white tracking-widest text-sm uppercase flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion...
                  </>
                ) : (
                  tab === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTab(tab === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className="text-sm font-rajdhani text-gray-500 hover:text-purple-400 transition-colors"
                >
                  {tab === 'login' ? 'Pas de compte? S\'inscrire →' : 'Déjà un compte? Se connecter →'}
                </button>
              </div>
            </div>
          </form>

          {/* Bottom dividers */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-900/60 to-transparent" />
        </div>
      </div>
    </div>
  );
}
