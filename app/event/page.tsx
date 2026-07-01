'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Camera, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function EventEntryPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true); setError('');
    const res = await fetch(`/api/events/${trimmed}`);
    if (!res.ok) {
      setError('Code invalide. Vérifiez le code affiché dans la salle.');
      setLoading(false);
    } else {
      router.push(`/event/${trimmed}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-64 sm:w-96 h-64 sm:h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff6584, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Camera className="text-purple-400" size={24} />
            <span className="font-bold gradient-text text-lg">PhotoShare</span>
          </div>
        </div>

        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #ff6584, #ffc47e)' }}>
              <Hash size={28} className="text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Accéder à mes photos</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Entrez le code affiché dans la salle ou scannez le QR code
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(255,100,100,0.15)', color: '#ff6584', border: '1px solid rgba(255,100,100,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="input text-center font-mono tracking-widest"
              style={{ fontSize: '2rem', height: '4rem', letterSpacing: '0.25em' }}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
            <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={loading || code.length !== 6}>
              {loading ? 'Vérification...' : 'Accéder à mes photos →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-center gap-2 text-sm mb-1" style={{ color: 'var(--muted)' }}>
              <QrCode size={15} />
              <span>Vous pouvez aussi scanner le QR code directement</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              avec l'appareil photo de votre téléphone
            </p>
          </div>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:text-white transition-colors">← Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}
