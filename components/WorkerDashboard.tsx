import React, { useState, useRef } from 'react';
import { LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, Briefcase, QrCode, ShieldCheck, MapPin, Link as LinkIcon, Paperclip, Users, Settings, Upload, Map as MapIcon } from 'lucide-react';
import { Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, FileEntry, Language, CompanyConfig, Announcement, UserRole } from '../types';
import { WORK_SITE_LOCATION, TRANSLATIONS } from '../constants';
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

  const isHead = employee.userRole === UserRole.DEPT_HEAD;
  const t = TRANSLATIONS[lang];

  // REAL QR Generator using public API for world-class reliability
  const qrData = { id: employee.id, name: employee.name, phone: employee.phone, dept: employee.departmentId };
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrData))}`;

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
      timestamp: new Date().toLocaleString(),
      departmentId: employee.departmentId
    };
    await onNewReport(report);
    setReportContent('');
    setAttachmentUrl('');
    setAttachmentName('');
    alert(lang === 'ar' ? 'تم إرسال التقرير مع المرفقات' : 'Report sent with attachments');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-md">{companyConfig.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isHead && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold shadow-sm">رئيس قسم</span>}
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner"><Clock size={48} /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.attendance} الميداني</h2>
              <p className="text-slate-400 text-xs font-bold uppercase mb-8 tracking-widest">{employee.role}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-5 rounded-[2rem] font-bold flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all"><CheckCircle2 size={28} /> {t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-5 rounded-[2rem] font-bold flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all"><LogOut size={28} /> {t.checkOut}</button>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><MapPin size={24} /></div>
                  <h3 className="font-bold text-slate-800">بيانات الموقع والوردية</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">المنطقة المخصصة</p>
                    <p className="font-bold text-slate-800">{employee.workplace || 'لم يتم تعيين موقع محدد'}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">توقيت الوردية</p>
                    <p className="font-bold text-slate-800">{employee.shiftStart} - {employee.shiftEnd}</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 animate-in zoom-in">
            {/* 3D Wallet Card */}
            <div className="relative group w-full max-w-sm aspect-[1.6/1] perspective-1000">
              <div className="w-full h-full relative transition-transform duration-700 transform-style-3d group-hover:rotate-y-12">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[2.5rem] p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                      <ShieldCheck className="text-blue-400" size={32} />
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold opacity-60 tracking-[0.3em] uppercase mb-1">Access Card</p>
                      <p className="text-sm font-bold tracking-tight">{companyConfig.name}</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex gap-6 items-end relative z-10">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white/10 p-1 bg-white/5 shadow-2xl">
                      <img src={employee.avatar} className="w-full h-full object-cover rounded-[1.7rem]" />
                    </div>
                    <div className="pb-2">
                      <h2 className="text-2xl font-bold tracking-tight mb-1">{employee.name}</h2>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{employee.role}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between items-end relative z-10">
                    <div className="space-y-1">
                      <p className="text-[8px] opacity-40 uppercase font-bold tracking-[0.2em]">Department ID</p>
                      <p className="text-xs font-bold tracking-widest">{employee.departmentId}</p>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-[1.5rem] p-2 shadow-2xl flex items-center justify-center border-4 border-slate-100">
                      <img src={qrCodeUrl} className="w-full h-full object-contain" alt="QR" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-bold animate-pulse">يحتوي الرمز على بياناتك الرسمية للمسح الضوئي</div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={24} /></div> إرسال تقرير ميداني
            </h2>
            
            <div className="flex gap-2 mb-8 p-1.5 bg-slate-50 rounded-2xl">
              {[
                {id: 'text', icon: FileText, label: 'نص'},
                {id: 'link', icon: LinkIcon, label: 'رابط خارجي'},
                {id: 'file', icon: Upload, label: 'رفع ملف'}
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setReportType(opt.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-xs transition-all ${reportType === opt.id ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <opt.icon size={16} /> {opt.label}
                </button>
              ))}
            </div>

            <textarea 
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              className="w-full h-48 bg-slate-50 border-none rounded-[2rem] p-6 text-slate-800 focus:ring-2 focus:ring-blue-600 mb-6 outline-none resize-none text-sm shadow-inner"
              placeholder="صف حالة العمل أو المشكلة بالتفصيل..."
            />
            
            {reportType === 'link' && (
              <div className="mb-6 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 block mb-2">رابط المرفق (Google Drive, DropBox...)</label>
                <input 
                  type="text" 
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs outline-none shadow-inner"
                  placeholder="https://..."
                />
              </div>
            )}

            {reportType === 'file' && (
              <div className="mb-6 animate-in slide-in-from-top-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                >
                  <Upload size={32} />
                  <span className="font-bold text-xs">{attachmentName || 'اختر ملفاً من جهازك (صورة، PDF، مستند)'}</span>
                </button>
              </div>
            )}

            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-2xl"><Send size={24} /> إرسال التقرير للإدارة</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
             <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> غرفة دردشة القسم</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      <p className="text-[9px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                      {msg.text}
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-6 border-t flex gap-3 bg-white">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-6 text-sm outline-none shadow-inner" placeholder="اكتب رسالتك هنا..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Math.random().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl"><Send size={20} /></button>
             </div>
          </div>
        )}

        {activeTab === 'map' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3"><MapIcon className="text-blue-600" /> توجيهات الموقع الميداني</h3>
                 <div className="h-[50vh] bg-slate-100 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center text-slate-400 flex-col gap-4">
                    <MapPin size={48} className="animate-bounce" />
                    <p className="font-bold text-xs">جاري تحميل خريطة الوصول للموقع...</p>
                 </div>
                 <div className="mt-6 p-6 bg-blue-50 rounded-[2rem] text-blue-800">
                    <p className="text-xs font-bold mb-1">تعليمات إضافية:</p>
                    <p className="text-[11px] leading-relaxed">يرجى التأكد من ارتداء معدات السلامة الكاملة عند الوصول للموقع {employee.workplace || 'المخصص'}. سجل حضورك فور وصولك لنقطة التفتيش.</p>
                 </div>
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-2xl border-t px-4 py-4 flex justify-around items-center z-40 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[
          { id: 'attendance', icon: Clock, label: 'الحضور' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-500'}`}><item.icon size={24} /><span className="text-[9px] font-bold tracking-tight">{item.label}</span></button>
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
