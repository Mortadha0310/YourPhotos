'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Scan, Download, X, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Photo {
  _id: string;
  url: string;
  faceDescriptors: number[][];
  facesCount: number;
  filename: string;
}

interface EventData {
  _id: string;
  name: string;
  date: string;
  location?: string;
  photographer: { name: string };
}

type Step = 'loading-event' | 'camera' | 'scanning' | 'results' | 'all-photos' | 'error';

export default function EventClientPage({ params }: { params: { code: string } }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>('loading-event');
  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Load event data
  useEffect(() => {
    fetch(`/api/events/${params.code}`)
      .then(r => r.json())
      .then(async data => {
        if (data.error) { setErrorMsg(data.error); setStep('error'); return; }
        setEvent(data);
        const photosRes = await fetch(`/api/photos?eventId=${data._id}`);
        const photosData = await photosRes.json();
        setPhotos(photosData);
        setStep('camera');
        loadFaceApi();
      })
      .catch(() => { setErrorMsg('Impossible de charger l\'événement'); setStep('error'); });
  }, [params.code]);

  async function loadFaceApi() {
    if (typeof window === 'undefined') return;
    // @ts-ignore
    const faceapi = await import('face-api.js');
    const MODEL_URL = '/models';
    setScanProgress('Chargement des modèles de reconnaissance...');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    setFaceApiLoaded(true);
    setScanProgress('');
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setErrorMsg('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    if (step === 'camera') startCamera();
    return () => { if (step !== 'scanning') stopCamera(); };
  }, [step]);

  async function captureAndMatch() {
    if (!videoRef.current || !canvasRef.current || !faceApiLoaded) return;
    setStep('scanning');
    setScanProgress('Capture de votre visage...');

    // @ts-ignore
    const faceapi = await import('face-api.js');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    stopCamera();

    setScanProgress('Détection de votre visage...');
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      setErrorMsg('Aucun visage détecté. Réessayez en vous plaçant face à la caméra.');
      setStep('camera');
      startCamera();
      return;
    }

    const clientDescriptor = detection.descriptor;
    setScanProgress(`Analyse de ${photos.length} photos...`);

    const THRESHOLD = 0.5;
    const matched: Photo[] = [];

    for (const photo of photos) {
      if (!photo.faceDescriptors || photo.faceDescriptors.length === 0) continue;
      for (const desc of photo.faceDescriptors) {
        const dist = faceapi.euclideanDistance(clientDescriptor, new Float32Array(desc));
        if (dist < THRESHOLD) { matched.push(photo); break; }
      }
    }

    setMatchedPhotos(matched);
    setScanProgress('');
    setStep('results');
  }

  function downloadPhoto(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
  }

  // Step: Loading event
  if (step === 'loading-event') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: 'var(--muted)' }}>Chargement de l'événement...</p>
      </div>
    </div>
  );

  // Step: Error
  if (step === 'error') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Événement introuvable</h2>
        <p className="mb-6" style={{ color: 'var(--muted)' }}>{errorMsg}</p>
        <Link href="/event" className="btn-primary">
          Réessayer avec un autre code
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass px-6 py-4 flex justify-between items-center">
        <Link href="/event" className="flex items-center gap-2 hover:text-purple-400 transition-colors"
          style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </Link>
        {event && (
          <div className="text-center">
            <div className="font-bold">{event.name}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              par {event.photographer?.name}
            </div>
          </div>
        )}
        <div className="text-sm font-mono" style={{ color: 'var(--accent)' }}>
          {photos.length} photos
        </div>
      </header>

      {/* Camera Step */}
      {(step === 'camera' || step === 'scanning') && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4">
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Reconnaissance faciale</h2>
              <p style={{ color: 'var(--muted)' }}>
                Placez votre visage au centre de la caméra et appuyez sur le bouton
              </p>
            </div>

            <div className="relative rounded-3xl overflow-hidden glass mb-6"
              style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 rounded-full border-4 opacity-60"
                  style={{ borderColor: step === 'scanning' ? '#6c63ff' : 'rgba(255,255,255,0.5)',
                    boxShadow: step === 'scanning' ? '0 0 30px rgba(108,99,255,0.5)' : 'none' }} />
              </div>
              {step === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white font-medium">{scanProgress}</p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl text-sm text-center"
                style={{ background: 'rgba(255,100,100,0.15)', color: '#ff6584', border: '1px solid rgba(255,100,100,0.3)' }}>
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={captureAndMatch}
                disabled={!faceApiLoaded || step === 'scanning'}
                className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2">
                <Scan size={20} />
                {!faceApiLoaded ? 'Chargement...' : 'Me reconnaître'}
              </button>
              <button onClick={() => setStep('all-photos')}
                className="glass px-4 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm">
                Voir tout
              </button>
            </div>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
              🔒 Votre visage est analysé localement, aucune donnée n'est envoyée
            </p>
          </div>
        </div>
      )}

      {/* Results Step */}
      {step === 'results' && (
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={24} className="text-green-400" />
                <h2 className="text-2xl font-bold">Vos photos</h2>
              </div>
              <p style={{ color: 'var(--muted)' }}>
                {matchedPhotos.length} photo{matchedPhotos.length !== 1 ? 's' : ''} trouvée{matchedPhotos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStep('camera'); setMatchedPhotos([]); setErrorMsg(''); }}
                className="glass flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm">
                <RefreshCw size={16} /> Réessayer
              </button>
              <button onClick={() => setStep('all-photos')}
                className="glass flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm">
                Voir toutes les photos
              </button>
            </div>
          </div>

          {matchedPhotos.length === 0 ? (
            <div className="glass rounded-3xl p-16 text-center">
              <Camera size={64} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">Aucune correspondance</h3>
              <p className="mb-6" style={{ color: 'var(--muted)' }}>
                Aucune photo avec votre visage n'a été trouvée dans cet événement.
              </p>
              <button onClick={() => { setStep('camera'); startCamera(); }}
                className="btn-primary">
                Réessayer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {matchedPhotos.map(photo => (
                <div key={photo._id} className="group relative rounded-2xl overflow-hidden card-hover cursor-pointer"
                  style={{ aspectRatio: '1' }}
                  onClick={() => setSelectedPhoto(photo)}>
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.url, photo.filename || 'photo.jpg'); }}
                      className="glass p-2 rounded-lg hover:bg-white/20">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Photos Step */}
      {step === 'all-photos' && (
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Toutes les photos</h2>
              <p style={{ color: 'var(--muted)' }}>{photos.length} photos</p>
            </div>
            <button onClick={() => { setStep('camera'); setErrorMsg(''); }}
              className="btn-primary flex items-center gap-2">
              <Scan size={16} /> Trouver mes photos
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo._id} className="group relative rounded-2xl overflow-hidden card-hover cursor-pointer"
                style={{ aspectRatio: '1' }}
                onClick={() => setSelectedPhoto(photo)}>
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.url, photo.filename || 'photo.jpg'); }}
                    className="glass p-2 rounded-lg hover:bg-white/20">
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 p-2" style={{ color: 'var(--muted)' }}
            onClick={() => setSelectedPhoto(null)}>
            <X size={28} />
          </button>
          <img src={selectedPhoto.url} alt="" className="max-w-full max-h-full rounded-2xl object-contain p-4"
            onClick={e => e.stopPropagation()} />
          <button
            onClick={(e) => { e.stopPropagation(); downloadPhoto(selectedPhoto.url, selectedPhoto.filename || 'photo.jpg'); }}
            className="absolute bottom-6 btn-primary flex items-center gap-2 px-6 py-3">
            <Download size={18} /> Télécharger
          </button>
        </div>
      )}
    </div>
  );
}
