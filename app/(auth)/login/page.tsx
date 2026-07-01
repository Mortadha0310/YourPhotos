'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Camera, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
    } else {
      const meRes = await fetch('/api/auth/session');
      const session = await meRes.json();
      router.push(session?.user?.role === 'admin' ? '/admin' : '/photographer');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-64 sm:w-80 h-64 sm:h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6c63ff, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md">
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #9b5de5)' }}>
              <Camera size={28} className="text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Connexion</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Espace photographe & admin</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(255,100,100,0.15)', color: '#ff6584', border: '1px solid rgba(255,100,100,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input className="input pl-9 text-base" type="email" placeholder="votre@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input className="input pl-9 pr-10 text-base" type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2 text-base" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:text-white transition-colors">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
