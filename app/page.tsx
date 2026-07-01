'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Camera, QrCode, Scan, Shield, Zap, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera className="text-purple-400" size={26} />
            <span className="text-lg sm:text-xl font-bold gradient-text">PhotoShare</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex gap-3 items-center">
            {session ? (
              <Link href={(session.user as any).role === 'admin' ? '/admin' : '/photographer'}
                className="btn-primary text-sm">Dashboard</Link>
            ) : (
              <>
                <Link href="/event"
                  className="text-sm px-4 py-2 rounded-xl border transition-colors hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text)' }}>
                  Voir mes photos
                </Link>
                <Link href="/login" className="btn-primary text-sm">Connexion</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="sm:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--text)' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden mt-3 pb-3 border-t flex flex-col gap-2 pt-3"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {session ? (
              <Link href={(session.user as any).role === 'admin' ? '/admin' : '/photographer'}
                className="btn-primary text-sm text-center" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/event" onClick={() => setMenuOpen(false)}
                  className="text-sm px-4 py-3 rounded-xl text-center border"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text)' }}>
                  Voir mes photos
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="btn-primary text-sm text-center py-3">
                  Connexion
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-28 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6c63ff, transparent)' }} />
          <div className="absolute bottom-10 right-1/4 w-48 sm:w-80 h-48 sm:h-80 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ff6584, transparent)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto fade-in">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs sm:text-sm mb-6 sm:mb-8"
            style={{ color: 'var(--accent)' }}>
            <Zap size={13} /> Reconnaissance faciale automatique
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 leading-tight">
            Vos photos,{' '}
            <span className="gradient-text">instantanément</span>
            <br className="hidden sm:block" /> retrouvées
          </h1>
          <p className="text-base sm:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto px-2"
            style={{ color: 'var(--muted)' }}>
            Scannez le QR code de votre événement, laissez la caméra vous reconnaître
            et découvrez toutes vos photos automatiquement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link href="/event" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto justify-center">
              Accéder à mes photos
            </Link>
            <Link href="/login"
              className="glass px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors text-base sm:text-lg w-full sm:w-auto text-center">
              Espace photographe
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Comment ça marche ?</h2>
        <p className="text-center mb-10 sm:mb-16 text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
          Simple, rapide et magique
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
          {[
            {
              icon: <QrCode size={36} className="text-purple-400" />,
              title: 'Scannez le QR code',
              desc: "Le photographe affiche le QR code ou le code à 6 chiffres dans la salle. Scannez-le ou entrez-le pour accéder à l'événement.",
            },
            {
              icon: <Scan size={36} className="text-pink-400" />,
              title: 'Reconnaissance faciale',
              desc: 'Notre technologie analyse votre visage via la caméra et retrouve automatiquement toutes les photos où vous apparaissez.',
            },
            {
              icon: <Camera size={36} className="text-yellow-400" />,
              title: 'Vos photos uniquement',
              desc: 'Téléchargez et partagez vos moments en quelques secondes. Uniquement les photos où vous figurez.',
            },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 sm:p-8 card-hover text-center">
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto glass rounded-2xl sm:rounded-3xl p-6 sm:p-12">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { val: '100%', label: 'Privé & Sécurisé', icon: <Shield size={20} className="text-green-400 mx-auto mb-2" /> },
              { val: '< 2s', label: 'Reconnaissance', icon: <Zap size={20} className="text-yellow-400 mx-auto mb-2" /> },
              { val: '∞', label: 'Photos / événement', icon: <Camera size={20} className="text-purple-400 mx-auto mb-2" /> },
            ].map((s, i) => (
              <div key={i}>
                {s.icon}
                <div className="text-2xl sm:text-4xl font-black gradient-text mb-1">{s.val}</div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Photographers */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-purple-400 mb-4 text-sm">
              <Users size={18} /><span className="font-semibold">Pour les photographes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Gérez vos événements<br />
              <span className="gradient-text">sans effort</span>
            </h2>
            <ul className="space-y-3 text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
              {[
                'Créez des événements en quelques clics',
                'Uploadez des centaines de photos facilement',
                'QR code et code numérique générés automatiquement',
                'Vos clients retrouvent leurs photos instantanément',
                "Interface d'administration complète",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn-primary mt-6 sm:mt-8 inline-flex text-sm sm:text-base">
              Créer mon compte →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {['Mariage', 'Anniversaire', 'Conférence', 'Sport'].map((cat, i) => (
              <div key={i} className="rounded-2xl p-4 sm:p-6 text-center card-hover"
                style={{ background: 'var(--surface2)' }}>
                <Camera size={28} className="mx-auto mb-2 text-purple-400" />
                <div className="font-semibold text-sm sm:text-base">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 sm:px-6 py-6 sm:py-8 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Camera size={16} className="text-purple-400" />
          <span className="font-bold text-white text-sm">PhotoShare</span>
        </div>
        <p className="text-xs sm:text-sm">© 2024 PhotoShare. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
