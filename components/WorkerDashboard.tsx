
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, Briefcase, QrCode, ShieldCheck, MapPin, Link as LinkIcon, Paperclip, Users, Settings, Upload, Map as MapIcon, ChevronRight } from 'lucide-react';
import { Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, FileEntry, Language, CompanyConfig, Announcement, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import CameraView from './CameraView';

interface WorkerDashboardProps {
  employee: Employee;
  chatMessages: ChatMessage[];
  departmentFiles: FileEntry[];
  announcements: Announcement[];
  companyConfig: CompanyConfig;
  lang: Language;
  onSetLang: (l: Language) => void;
  onSendMessage: (m: ChatMessage) => Promise<void>;
  onLogout: () => void;
  onNewLog: (l: LogEntry) => Promise<void>;
  onNewReport: (r: ReportEntry) => Promise<void>;
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  employee, chatMessages, departmentFiles, announcements, companyConfig,
  lang, onSetLang, onSendMessage, onLogout, onNewLog, onNewReport
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat' | 'map'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [reportType, setReportType] = useState<'text' | 'link' | 'file'>('text');
  const [reportContent, setReportContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const isHead = employee.userRole === UserRole.DEPT_HEAD;
  const t = TRANSLATIONS[lang];

  const qrCodeUrl = useMemo(() => {
    const data = JSON.stringify({ id: employee.id, name: employee.name, dept: employee.departmentId });
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=0f172a&margin=1`;
  }, [employee]);

  useEffect(() => {
    if (activeTab === 'map' && employee.workplaceLat && employee.workplaceLng) {
      const L = (window as any).L;
      if (!L) return;
      
      const timer = setTimeout(() => {
        if (mapContainerRef.current) {
          const map = L.map(mapContainerRef.current).setView([employee.workplaceLat, employee.workplaceLng], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.marker([employee.workplaceLat, employee.workplaceLng]).addTo(map).bindPopup(employee.workplace).openPopup();
          L.circle([employee.workplaceLat, employee.workplaceLng], { color: '#3b82f6', radius: 300 }).addTo(map);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, employee]);

  const handleAttendance = async (photo: string) => {
    if (!isCapturing) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employee.id,
        name: employee.name,
        timestamp: new Date().toLocaleTimeString(),
        type: isCapturing,
        photo,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        status: AttendanceStatus.PRESENT,
        departmentId: employee.departmentId
      };
      await onNewLog(newLog);
      setIsCapturing(null);
      setShowCamera(false);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
        setAttachmentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReport = async () => {
    if (!reportContent.trim() && !attachmentUrl) return;
    const report: ReportEntry = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      employeeName: employee.name,
      content: reportContent,
      type: reportType,
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      timestamp: new Date().toISOString(),
      departmentId: employee.departmentId
    };
    await onNewReport(report);
    setReportContent('');
    setAttachmentUrl('');
    setAttachmentName('');
    alert('تم إرسال التقرير بنجاح');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-sm md:text-md">{companyConfig.name}</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full pb-32 overflow-x-hidden">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600"><Clock size={40} /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-8">{t.attendance}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-5 rounded-3xl font-bold flex flex-col items-center gap-2 shadow-lg"><CheckCircle2 size={24} /> {t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-5 rounded-3xl font-bold flex flex-col items-center gap-2 shadow-lg"><LogOut size={24} /> {t.checkOut}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 animate-in zoom-in">
            {/* Improved 3D Wallet Card */}
            <div className="relative group w-full max-w-[340px] aspect-[1.6/1] perspective-1000">
              <div className="w-full h-full relative transition-transform duration-700 transform-style-3d group-hover:rotate-y-12">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-2xl overflow-hidden border border-white/10 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
                  
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><ShieldCheck className="text-blue-300" size={24} /></div>
                    <div className="text-right">
                      <p className="text-[7px] font-bold opacity-50 uppercase tracking-widest">Employee Identity</p>
                      <p className="text-[10px] font-bold truncate max-w-[120px]">{companyConfig.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0">
                      <img src={employee.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <h2 className="text-sm font-bold truncate">{employee.name}</h2>
                      <p className="text-[9px] text-blue-400 font-bold uppercase">{employee.role}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[7px] opacity-40 uppercase font-bold">Dept</p>
                      <p className="text-[9px] font-bold">{employee.departmentId}</p>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-xl p-1 shadow-lg shrink-0 overflow-hidden">
                      <img src={qrCodeUrl} className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مسح الرمز ضوئياً من قبل الإدارة</p>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapIcon size={18} className="text-blue-600" /> موقع عملك المخصص</h3>
              <div ref={mapContainerRef} className="w-full h-[300px] bg-slate-100 rounded-2xl overflow-hidden border" />
              <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                 <p className="text-xs font-bold text-blue-700">{employee.workplace || 'لم يتم تحديد موقع مخصص'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> إرسال تقرير</h2>
            <div className="flex gap-2 mb-6 p-1 bg-slate-50 rounded-2xl">
              {['text', 'link', 'file'].map(type => (
                <button key={type} onClick={() => setReportType(type as any)} className={`flex-1 py-3 rounded-xl font-bold text-xs capitalize ${reportType === type ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                  {type === 'text' ? 'نص' : type === 'link' ? 'رابط' : 'ملف'}
                </button>
              ))}
            </div>
            <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full h-40 bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600 mb-4 outline-none resize-none shadow-inner" placeholder="اكتب التفاصيل هنا..." />
            {reportType === 'file' && (
              <div className="mb-4">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-100 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-2 text-slate-500">
                  <Upload size={24} /> <span className="text-[10px] font-bold">{attachmentName || 'اختر ملفاً من جهازك'}</span>
                </button>
              </div>
            )}
            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"><Send size={18} /> إرسال التقرير</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[60vh] bg-white rounded-[2rem] border shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-slate-800 text-xs">تواصل مع قسمك</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      <p className="text-[8px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                      {msg.text}
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-4 border-t flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-xs outline-none" placeholder="رسالة..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><Send size={16} /></button>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t px-2 py-3 flex justify-around items-center z-40 pb-6 shadow-lg rounded-t-3xl">
        {[
          { id: 'attendance', icon: Clock, label: 'الحضور' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
            <item.icon size={22} /><span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={handleAttendance} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-12 { transform: rotateY(12deg) rotateX(5deg); }
      `}</style>
    </div>
  );
};

export default WorkerDashboard;
