
import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, Check, AlertCircle, X } from 'lucide-react';

interface CameraViewProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'user',
              width: { ideal: 1024 },
              height: { ideal: 1024 }
            }, 
            audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        let msg = "فشل تشغيل الكاميرا. يرجى التأكد من إعطاء الإذن.";
        if (err.name === 'NotAllowedError') msg = "تم رفض إذن الكاميرا. يرجى تفعيله من إعدادات المتصفح.";
        if (err.name === 'NotFoundError') msg = "لم يتم العثور على كاميرا في هذا الجهاز.";
        setError(msg);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 text-white text-center">
         <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 max-w-sm w-full space-y-6">
            <AlertCircle size={64} className="mx-auto text-red-400" />
            <p className="font-bold text-sm leading-relaxed">{error}</p>
            <button onClick={onCancel} className="w-full bg-blue-600 py-4 rounded-2xl font-bold">إغلاق</button>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6 z-[60]">
         <button onClick={onCancel} className="p-3 bg-white/10 rounded-full text-white"><X /></button>
      </div>

      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-slate-700 shadow-2xl">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none">
               <div className="w-full h-full border-2 border-white/20 rounded-[2rem]" />
            </div>
          </>
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover" 
          />
        )}
      </div>

      <div className="mt-12 flex gap-6">
        {!capturedImage ? (
          <button 
            onClick={takePhoto}
            className="p-8 rounded-full bg-white text-blue-600 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-90"
          >
            <Camera size={40} />
          </button>
        ) : (
          <>
            <button 
              onClick={() => setCapturedImage(null)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95 transition-all"
            >
              <RefreshCw size={20} />
              إعادة
            </button>
            <button 
              onClick={confirmPhoto}
              className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-xl hover:bg-emerald-500 active:scale-95 transition-all"
            >
              <Check size={20} />
              تأكيد
            </button>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
