
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

  const t = TRANSLATIONS[lang];

  // REAL SCANNABLE QR
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
          L.marker([employee.workplaceLat, employee.workplaceLng]).addTo(map).bindPopup(employee.workplace || "موقع العمل").openPopup();
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
          <h1 className="font-bold text-slate-800 text-sm md:text-md truncate max-w-[150px]">{companyConfig.name}</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full pb-32">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Attendance Buttons */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600"><Clock size={32} /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-6">{t.attendance}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><CheckCircle2 size={24} /> {t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><LogOut size={24} /> {t.checkOut}</button>
              </div>
            </div>

            {/* Workplace Info Card - Highlighted Location & Shift */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-4">
               <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><MapPin size={20} /></div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">معلومات الموقع والوردية</h3>
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">موقع العمل المخصص:</span>
                     <span className="text-xs font-bold text-blue-700">{employee.workplace || 'لم يتم التحديد'}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 flex flex-col gap-1">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">بداية الوردية:</span>
                       <span className="text-sm font-bold text-slate-800">{employee.shiftStart || '--:--'}</span>
                    </div>
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 flex flex-col gap-1">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">نهاية الوردية:</span>
                       <span className="text-sm font-bold text-slate-800">{employee.shiftEnd || '--:--'}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 animate-in zoom-in">
            {/* Card Holder Component */}
            <div className="relative w-full max-w-[340px] aspect-[1.6/1] perspective-1000 shadow-2xl rounded-[2rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-[2rem] p-6 text-white border border-white/10 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
                  
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shrink-0">
                      <ShieldCheck className="text-blue-300" size={24} />
                    </div>
                    <div className="text-right overflow-hidden">
                      <p className="text-[7px] font-bold opacity-50 uppercase tracking-widest">Employee Card</p>
                      <p className="text-[9px] font-bold truncate">{companyConfig.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shrink-0 bg-white/5">
                      <img src={employee.avatar} className="w-full h-full object-cover" alt="avatar" />
                    </div>
                    <div className="overflow-hidden">
                      <h2 className="text-sm font-bold truncate text-white leading-none mb-1">{employee.name}</h2>
                      <p className="text-[9px] text-blue-400 font-bold uppercase">{employee.role}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[7px] opacity-40 uppercase font-bold">Dept ID</p>
                      <p className="text-[9px] font-bold">{employee.departmentId}</p>
                    </div>
                    <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-lg shrink-0 overflow-hidden">
                      <img src={qrCodeUrl} className="w-full h-full object-contain" alt="QR" />
                    </div>
                  </div>
                </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مسح الهوية ضوئياً للمشرفين</p>
          </div>
        )}

        {/* Rest of the components remain as they were for Map, Reports, and Chat */}
        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3"><FileText size={20} className="text-blue-600" /> إرسال تقرير ميداني</h2>
            <div className="flex gap-2 mb-6 p-1.5 bg-slate-50 rounded-2xl">
              {['text', 'link', 'file'].map(type => (
                <button key={type} onClick={() => setReportType(type as any)} className={`flex-1 py-3 rounded-xl font-bold text-xs capitalize ${reportType === type ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>
                  {type === 'text' ? 'نص' : type === 'link' ? 'رابط' : 'ملف'}
                </button>
              ))}
            </div>
            <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full h-40 bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600 mb-4 outline-none resize-none shadow-inner" placeholder="اكتب تفاصيل التقرير هنا..." />
            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-blue-700 transition-all font-bold"><Send size={20} /> إرسال التقرير</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[60vh] bg-white rounded-[2rem] border shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-widest">دردشة القسم</h3>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      <p className="text-[8px] font-bold opacity-60 mb-1">{msg.senderName}</p>
                      {msg.text}
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-4 border-t flex gap-2 bg-white">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-xs outline-none" placeholder="اكتب رسالتك..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><Send size={18} /></button>
             </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapIcon size={18} className="text-blue-600" /> خريطة الموقع</h3>
              <div ref={mapContainerRef} className="w-full h-[300px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200" />
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t px-3 py-3 flex justify-around items-center z-40 pb-6 shadow-lg rounded-t-[2.5rem]">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} /><span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={handleAttendance} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
    </div>
  );
};

export default WorkerDashboard;
