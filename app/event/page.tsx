'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Hash } from 'lucide-react';
import Link from 'next/link';

export default function EventEntryPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = code.trim();
    if (!trimmed) return;
    // Validate event exists
    const res = await fetch(`/api/events/${trimmed}`);
    if (!res.ok) { setError('Code invalide. Vérifiez le code affiché dans la salle.'); return; }
    router.push(`/event/${trimmed}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff6584, transparent)' }} />
      </div>
      <div className="relative w-full max-w-md fade-in">
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #ff6584, #ffc47e)' }}>
              <Hash size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Accéder à mes photos</h1>
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
              className="input text-center text-3xl font-mono tracking-widest h-16"
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
            />
            <button type="submit" className="btn-primary w-full py-3 text-lg">
              Accéder à l'événement →
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:text-white transition-colors">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
