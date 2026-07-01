'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Camera, Plus, Trash2, LogOut, Image as ImageIcon,
  QrCode, X, Upload, Cpu, CheckCircle, ChevronLeft, Menu,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useDropzone } from 'react-dropzone';

interface Event {
  _id: string; name: string; description?: string;
  date: string; location?: string; numericCode: string;
  qrData: string; isActive: boolean; createdAt: string;
}
interface Photo {
  _id: string; url: string; filename: string;
  faceDescriptors: number[][]; facesCount: number;
}
type ProcessStatus = 'idle' | 'loading-models' | 'processing' | 'done';

export default function PhotographerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', date: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState<Event | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [processProgress, setProcessProgress] = useState({ done: 0, total: 0, current: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const faceApiRef = useRef<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchEvents();
  }, [status]);

  async function getFaceApi() {
    if (faceApiRef.current) return faceApiRef.current;
    const faceapi = await import('face-api.js');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);
    faceApiRef.current = faceapi;
    return faceapi;
  }

  async function fetchEvents() {
    const res = await fetch('/api/events');
    setEvents(await res.json());
  }

  async function fetchPhotos(eventId: string) {
    const res = await fetch(`/api/photos?eventId=${eventId}`);
    setPhotos(await res.json());
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ name: '', description: '', date: '', location: '' }); setShowCreate(false); fetchEvents(); }
    setLoading(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm('Supprimer cet événement et toutes ses photos ?')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (selectedEvent?._id === id) { setSelectedEvent(null); setPhotos([]); }
    fetchEvents();
  }

  async function deletePhoto(photoId: string) {
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    if (selectedEvent) fetchPhotos(selectedEvent._id);
  }

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async function processAllFaces() {
    if (!selectedEvent || photos.length === 0) return;
    setProcessStatus('loading-models');
    setProcessProgress({ done: 0, total: photos.length, current: 'Chargement IA...' });
    let faceapi: any;
    try { faceapi = await getFaceApi(); } catch {
      setProcessStatus('idle');
      alert('Erreur lors du chargement des modèles.');
      return;
    }
    setProcessStatus('processing');
    let done = 0;
    for (const photo of photos) {
      setProcessProgress({ done, total: photos.length, current: photo.filename || `Photo ${done + 1}` });
      try {
        const img = await loadImage(photo.url);
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
          .withFaceLandmarks().withFaceDescriptors();
        const descriptors = detections.map((d: any) => Array.from(d.descriptor));
        await fetch(`/api/photos/${photo._id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faceDescriptors: descriptors, facesCount: detections.length }),
        });
      } catch (err) { console.error('Error processing:', err); }
      done++;
      setProcessProgress({ done, total: photos.length, current: '' });
    }
    setProcessStatus('done');
    fetchPhotos(selectedEvent._id);
    setTimeout(() => setProcessStatus('idle'), 3000);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDrop: async (files) => {
      if (!selectedEvent) return;
      setUploading(true); setUploadProgress(0);
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
    setProcessStatus('idle');
    setSidebarOpen(false);
  }

  const processedCount = photos.filter(p => p.facesCount > 0 || p.faceDescriptors?.length > 0).length;
  const unprocessedCount = photos.filter(p => !p.faceDescriptors || p.faceDescriptors.length === 0).length;

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile: back button when event selected */}
          {selectedEvent && (
            <button className="sm:hidden p-1" onClick={() => { setSelectedEvent(null); setPhotos([]); }}
              style={{ color: 'var(--muted)' }}>
              <ChevronLeft size={20} />
            </button>
          )}
          <Camera className="text-purple-400" size={22} />
          <span className="font-bold gradient-text text-sm sm:text-base">
            {selectedEvent ? selectedEvent.name : 'PhotoShare'}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile: hamburger to open event list */}
          {!selectedEvent && (
            <button className="sm:hidden p-1.5 glass rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ color: 'var(--text)' }}>
              <Menu size={18} />
            </button>
          )}
          {selectedEvent && (
            <button className="sm:hidden glass flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              onClick={() => setShowQR(selectedEvent)}>
              <QrCode size={14} /> QR
            </button>
          )}
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop always visible, mobile overlay */}
        <aside className={`
          fixed inset-0 z-40 sm:relative sm:z-auto sm:flex
          flex-col w-full sm:w-72 md:w-80 glass border-r
          transition-transform duration-300
          ${sidebarOpen || !selectedEvent ? 'flex' : 'hidden sm:flex'}
          ${sidebarOpen ? 'translate-x-0' : ''}
        `} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Mobile overlay close */}
          {sidebarOpen && (
            <div className="sm:hidden absolute inset-0 bg-black/60 z-[-1]"
              onClick={() => setSidebarOpen(false)} />
          )}

          <div className="w-full sm:w-72 md:w-80 flex flex-col h-full sm:h-auto"
            style={{ background: 'var(--surface)', maxHeight: '100vh' }}>
            <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-sm sm:text-base">Mes événements</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary rounded-lg flex items-center gap-1 text-xs py-1.5 px-3">
                    <Plus size={14} /> Nouveau
                  </button>
                  {sidebarOpen && (
                    <button className="sm:hidden p-1.5 glass rounded-lg" onClick={() => setSidebarOpen(false)}
                      style={{ color: 'var(--muted)' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {showCreate && (
                <form onSubmit={createEvent} className="space-y-2 fade-in">
                  <input className="input text-sm" placeholder="Nom de l'événement *" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="input text-sm" placeholder="Description"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  <input className="input text-sm" type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} required />
                  <input className="input text-sm" placeholder="Lieu"
                    value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm py-2 flex-1" disabled={loading}>
                      {loading ? '...' : 'Créer'}
                    </button>
                    <button type="button" onClick={() => setShowCreate(false)}
                      className="glass py-2 px-3 rounded-lg text-sm hover:bg-white/10">
                      <X size={14} />
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {events.map(ev => (
                <div key={ev._id} onClick={() => selectEvent(ev)}
                  className={`rounded-xl p-3 cursor-pointer transition-colors ${
                    selectedEvent?._id === ev._id ? 'border border-purple-500/50' : 'hover:bg-white/5'
                  }`}
                  style={{ background: selectedEvent?._id === ev._id ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold text-sm truncate">{ev.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {new Date(ev.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                        {ev.numericCode}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); setShowQR(ev); }}
                        className="p-1.5 hover:text-purple-400 transition-colors" style={{ color: 'var(--muted)' }}>
                        <QrCode size={14} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteEvent(ev._id); }}
                        className="p-1.5 hover:text-red-400 transition-colors" style={{ color: 'var(--muted)' }}>
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
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${!selectedEvent && !sidebarOpen ? 'hidden sm:block' : ''} ${!selectedEvent ? 'sm:block' : ''}`}>
          {!selectedEvent ? (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <div className="text-center" style={{ color: 'var(--muted)' }}>
                <Camera size={56} className="mx-auto mb-4 opacity-30" />
                <p>Sélectionnez un événement</p>
                <button className="mt-4 sm:hidden btn-primary text-sm py-2 px-4"
                  onClick={() => setSidebarOpen(true)}>
                  Voir mes événements
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Event header */}
              <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">{selectedEvent.name}</h2>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>
                    {selectedEvent.location && `${selectedEvent.location} · `}
                    {new Date(selectedEvent.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <button onClick={() => setShowQR(selectedEvent)}
                    className="glass flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium">
                    <QrCode size={14} /> QR Code
                  </button>
                  <div className="glass flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium">
                    Code : <span className="font-mono text-purple-400">{selectedEvent.numericCode}</span>
                  </div>
                </div>
              </div>

              {/* Upload zone */}
              <div {...getRootProps()} className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-colors mb-4 ${
                isDragActive ? 'border-purple-400 bg-purple-400/10' : 'border-white/20 hover:border-purple-400/50'
              }`}>
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto mb-3 text-purple-400 opacity-70" />
                {isDragActive ? (
                  <p className="text-purple-400 font-medium text-sm">Déposez ici...</p>
                ) : (
                  <>
                    <p className="font-medium text-sm sm:text-base">Glissez vos photos ou appuyez pour choisir</p>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>JPG, PNG, WEBP</p>
                  </>
                )}
                {uploading && (
                  <div className="mt-4">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #6c63ff, #ff6584)' }} />
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Upload {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Face processing */}
              {photos.length > 0 && (
                <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Cpu size={18} className="text-purple-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">Traitement des visages</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {processStatus === 'idle' && `${processedCount}/${photos.length} indexées`}
                        {processStatus === 'loading-models' && 'Chargement des modèles IA...'}
                        {processStatus === 'processing' && `${processProgress.done}/${processProgress.total} traitées`}
                        {processStatus === 'done' && '✓ Indexation terminée !'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {processStatus === 'processing' && (
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(processProgress.done / processProgress.total) * 100}%`, background: 'linear-gradient(90deg, #6c63ff, #ff6584)' }} />
                      </div>
                    )}
                    {processStatus === 'done' && <CheckCircle size={16} className="text-green-400" />}
                    {(processStatus === 'idle' || processStatus === 'done') && unprocessedCount > 0 && (
                      <button onClick={processAllFaces}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Cpu size={13} /> Analyser
                      </button>
                    )}
                    {(processStatus === 'loading-models' || processStatus === 'processing') && (
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              )}

              {/* Photos grid */}
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-purple-400" />
                <span className="font-semibold text-sm">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
                {processedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(108,99,255,0.2)', color: 'var(--accent)' }}>
                    {processedCount} indexées
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {photos.map(photo => (
                  <div key={photo._id} className="group relative rounded-xl overflow-hidden card-hover"
                    style={{ aspectRatio: '1' }}>
                    <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover"
                      crossOrigin="anonymous" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => deletePhoto(photo._id)} className="btn-danger p-1.5 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {photo.facesCount > 0 && (
                      <div className="absolute top-1 right-1 text-white text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(108,99,255,0.85)', fontSize: '10px' }}>
                        {photo.facesCount}
                      </div>
                    )}
                  </div>
                ))}
                {photos.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-sm" style={{ color: 'var(--muted)' }}>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4"
          onClick={() => setShowQR(null)}>
          <div className="glass rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-sm text-center fade-in pb-8 sm:pb-8"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
            <button onClick={() => setShowQR(null)} className="absolute top-4 right-4" style={{ color: 'var(--muted)' }}>
              <X size={20} />
            </button>
            <h3 className="text-lg sm:text-xl font-bold mb-5">{showQR.name}</h3>
            <div className="bg-white p-4 rounded-2xl inline-block mb-4">
              <QRCode value={showQR.qrData} size={180} />
            </div>
            <div className="text-sm mb-2" style={{ color: 'var(--muted)' }}>ou code numérique</div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest gradient-text mb-3">
              {showQR.numericCode}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Affichez ce QR code dans la salle
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
