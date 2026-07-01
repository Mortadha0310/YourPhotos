'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Scan, Download, X, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Photo {
  _id: string; url: string; faceDescriptors: number[][];
  facesCount: number; filename: string;
}
interface EventData {
  _id: string; name: string; date: string;
  location?: string; photographer: { name: string };
}
type Step = 'loading-event' | 'camera' | 'scanning' | 'results' | 'all-photos' | 'error';

export default function EventClientPage({ params }: { params: { code: string } }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<any>(null);

  const [step, setStep] = useState<Step>('loading-event');
  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetch(`/api/events/${params.code}`)
      .then(r => r.json())
      .then(async data => {
        if (data.error) { setErrorMsg(data.error); setStep('error'); return; }
        setEvent(data);
        const pr = await fetch(`/api/photos?eventId=${data._id}`);
        setPhotos(await pr.json());
        setStep('camera');
        loadModels();
      })
      .catch(() => { setErrorMsg("Impossible de charger l'événement"); setStep('error'); });
  }, [params.code]);

  async function loadModels() {
    try {
      setScanProgress('Chargement des modèles IA...');
      const faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      faceApiRef.current = faceapi;
      setModelsLoaded(true);
      setScanProgress('');
    } catch (e) {
      console.error('Model load error:', e);
      setScanProgress('Erreur — rechargez la page');
    }
  }

  // Identical to working version — no await play()
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setErrorMsg("Impossible d'accéder à la caméra. Autorisez l'accès dans votre navigateur.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (step === 'camera') startCamera();
    return () => { if (step !== 'scanning') stopCamera(); };
  }, [step]);

  // Identical detection + matching logic as working version
  async function captureAndMatch() {
    if (!videoRef.current || !canvasRef.current || !faceApiRef.current) return;
    const faceapi = faceApiRef.current;

    setStep('scanning');
    setScanProgress('Capture du visage...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    stopCamera();

    setScanProgress('Détection du visage...');
    let detection;
    try {
      detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (e) { console.error('Detection error:', e); }

    if (!detection) {
      setErrorMsg('Aucun visage détecté. Placez-vous face à la caméra dans un endroit bien éclairé.');
      setStep('camera');
      return;
    }

    const clientDescriptor = detection.descriptor;
    const indexed = photos.filter(p => p.faceDescriptors && p.faceDescriptors.length > 0);
    setScanProgress(`Comparaison avec ${indexed.length} photos indexées...`);

    const THRESHOLD = 0.55;
    const matched: Photo[] = [];
    for (const photo of indexed) {
      for (const desc of photo.faceDescriptors) {
        if (faceapi.euclideanDistance(clientDescriptor, new Float32Array(desc)) < THRESHOLD) {
          matched.push(photo); break;
        }
      }
    }
    setMatchedPhotos(matched);
    setScanProgress('');
    setStep('results');
  }

  function downloadPhoto(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'photo.jpg'; a.target = '_blank'; a.click();
  }

  // ─── Loading ────────────────────────────────────────────────────
  if (step === 'loading-event') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Chargement...</p>
      </div>
    </div>
  );

  // ─── Error ──────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center">
        <AlertCircle size={44} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-lg sm:text-xl font-bold mb-2">Événement introuvable</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>{errorMsg}</p>
        <Link href="/event" className="btn-primary text-sm">Réessayer</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-shrink-0">
        <Link href="/event" className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
          style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={17} /><span className="text-sm">Retour</span>
        </Link>
        {event && (
          <div className="text-center flex-1 px-3">
            <div className="font-bold text-sm sm:text-base truncate">{event.name}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>par {event.photographer?.name}</div>
          </div>
        )}
        <div className="text-xs sm:text-sm font-mono flex-shrink-0" style={{ color: 'var(--accent)' }}>
          {photos.length} 📷
        </div>
      </header>

      {/* ─── Camera ─────────────────────────────────────────────── */}
      {(step === 'camera' || step === 'scanning') && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Reconnaissance faciale</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Placez votre visage au centre et appuyez sur le bouton
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl text-sm text-center"
                style={{ background: 'rgba(255,100,100,0.15)', color: '#ff6584', border: '1px solid rgba(255,100,100,0.3)' }}>
                {errorMsg}
              </div>
            )}

            {/* Camera view */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden glass mb-5"
              style={{ aspectRatio: '4/3', maxHeight: '55vh' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Oval face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-dashed rounded-full transition-colors"
                  style={{
                    width: 'min(46%, 180px)',
                    height: 'min(60%, 220px)',
                    borderColor: step === 'scanning' ? '#6c63ff' : 'rgba(255,255,255,0.45)',
                  }} />
              </div>

              {/* Scanning overlay */}
              {step === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <div className="text-center px-4">
                    <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white font-medium text-sm">{scanProgress}</p>
                  </div>
                </div>
              )}

              {/* Models loading indicator */}
              {step === 'camera' && !modelsLoaded && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center">
                  <div className="glass px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    {scanProgress || 'Chargement IA...'}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setErrorMsg(''); captureAndMatch(); }}
                disabled={!modelsLoaded || step === 'scanning'}
                className="btn-primary flex-1 py-4 text-base flex items-center justify-center gap-2"
              >
                <Scan size={20} />
                {!modelsLoaded ? 'Chargement IA...' : 'Me reconnaître'}
              </button>
              <button
                onClick={() => { setErrorMsg(''); setStep('all-photos'); }}
                className="glass px-4 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Voir tout
              </button>
            </div>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
              🔒 Analyse locale — aucune donnée envoyée
            </p>
          </div>
        </div>
      )}

      {/* ─── Results ────────────────────────────────────────────── */}
      {step === 'results' && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <CheckCircle size={20} className="text-green-400" />
                <h2 className="text-xl sm:text-2xl font-bold">Vos photos</h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {matchedPhotos.length} photo{matchedPhotos.length !== 1 ? 's' : ''} trouvée{matchedPhotos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setErrorMsg(''); setMatchedPhotos([]); setStep('camera'); }}
                className="glass flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-xs sm:text-sm">
                <RefreshCw size={14} /> Réessayer
              </button>
              <button onClick={() => setStep('all-photos')}
                className="glass flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-xs sm:text-sm">
                Toutes les photos
              </button>
            </div>
          </div>

          {matchedPhotos.length === 0 ? (
            <div className="glass rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center">
              <Camera size={52} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Aucune correspondance</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Votre visage n'a pas été reconnu. Essayez dans un endroit bien éclairé, face à la caméra.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => { setErrorMsg(''); setStep('camera'); }} className="btn-primary text-sm">
                  Réessayer
                </button>
                <button onClick={() => setStep('all-photos')}
                  className="glass px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm">
                  Voir toutes les photos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {matchedPhotos.map(photo => (
                <div key={photo._id}
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden card-hover cursor-pointer"
                  style={{ aspectRatio: '1' }}
                  onClick={() => setSelectedPhoto(photo)}>
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={e => { e.stopPropagation(); downloadPhoto(photo.url, photo.filename); }}
                      className="glass p-2 rounded-lg hover:bg-white/20">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── All photos ─────────────────────────────────────────── */}
      {step === 'all-photos' && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Toutes les photos</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{photos.length} photos</p>
            </div>
            <button onClick={() => { setErrorMsg(''); setStep('camera'); }}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
              <Scan size={15} /> Mes photos
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(photo => (
              <div key={photo._id}
                className="group relative rounded-xl sm:rounded-2xl overflow-hidden card-hover cursor-pointer"
                style={{ aspectRatio: '1' }}
                onClick={() => setSelectedPhoto(photo)}>
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={e => { e.stopPropagation(); downloadPhoto(photo.url, photo.filename); }}
                    className="glass p-2 rounded-lg hover:bg-white/20">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Lightbox ───────────────────────────────────────────── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setSelectedPhoto(null)}>
          <div className="flex justify-between items-center p-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} style={{ color: 'var(--muted)' }}>
              <X size={24} />
            </button>
            <button onClick={() => downloadPhoto(selectedPhoto.url, selectedPhoto.filename)}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
              <Download size={15} /> Télécharger
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
