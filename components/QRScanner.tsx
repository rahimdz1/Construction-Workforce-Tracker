import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { X, Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (id: string) => void;
  onClose: () => void;
  lang: 'ar' | 'en';
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          tick();
        }
      } catch (err) {
        console.error("QR Scanner Error:", err);
        alert(lang === 'ar' ? "فشل الوصول إلى الكاميرا" : "Camera access failed");
        onClose();
      }
    };

    const tick = () => {
      if (!isScanning) return;

      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext("2d");
          if (context) {
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            // استخدام jsQR مباشرة من الحزمة المثبتة
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code) {
              onScan(code.data);
              setIsScanning(false);
              return;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startScanner();

    return () => {
      setIsScanning(false);
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, lang, onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm aspect-square border-4 border-blue-500 rounded-[3rem] overflow-hidden shadow-2xl">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_blue] animate-[scan_2s_infinite]" />
      </div>
      
      <div className="mt-10 text-center space-y-4">
        <p className="text-white font-bold animate-pulse">
          {lang === 'ar' ? 'ضع رمز QR داخل المربع للمسح' : 'Place QR code inside the box to scan'}
        </p>
        <button onClick={onClose} className="px-10 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
