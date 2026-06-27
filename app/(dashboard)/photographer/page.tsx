'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, Plus, Trash2, LogOut, Image as ImageIcon, QrCode, Edit2, X, Upload } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useDropzone } from 'react-dropzone';

interface Event {
  _id: string;
  name: string;
  description?: string;
  date: string;
  location?: string;
  numericCode: string;
  qrData: string;
  isActive: boolean;
  createdAt: string;
}

export default function PhotographerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', date: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState<Event | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchEvents();
  }, [status]);

  async function fetchEvents() {
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(data);
  }

  async function fetchPhotos(eventId: string) {
    const res = await fetch(`/api/photos?eventId=${eventId}`);
    const data = await res.json();
    setPhotos(data);
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: '', description: '', date: '', location: '' });
      setShowCreate(false);
      fetchEvents();
    }
    setLoading(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm('Supprimer cet événement et toutes ses photos ?')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (selectedEvent?._id === id) setSelectedEvent(null);
    fetchEvents();
  }

  async function deletePhoto(photoId: string) {
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    if (selectedEvent) fetchPhotos(selectedEvent._id);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDrop: async (files) => {
      if (!selectedEvent) return;
      setUploading(true);
      setUploadProgress(0);

      // Upload in batches of 5
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const fd = new FormData();
        fd.append('eventId', selectedEvent._id);
        batch.forEach(f => fd.append('files', f));
        await fetch('/api/photos', { method: 'POST', body: fd });
        setUploadProgress(Math.round(((i + batch.length) / files.length) * 100));
      }

      setUploading(false);
      fetchPhotos(selectedEvent._id);
    },
  });

  function selectEvent(ev: Event) {
    setSelectedEvent(ev);
    fetchPhotos(ev._id);
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-purple-400 text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="glass px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="text-purple-400" size={24} />
          <span className="font-bold gradient-text">PhotoShare</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1 text-sm hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar - Events */}
        <aside className="w-80 glass border-r flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Mes événements</h2>
              <button onClick={() => setShowCreate(!showCreate)} className="btn-primary p-2 rounded-lg" style={{ padding: '0.4rem' }}>
                <Plus size={16} />
              </button>
            </div>
            {showCreate && (
              <form onSubmit={createEvent} className="space-y-2 fade-in">
                <input className="input text-sm" placeholder="Nom de l'événement" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input className="input text-sm" placeholder="Description (optionnel)"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <input className="input text-sm" type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
                <input className="input text-sm" placeholder="Lieu (optionnel)" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm py-1.5 flex-1" disabled={loading}>
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="glass py-1.5 px-3 rounded-lg text-sm hover:bg-white/10 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {events.map(ev => (
              <div key={ev._id}
                onClick={() => selectEvent(ev)}
                className={`rounded-xl p-3 cursor-pointer transition-colors ${
                  selectedEvent?._id === ev._id
                    ? 'border border-purple-500/50'
                    : 'hover:bg-white/5'
                }`}
                style={{ background: selectedEvent?._id === ev._id ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.03)' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{ev.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {new Date(ev.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                      Code: {ev.numericCode}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); setShowQR(ev); }}
                      className="p-1 hover:text-purple-400 transition-colors" style={{ color: 'var(--muted)' }}>
                      <QrCode size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev._id); }}
                      className="p-1 hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
                Aucun événement.<br />Créez-en un !
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedEvent ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center" style={{ color: 'var(--muted)' }}>
                <Camera size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">Sélectionnez un événement pour gérer ses photos</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedEvent.name}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                    {selectedEvent.location && `${selectedEvent.location} · `}
                    {new Date(selectedEvent.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowQR(selectedEvent)}
                    className="glass flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                    <QrCode size={16} /> QR Code
                  </button>
                  <div className="glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
                    Code: <span className="font-mono text-purple-400">{selectedEvent.numericCode}</span>
                  </div>
                </div>
              </div>

              {/* Upload Zone */}
              <div {...getRootProps()} className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors mb-6 ${
                isDragActive ? 'border-purple-400 bg-purple-400/10' : 'border-white/20 hover:border-purple-400/50'
              }`}>
                <input {...getInputProps()} />
                <Upload size={40} className="mx-auto mb-3 text-purple-400 opacity-70" />
                {isDragActive ? (
                  <p className="text-purple-400 font-medium">Déposez les photos ici...</p>
                ) : (
                  <>
                    <p className="font-medium">Glissez vos photos ici</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                      ou cliquez pour sélectionner — JPG, PNG, WEBP
                    </p>
                  </>
                )}
                {uploading && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #6c63ff, #ff6584)' }} />
                    </div>
                    <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                      Upload en cours... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              {/* Photos Grid */}
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon size={18} className="text-purple-400" />
                <span className="font-semibold">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map(photo => (
                  <div key={photo._id} className="group relative rounded-xl overflow-hidden card-hover"
                    style={{ aspectRatio: '1' }}>
                    <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => deletePhoto(photo._id)} className="btn-danger p-2 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {photo.facesCount > 0 && (
                      <div className="absolute top-2 right-2 bg-purple-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                        {photo.facesCount} visage{photo.facesCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
                {photos.length === 0 && !uploading && (
                  <div className="col-span-4 text-center py-12" style={{ color: 'var(--muted)' }}>
                    Aucune photo. Uploadez des photos ci-dessus.
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowQR(null)}>
          <div className="glass rounded-3xl p-8 max-w-sm w-full mx-4 text-center fade-in"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQR(null)}
              className="absolute top-4 right-4" style={{ color: 'var(--muted)' }}>
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">{showQR.name}</h3>
            <div className="bg-white p-4 rounded-2xl inline-block mb-4">
              <QRCode value={showQR.qrData} size={200} />
            </div>
            <div className="mb-2" style={{ color: 'var(--muted)' }}>ou entrez le code numérique</div>
            <div className="text-4xl font-black font-mono tracking-widest gradient-text mb-4">
              {showQR.numericCode}
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Affichez ce QR code dans la salle pour que vos clients accèdent à leurs photos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
