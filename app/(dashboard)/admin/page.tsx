'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, Users, Plus, Trash2, ToggleLeft, ToggleRight, LogOut, Eye, EyeOff } from 'lucide-react';

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
    const data = await res.json();
    setPhotographers(data);
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
      <div className="text-purple-400 text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="text-purple-400" size={24} />
          <span className="font-bold gradient-text">PhotoShare Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {session?.user?.name}
          </span>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1 text-sm hover:text-red-400 transition-colors"
            style={{ color: 'var(--muted)' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="glass rounded-2xl p-6">
            <div className="text-4xl font-black gradient-text">{photographers.length}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Photographes</div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="text-4xl font-black gradient-text">{photographers.filter(p => p.isActive).length}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Actifs</div>
          </div>
        </div>

        {/* Photographers */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-purple-400" />
            <h2 className="text-xl font-bold">Photographes</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau photographe
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="glass rounded-2xl p-6 mb-6 fade-in">
            <h3 className="font-semibold mb-4">Créer un compte photographe</h3>
            {error && (
              <div className="mb-3 p-2 rounded-lg text-sm" style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6584' }}>
                {error}
              </div>
            )}
            <form onSubmit={createPhotographer} className="grid md:grid-cols-3 gap-4">
              <input className="input" placeholder="Nom complet" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="input" type="email" placeholder="Email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <div className="relative">
                <input className="input pr-10" type={showPwd ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le compte'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="glass px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {photographers.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center" style={{ color: 'var(--muted)' }}>
              Aucun photographe. Créez-en un !
            </div>
          )}
          {photographers.map(p => (
            <div key={p._id} className="glass rounded-2xl p-5 flex items-center justify-between card-hover">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{p.email}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Créé le {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  p.isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {p.isActive ? 'Actif' : 'Désactivé'}
                </span>
                <button onClick={() => toggleActive(p._id, p.isActive)}
                  className="hover:text-purple-400 transition-colors" style={{ color: 'var(--muted)' }}>
                  {p.isActive ? <ToggleRight size={24} className="text-purple-400" /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => deleteUser(p._id)}
                  className="hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
