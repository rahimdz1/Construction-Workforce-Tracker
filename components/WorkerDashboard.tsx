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

  // REAL SCANNABLE QR - Full Employee data encoded
  const qrCodeUrl = useMemo(() => {
    const data = JSON.stringify({ id: employee.id, name: employee.name, dept: employee.departmentId, phone: employee.phone });
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=0f172a&margin=2`;
  }, [employee]);

  // Handle Workplace Map initialization
  useEffect(() => {
    if (activeTab === 'map' && employee.workplaceLat && employee.workplaceLng) {
      const L = (window as any).L;
      if (!L) return;
      
      const timer = setTimeout(() => {
        if (mapContainerRef.current) {
          const map = L.map(mapContainerRef.current).setView([employee.workplaceLat, employee.workplaceLng], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.marker([employee.workplaceLat, employee.workplaceLng])
            .addTo(map)
            .bindPopup(`<b>موقع عملك:</b><br>${employee.workplace}`)
            .openPopup();
            
          // Add workplace circle
          L.circle([employee.workplaceLat, employee.workplaceLng], {
             color: '#3b82f6',
             fillColor: '#3b82f6',
             fillOpacity: 0.1,
             radius: 300
          }).addTo(map);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, employee]);

  const handleAttendance = async (photo: string) => {
    if (!isCapturing) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const status = AttendanceStatus.PRESENT;
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employee.id,
        name: employee.name,
        timestamp: new Date().toLocaleTimeString(),
        type: isCapturing,
        photo,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        status,
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
    alert(lang === 'ar' ? 'تم رفع التقرير الميداني بنجاح' : 'Field report uploaded successfully');
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold overflow-hidden shadow-lg">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-md tracking-tight">{companyConfig.name}</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Field Personnel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isHead && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-sm">رئيس قسم</span>}
          <button onClick={onLogout} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><LogOut size={22} /></button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full pb-32">
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-x-10 -translate-y-10" />
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner"><Clock size={48} /></div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">إثبات الحضور</h2>
              <p className="text-slate-400 text-xs font-bold uppercase mb-10 tracking-[0.3em]">{employee.role}</p>
              
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="group bg-emerald-600 text-white py-6 rounded-[2.5rem] font-bold flex flex-col items-center gap-3 shadow-2xl active:scale-95 transition-all"><CheckCircle2 size={32} /> <span className="uppercase tracking-widest">{t.checkIn}</span></button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="group bg-red-600 text-white py-6 rounded-[2.5rem] font-bold flex flex-col items-center gap-3 shadow-2xl active:scale-95 transition-all"><LogOut size={32} /> <span className="uppercase tracking-widest">{t.checkOut}</span></button>
              </div>
            </div>
            
            <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem]"><MapPin size={28} /></div>
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight">التكليف الميداني</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">موقع العمل المخصص</p>
                    <p className="font-bold text-slate-800 leading-snug">{employee.workplace || 'لم يتم تحديد موقع عمل دقيق بعد'}</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">توقيت الوردية</p>
                    <p className="font-bold text-slate-800 leading-snug">{employee.shiftStart} - {employee.shiftEnd}</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12 animate-in zoom-in duration-500">
            {/* 3D Wallet Card - Masterpiece Design */}
            <div className="relative group w-full max-w-sm aspect-[1.6/1] perspective-1000 cursor-pointer">
              <div className="w-full h-full relative transition-transform duration-1000 transform-style-3d group-hover:rotate-y-12 shadow-2xl rounded-[3rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-black rounded-[3rem] p-10 text-white overflow-hidden border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-xl">
                      <ShieldCheck className="text-blue-300" size={36} />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold opacity-40 tracking-[0.4em] uppercase mb-1">Company Access</p>
                      <p className="text-md font-bold tracking-tight uppercase">{companyConfig.name}</p>
                    </div>
                  </div>
                  
                  <div className="mt-10 flex gap-8 items-end relative z-10">
                    <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-white/10 p-1.5 bg-white/5 shadow-2xl backdrop-blur-md">
                      <img src={employee.avatar} className="w-full h-full object-cover rounded-[1.8rem]" alt="Profile" />
                    </div>
                    <div className="pb-4">
                      <h2 className="text-2xl font-bold tracking-tight mb-1">{employee.name}</h2>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">{employee.role}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between items-end relative z-10">
                    <div className="space-y-1">
                      <p className="text-[9px] opacity-30 uppercase font-bold tracking-[0.3em]">Worker ID</p>
                      <p className="text-xs font-mono font-bold tracking-widest text-slate-200">#{employee.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="w-24 h-24 bg-white rounded-[2rem] p-2.5 shadow-2xl flex items-center justify-center border-[6px] border-slate-800 transition-transform group-hover:scale-105">
                      <img src={qrCodeUrl} className="w-full h-full object-contain" alt="QR" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-3">
               <QrCode className="text-blue-600" size={20} />
               <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">هذا الرمز مخصص للمسح الضوئي من قبل الإدارة</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-10 flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] shadow-inner"><FileText size={28} /></div> إرسال تحديث ميداني
            </h2>
            
            <div className="flex gap-3 mb-10 p-2 bg-slate-50 rounded-[2rem] shadow-inner">
              {[
                {id: 'text', icon: FileText, label: 'وصف نصي'},
                {id: 'link', icon: LinkIcon, label: 'رابط خارجي'},
                {id: 'file', icon: Upload, label: 'رفع مرفق'}
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setReportType(opt.id as any)}
                  className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-bold text-xs transition-all ${reportType === opt.id ? 'bg-white shadow-xl text-blue-600 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <opt.icon size={18} /> {opt.label}
                </button>
              ))}
            </div>

            <textarea 
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              className="w-full h-56 bg-slate-50 border-none rounded-[2.5rem] p-8 text-slate-800 focus:ring-2 focus:ring-blue-600 mb-8 outline-none resize-none text-sm shadow-inner transition-all"
              placeholder="صف حالة العمل أو العوائق التي تواجهك بالتفصيل..."
            />
            
            {reportType === 'link' && (
              <div className="mb-8 animate-in slide-in-from-top-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-4 block mb-3">رابط خارجي (Drive, Documents...)</label>
                <input 
                  type="text" 
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 text-xs outline-none shadow-inner font-bold"
                  placeholder="https://example.com/file-link"
                />
              </div>
            )}

            {reportType === 'file' && (
              <div className="mb-8 animate-in slide-in-from-top-4">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center gap-4 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group shadow-inner"
                >
                  <div className="p-4 bg-white rounded-full shadow-md group-hover:scale-110 transition-transform"><Upload size={40} /></div>
                  <span className="font-bold text-xs uppercase tracking-widest">{attachmentName || 'اختر ملفاً من هاتفك أو الحاسوب'}</span>
                </button>
              </div>
            )}

            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-6 rounded-[2.5rem] flex items-center justify-center gap-4 hover:bg-blue-500 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] uppercase tracking-[0.2em]"><Send size={28} /> إرسال للأرشيف</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[70vh] bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
             <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                   <h3 className="font-bold text-slate-800 text-sm tracking-tight uppercase">غرفة تواصل القسم</h3>
                </div>
                <Users size={20} className="text-slate-300" />
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/10">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm shadow-sm transition-all hover:scale-[1.01] ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-200 shadow-lg' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'}`}>
                      <p className="text-[10px] font-bold opacity-60 mb-2 uppercase tracking-widest">{msg.senderName}</p>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-8 border-t bg-white flex gap-4">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm outline-none shadow-inner" placeholder="اكتب رسالة إلى زملائك..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Math.random().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-500 transition-all"><Send size={24} /></button>
             </div>
          </div>
        )}

        {activeTab === 'map' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-800 text-2xl flex items-center gap-4 tracking-tight"><MapIcon className="text-blue-600" size={32} /> توجيهات الوصول</h3>
                    {employee.workplaceLat && <a href={`https://www.google.com/maps/dir/?api=1&destination=${employee.workplaceLat},${employee.workplaceLng}`} target="_blank" className="text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-100 transition-all flex items-center gap-2">خرائط Google <ChevronRight size={14} /></a>}
                 </div>
                 
                 {employee.workplaceLat ? (
                   <>
                     <div ref={mapContainerRef} className="h-[55vh] bg-slate-100 rounded-[3rem] overflow-hidden shadow-inner relative border border-slate-200" />
                     <div className="mt-8 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
                        <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-md shrink-0"><MapPin size={24} /></div>
                        <div>
                          <p className="text-blue-900 font-bold text-sm mb-1 uppercase tracking-widest">توجيه ميداني:</p>
                          <p className="text-blue-800/80 text-[11px] leading-relaxed font-bold">يقع موقعك في {employee.workplace}. يرجى التوجه إلى نقطة GPS المحددة وتسجيل حضورك عند الوصول ضمن دائرة الـ 500 متر.</p>
                        </div>
                     </div>
                   </>
                 ) : (
                   <div className="h-[40vh] flex flex-col items-center justify-center text-slate-300 gap-6 border-2 border-dashed border-slate-100 rounded-[3rem]">
                      <MapPin size={64} className="opacity-20" />
                      <p className="font-bold text-sm uppercase tracking-[0.2em] text-center px-10">لم يتم تحديد إحداثيات GPS دقيقة لموقعك الحالي من قبل الإدارة</p>
                   </div>
                 )}
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-3xl border-t border-slate-200 px-6 py-6 flex justify-around items-center z-40 pb-10 shadow-[0_-15px_40px_rgba(0,0,0,0.06)] rounded-t-[3.5rem]">
        {[
          { id: 'attendance', icon: Clock, label: 'الحضور' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as any)} 
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <item.icon size={28} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-tight uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={handleAttendance} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-12 { transform: rotateY(12deg) rotateX(5deg); }
      `}</style>
    </div>
  );
};

export default WorkerDashboard;
