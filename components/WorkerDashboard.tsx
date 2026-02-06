
import React, { useState } from 'react';
import { LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, ChevronRight, Briefcase, QrCode, Megaphone, Globe, ShieldCheck, MapPin, Link as LinkIcon, Paperclip, Users, Settings } from 'lucide-react';
import { Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, FileEntry, Language, CompanyConfig, Announcement, UserRole } from '../types';
import { WORK_SITE_LOCATION, ALLOWED_RADIUS_METERS, TRANSLATIONS } from '../constants';
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
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat' | 'files' | 'announcements'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [reportType, setReportType] = useState<'text' | 'link' | 'file'>('text');
  const [reportContent, setReportContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  
  const isHead = employee.userRole === UserRole.DEPT_HEAD;
  const t = TRANSLATIONS[lang];

  const handleAttendance = async (photo: string) => {
    if (!isCapturing) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = 0; // Simulated distance for brevity
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

  const handleSendReport = async () => {
    if (!reportContent.trim()) return;
    const report: ReportEntry = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      employeeName: employee.name,
      content: reportContent,
      type: reportType,
      attachmentUrl: attachmentUrl || undefined,
      timestamp: new Date().toLocaleString(),
      departmentId: employee.departmentId
    };
    await onNewReport(report);
    setReportContent('');
    setAttachmentUrl('');
    alert(lang === 'ar' ? 'تم إرسال التقرير بنجاح' : 'Report sent');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-lg">{companyConfig.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          {isHead && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">رئيس قسم</span>}
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><Clock size={40} /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.attendance}</h2>
              <p className="text-slate-500 text-sm mb-6">{employee.name} - {employee.role}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><CheckCircle2 size={24} />{t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><LogOut size={24} />{t.checkOut}</button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> موقع العمل والوردية</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">المنطقة المخصصة</p>
                    <p className="font-bold text-slate-700 text-sm">{employee.workplace || 'لم يحدد بعد'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">توقيت الوردية</p>
                    <p className="font-bold text-slate-700 text-sm">{employee.shiftStart} - {employee.shiftEnd}</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10">
            {/* 3D Wallet Card */}
            <div className="relative group w-full max-w-sm aspect-[1.6/1] perspective-1000">
              <div className="w-full h-full relative transition-transform duration-700 transform-style-3d group-hover:rotate-y-12">
                {/* Front Side */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-2xl overflow-hidden backface-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <ShieldCheck className="text-blue-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold opacity-60 tracking-widest uppercase">Employee Card</p>
                      <p className="text-sm font-bold">{companyConfig.name}</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex gap-5 items-end relative z-10">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 p-1 bg-white/5">
                      <img src={employee.avatar} className="w-full h-full object-cover rounded-xl shadow-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">{employee.name}</h2>
                      <p className="text-xs text-blue-400 font-bold uppercase">{employee.role}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between items-end relative z-10">
                    <div className="space-y-1">
                      <p className="text-[8px] opacity-40 uppercase font-bold tracking-widest">Department</p>
                      <p className="text-[10px] font-bold tracking-wider">{employee.departmentId}</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-lg">
                      <QrCode className="text-slate-900 w-full h-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center animate-bounce mt-4">
              <p className="text-slate-400 text-xs font-bold">يمكن مسح الرمز من قبل الإدارة</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" /> {t.reports}
            </h2>
            
            <div className="flex gap-2 mb-6 p-1 bg-slate-50 rounded-2xl">
              {[
                {id: 'text', icon: FileText, label: 'نص'},
                {id: 'link', icon: LinkIcon, label: 'رابط'},
                {id: 'file', icon: Paperclip, label: 'ملف'}
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setReportType(opt.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${reportType === opt.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                >
                  <opt.icon size={14} /> {opt.label}
                </button>
              ))}
            </div>

            <textarea 
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              className="w-full h-40 bg-slate-50 border-none rounded-2xl p-4 text-slate-800 focus:ring-2 focus:ring-blue-600 mb-4 outline-none resize-none text-sm"
              placeholder="اكتب تفاصيل التقرير هنا..."
            />
            
            {(reportType === 'link' || reportType === 'file') && (
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">{reportType === 'link' ? 'رابط المرفق' : 'رابط الملف المرفوع'}</label>
                <input 
                  type="text" 
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs outline-none"
                  placeholder="https://..."
                />
              </div>
            )}

            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg"><Send size={20} /> إرسال التقرير</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[60vh] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
             <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">دردشة القسم - {employee.departmentId}</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                      {msg.text}
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-4 border-t flex gap-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-sm outline-none" placeholder="اكتب رسالة..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Math.random().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-3 bg-blue-600 text-white rounded-xl"><Send size={18} /></button>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t px-4 py-3 flex justify-around items-center z-40 pb-6 shadow-lg">
        {[
          { id: 'attendance', icon: Clock, label: t.attendance },
          { id: 'chat', icon: MessageSquare, label: t.chat },
          { id: 'reports', icon: FileText, label: t.reports },
          { id: 'id', icon: User, label: t.profile }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400'}`}><item.icon size={22} /><span className="text-[9px] font-bold">{item.label}</span></button>
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
