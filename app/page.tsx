'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Camera, QrCode, Scan, Shield, Zap, Users } from 'lucide-react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="text-purple-400" size={28} />
          <span className="text-xl font-bold gradient-text">PhotoShare</span>
        </div>
        <div className="flex gap-3">
          {session ? (
            <Link
              href={(session.user as any).role === 'admin' ? '/admin' : '/photographer'}
              className="btn-primary"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/event" className="input" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                Voir mes photos
              </Link>
              <Link href="/login" className="btn-primary">
                Connexion
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-32 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6c63ff, transparent)' }} />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ff6584, transparent)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto fade-in">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm mb-8"
            style={{ color: 'var(--accent)' }}>
            <Zap size={14} />
            Reconnaissance faciale automatique
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Vos photos,{' '}
            <span className="gradient-text">instantanément</span>
            <br />retrouvées
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            Scannez le QR code de votre événement, laissez la caméra vous reconnaître
            et découvrez toutes vos photos automatiquement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/event" className="btn-primary text-lg px-8 py-4">
              Accéder à mes photos
            </Link>
            <Link href="/login"
              className="glass px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Espace photographe
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Comment ça marche ?</h2>
        <p className="text-center mb-16" style={{ color: 'var(--muted)' }}>
          Simple, rapide et magique
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <QrCode size={40} className="text-purple-400" />,
              title: 'Scannez le QR code',
              desc: "Le photographe affiche le QR code ou le code à 6 chiffres dans la salle. Scannez-le ou entrez-le pour accéder à l'événement.",
            },
            {
              icon: <Scan size={40} className="text-pink-400" />,
              title: 'Reconnaissance faciale',
              desc: 'Notre technologie analyse votre visage via votre caméra et retrouve automatiquement toutes les photos où vous apparaissez.',
            },
            {
              icon: <Camera size={40} className="text-yellow-400" />,
              title: 'Vos photos uniquement',
              desc: 'Téléchargez et partagez vos moments en quelques secondes. Uniquement les photos où vous figurez.',
            },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-8 card-hover text-center">
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p style={{ color: 'var(--muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { val: '100%', label: 'Privé & Sécurisé', icon: <Shield size={24} className="text-green-400 mx-auto mb-2" /> },
              { val: '< 2s', label: 'Reconnaissance', icon: <Zap size={24} className="text-yellow-400 mx-auto mb-2" /> },
              { val: '∞', label: 'Photos par événement', icon: <Camera size={24} className="text-purple-400 mx-auto mb-2" /> },
            ].map((s, i) => (
              <div key={i}>
                {s.icon}
                <div className="text-4xl font-black gradient-text mb-1">{s.val}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Photographers */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="glass rounded-3xl p-12 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-purple-400 mb-4">
              <Users size={20} />
              <span className="font-semibold">Pour les photographes</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Gérez vos événements<br />
              <span className="gradient-text">sans effort</span>
            </h2>
            <ul className="space-y-3" style={{ color: 'var(--muted)' }}>
              {[
                'Créez des événements en quelques clics',
                'Uploadez des centaines de photos facilement',
                'QR code et code numérique générés automatiquement',
                'Vos clients retrouvent leurs photos instantanément',
                'Interface d\'administration complète',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn-primary mt-8 inline-block">
              Créer mon compte →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['Mariage', 'Anniversaire', 'Conférence', 'Sport'].map((cat, i) => (
              <div key={i} className="rounded-2xl p-6 text-center card-hover"
                style={{ background: 'var(--surface2)' }}>
                <Camera size={32} className="mx-auto mb-2 text-purple-400" />
                <div className="font-semibold">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Camera size={18} className="text-purple-400" />
          <span className="font-bold text-white">PhotoShare</span>
        </div>
        <p className="text-sm">© 2024 PhotoShare. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
