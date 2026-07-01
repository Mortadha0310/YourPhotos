'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, Users, Plus, Trash2, ToggleLeft, ToggleRight, LogOut, Eye, EyeOff, X } from 'lucide-react';

interface Photographer {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated' && (session.user as any).role !== 'admin') router.push('/photographer');
    if (status === 'authenticated') fetchPhotographers();
  }, [status]);

  async function fetchPhotographers() {
    const res = await fetch('/api/users');
    setPhotographers(await res.json());
  }

  async function createPhotographer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Erreur');
    } else {
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchPhotographers();
    }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchPhotographers();
  }

  async function deleteUser(id: string) {
    if (!confirm('Supprimer ce photographe ?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchPhotographers();
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="text-purple-400" size={22} />
          <span className="font-bold gradient-text text-sm sm:text-base">PhotoShare Admin</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm hidden sm:block" style={{ color: 'var(--muted)' }}>
            {session?.user?.name}
          </span>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1 text-xs sm:text-sm hover:text-red-400 transition-colors"
            style={{ color: 'var(--muted)' }}>
            <LogOut size={15} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl font-black gradient-text">{photographers.length}</div>
            <div className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>Photographes</div>
          </div>
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl font-black gradient-text">
              {photographers.filter(p => p.isActive).length}
            </div>
            <div className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>Actifs</div>
          </div>
        </div>

        {/* Header row */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            <h2 className="text-lg sm:text-xl font-bold">Photographes</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3 sm:px-4">
            <Plus size={15} />
            <span className="hidden sm:inline">Nouveau</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-5 fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm sm:text-base">Créer un compte photographe</h3>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            {error && (
              <div className="mb-3 p-2 rounded-lg text-xs sm:text-sm"
                style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6584' }}>{error}</div>
            )}
            <form onSubmit={createPhotographer} className="space-y-3">
              <input className="input text-base" placeholder="Nom complet" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="input text-base" type="email" placeholder="Email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <div className="relative">
                <input className="input pr-10 text-base" type={showPwd ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={loading}>
                {loading ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {photographers.length === 0 && (
            <div className="glass rounded-xl sm:rounded-2xl p-10 sm:p-12 text-center text-sm"
              style={{ color: 'var(--muted)' }}>
              Aucun photographe. Créez-en un !
            </div>
          )}
          {photographers.map(p => (
            <div key={p._id} className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base truncate">{p.name}</div>
                  <div className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{p.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {p.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(p._id, p.isActive)}
                    className="p-1.5 hover:text-purple-400 transition-colors" style={{ color: 'var(--muted)' }}>
                    {p.isActive
                      ? <ToggleRight size={22} className="text-purple-400" />
                      : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => deleteUser(p._id)}
                    className="p-1.5 hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
