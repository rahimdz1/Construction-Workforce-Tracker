import React, { useState } from 'react';
import { LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, ChevronRight, Briefcase, QrCode, Megaphone, Globe, ShieldCheck } from 'lucide-react';
// Added missing Announcement type to the import list below.
import { Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, FileEntry, Language, CompanyConfig, Announcement } from '../types';
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
  const [reportText, setReportText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const t = TRANSLATIONS[lang];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAttendance = async (photo: string) => {
    if (!isCapturing) return;
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, WORK_SITE_LOCATION.lat, WORK_SITE_LOCATION.lng);
      const status = dist <= ALLOWED_RADIUS_METERS ? AttendanceStatus.PRESENT : AttendanceStatus.OUT_OF_BOUNDS;

      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employee.id,
        name: employee.name,
        timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US'),
        type: isCapturing,
        photo,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        status,
        departmentId: employee.departmentId
      };

      await onNewLog(newLog);
      setIsCapturing(null);
      setShowCamera(false);
    }, () => {
      alert(lang === 'ar' ? 'يرجى تفعيل الموقع الجغرافي' : 'Please enable GPS');
    });
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: employee.id,
      senderName: employee.name,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
      type: 'group',
      departmentId: employee.departmentId
    };
    await onSendMessage(msg);
    setChatInput('');
  };

  const handleSendReport = async () => {
    if (!reportText.trim()) return;
    const report: ReportEntry = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      employeeName: employee.name,
      content: reportText,
      timestamp: new Date().toLocaleString(),
      departmentId: employee.departmentId
    };
    await onNewReport(report);
    setReportText('');
    alert(lang === 'ar' ? 'تم إرسال التقرير بنجاح' : 'Report sent successfully');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-lg hidden sm:block">{companyConfig.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onSetLang(lang === 'ar' ? 'en' : 'ar')} className="text-slate-500 hover:text-blue-600 transition-colors">
            <Globe size={20} />
          </button>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Clock size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.attendance}</h2>
              <p className="text-slate-500 text-sm mb-6">{employee.name} - {employee.role}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setIsCapturing('IN'); setShowCamera(true); }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-2 transition-all active:scale-95 shadow-md"
                >
                  <CheckCircle2 size={24} />
                  {t.checkIn}
                </button>
                <button 
                  onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }}
                  className="bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-2 transition-all active:scale-95 shadow-md"
                >
                  <LogOut size={24} />
                  {t.checkOut}
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-600" />
                {t.shift}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-bold text-xs">{t.shiftStart}</span>
                  <span className="font-bold text-slate-800 text-sm">{employee.shiftStart || '08:00'}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-bold text-xs">{t.shiftEnd}</span>
                  <span className="font-bold text-slate-800 text-sm">{employee.shiftEnd || '16:00'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl text-center animate-in zoom-in duration-300">
            <div className="w-32 h-32 mx-auto mb-6 rounded-3xl overflow-hidden border-4 border-blue-100 p-1">
              <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover rounded-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{employee.name}</h2>
            <p className="text-blue-600 font-bold text-sm mb-8 uppercase tracking-widest">{employee.role}</p>
            
            <div className="bg-slate-50 p-6 rounded-3xl inline-block shadow-inner mb-8">
              <div className="bg-white p-2 rounded-2xl shadow-sm">
                <QrCode size={180} className="text-slate-800" />
              </div>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">ID: {employee.id}</p>
            </div>

            <div className="grid grid-cols-1 text-right gap-4 max-w-xs mx-auto">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <ShieldCheck size={20} className="text-emerald-500" />
                <span className="text-xs font-bold text-slate-600">{t.verified}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Globe size={20} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">{employee.phone}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              {t.reports}
            </h2>
            <textarea 
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full h-48 bg-slate-50 border-none rounded-2xl p-4 text-slate-800 focus:ring-2 focus:ring-blue-600 mb-4 outline-none resize-none text-sm"
              placeholder={lang === 'ar' ? 'اكتب ملاحظاتك الميدانية أو التقرير اليومي هنا...' : 'Write field notes or daily report here...'}
            />
            <button 
              onClick={handleSendReport}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-lg"
            >
              <Send size={20} />
              {lang === 'ar' ? 'إرسال التقرير' : 'Send Report'}
            </button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[60vh] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">{t.chat} - {employee.departmentId}</h3>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.filter(m => m.departmentId === employee.departmentId || m.departmentId === 'all').map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                    <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1">{msg.timestamp}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
              />
              <button onClick={handleSendChat} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:scale-90 transition-all">
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Briefcase size={24} className="text-blue-600" />
              {t.departments}
            </h2>
            {departmentFiles.filter(f => f.departmentId === employee.departmentId || f.departmentId === 'all').map(file => (
              <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{file.name}</h4>
                    <p className="text-[10px] text-slate-400">{file.uploadDate}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </a>
            ))}
            {departmentFiles.length === 0 && <p className="text-center text-slate-400 text-sm py-12">لا توجد ملفات أو مخططات متاحة لقسمك حالياً</p>}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Megaphone size={24} className="text-blue-600" />
              {t.announcements}
            </h2>
            {announcements.filter(a => a.targetDeptId === 'all' || a.targetDeptId === employee.departmentId).map(ann => (
              <div key={ann.id} className="bg-white p-6 rounded-3xl border-l-4 border-l-blue-600 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-sm">{ann.title}</h3>
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500">{ann.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t px-4 py-3 flex justify-around items-center z-40 pb-6 shadow-lg">
        {[
          { id: 'attendance', icon: Clock, label: t.attendance },
          { id: 'chat', icon: MessageSquare, label: t.chat },
          { id: 'reports', icon: FileText, label: t.reports },
          { id: 'files', icon: Briefcase, label: t.departments },
          { id: 'announcements', icon: Megaphone, label: t.announcements },
          { id: 'id', icon: User, label: t.profile }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400'}`}
          >
            <item.icon size={22} />
            <span className="text-[9px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && (
        <CameraView onCapture={handleAttendance} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />
      )}
    </div>
  );
};

export default WorkerDashboard;
