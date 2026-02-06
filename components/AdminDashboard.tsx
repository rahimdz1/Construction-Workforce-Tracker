
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, Sparkles, RefreshCw, LayoutGrid, 
  Settings as SettingsIcon, AlertTriangle, Loader2, ArrowUpDown, 
  Send, QrCode, Building2, MapPin, Clock, Edit2, Trash2
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, Language, CompanyConfig 
} from '../types';
import { TRANSLATIONS } from '../constants';
import MapView from './MapView';
import QRScanner from './QRScanner';
import { analyzeAttendance } from '../geminiService';

interface AdminDashboardProps {
  logs: LogEntry[];
  reports: ReportEntry[];
  chatMessages: ChatMessage[];
  employees: Employee[];
  departments: Department[];
  companyConfig: CompanyConfig;
  lang: Language;
  onSetLang: (l: Language) => void;
  onSendMessage: (m: ChatMessage) => Promise<void>;
  onLogout: () => void;
  onUpdateEmployees: (e: Employee[]) => Promise<void>;
  onUpdateDepartments: (d: Department[]) => Promise<void>;
  onUpdateAnnouncements: (a: any) => Promise<void>;
  onUpdateFiles: (f: any) => Promise<void>;
  onUpdateCompanyConfig: (c: CompanyConfig) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  logs, reports, chatMessages, employees, departments,
  companyConfig, lang, onLogout, onSendMessage, onUpdateEmployees
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'reports' | 'chat' | 'settings'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [reportFilterDept, setReportFilterDept] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const t = TRANSLATIONS[lang];

  // تصفية وترتيب التقارير
  const sortedReports = useMemo(() => {
    return reports
      .filter(r => reportFilterDept === 'all' || r.departmentId === reportFilterDept)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, reportFilterDept]);

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeAttendance(logs);
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis("فشل تحليل البيانات حالياً.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'ADMIN',
      senderName: 'الإدارة',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
      type: 'group',
      departmentId: 'all'
    };
    await onSendMessage(msg);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar - ثابت وواضح */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-xs uppercase hidden md:block tracking-widest truncate">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'الرئيسية' },
            { id: 'map', icon: MapIcon, label: 'الخريطة الميدانية' },
            { id: 'employees', icon: Users, label: 'إدارة العمال' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <item.icon size={18} /> 
              <span className="text-[10px] font-bold hidden md:block uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
           <button onClick={() => setShowQRScanner(true)} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-white/10 transition-colors mb-2">
             <QrCode size={18} /> <span className="text-[9px] font-bold hidden md:block">مسح هوية QR</span>
           </button>
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 transition-colors">
             <LogOut size={18} /> <span className="text-[9px] font-bold hidden md:block uppercase tracking-widest">خروج</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm uppercase">{activeTab} Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Admin Mode</span>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'إجمالي الكادر', val: employees.length, icon: Users, color: 'blue' },
                    { label: 'حاضرون الآن', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                    { label: 'تنبيهات الموقع', val: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length, icon: AlertTriangle, color: 'red' },
                    { label: 'تقارير اليوم', val: sortedReports.length, icon: FileText, color: 'amber' }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-5 hover:border-blue-400 transition-all">
                      <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center shadow-inner`}><s.icon size={24} /></div>
                      <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</p><p className="text-2xl font-bold text-slate-800">{s.val}</p></div>
                    </div>
                  ))}
               </div>
               
               {/* AI Section */}
               <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Sparkles className="text-amber-400" /> تحليل أداء الكوادر الميدانية</h3>
                    <p className="text-sm opacity-80 max-w-xl">استخدم الذكاء الاصطناعي للحصول على ملخص فوري لسجلات الحضور والغياب والمشاكل الميدانية.</p>
                    <button onClick={handleRunAiAnalysis} className="bg-white text-blue-900 font-bold px-8 py-4 rounded-2xl shadow-xl text-xs flex items-center gap-2 hover:scale-105 transition-all">
                       {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} ابدأ تحليل البيانات
                    </button>
                    {aiAnalysis && <div className="mt-6 p-6 bg-white/10 backdrop-blur-md rounded-2xl text-sm leading-relaxed border border-white/10">{aiAnalysis}</div>}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight flex items-center gap-3"><FileText className="text-amber-600" /> سجل التقارير اليومية</h3>
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border shadow-inner">
                       <button onClick={() => setReportFilterDept('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${reportFilterDept === 'all' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>الكل</button>
                       {departments.map(d => (
                         <button key={d.id} onClick={() => setReportFilterDept(d.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${reportFilterDept === d.id ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>{d.name}</button>
                       ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-inner bg-slate-50/20">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                          <th className="p-6">العامل الميداني</th>
                          <th className="p-6">التاريخ</th>
                          <th className="p-6">القسم</th>
                          <th className="p-6">محتوى التقرير</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedReports.map(report => (
                          <tr key={report.id} className="hover:bg-blue-50/20 transition-all bg-white group">
                            <td className="p-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] group-hover:bg-blue-600 group-hover:text-white">{report.employeeName.charAt(0)}</div>
                                  <span className="font-bold text-slate-800 text-xs">{report.employeeName}</span>
                               </div>
                            </td>
                            <td className="p-6 text-[10px] font-bold text-slate-500">{new Date(report.timestamp).toLocaleDateString()}</td>
                            <td className="p-6">
                               <span className="text-[9px] px-3 py-1 bg-slate-100 rounded-full font-bold text-slate-500 uppercase">
                                  {departments.find(d => d.id === report.departmentId)?.name || 'عام'}
                               </span>
                            </td>
                            <td className="p-6 max-w-[400px]">
                               <p className="text-[11px] text-slate-600 leading-relaxed truncate font-bold">{report.content}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'map' && (
             <div className="h-[75vh] bg-white rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden animate-in zoom-in p-2">
                <MapView logs={logs} />
             </div>
          )}

          {activeTab === 'chat' && (
             <div className="flex flex-col h-[75vh] bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-lg">
                   <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><MessageSquare size={18} className="text-blue-400" /> دردشة الإدارة العامة</h3>
                   <div className="text-[9px] font-bold opacity-50 uppercase tracking-widest">Broadcast Channel</div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                   {chatMessages.map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[75%] p-5 rounded-[2rem] text-[11px] shadow-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-200' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'}`}>
                         <p className="text-[9px] font-bold opacity-60 mb-2 uppercase tracking-widest">{msg.senderName}</p>
                         <p className="leading-relaxed font-bold">{msg.text}</p>
                       </div>
                       <span className="text-[8px] text-slate-400 mt-2 font-bold px-2">{msg.timestamp}</span>
                     </div>
                   ))}
                </div>
                <div className="p-6 border-t bg-white flex gap-4 items-center">
                   <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-xs font-bold outline-none shadow-inner focus:ring-2 focus:ring-blue-500" placeholder="اكتب تعليمات الإدارة..." />
                   <button onClick={handleSendChat} className="p-5 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-all"><Send size={24} /></button>
                </div>
             </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-2xl text-slate-800 tracking-tight flex items-center gap-3"><Users className="text-blue-600" /> إدارة الكوادر الميدانية</h3>
                <button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-700 text-xs flex items-center gap-2">إضافة موظف جديد</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {employees.map(emp => (
                   <div key={emp.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm text-center group relative hover:border-blue-400 transition-all overflow-hidden">
                      <div className="w-24 h-24 rounded-[2rem] overflow-hidden mx-auto mb-6 border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform"><img src={emp.avatar} className="w-full h-full object-cover" /></div>
                      <h4 className="font-bold text-slate-800 text-lg">{emp.name}</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase mb-4">{emp.role}</p>
                      <div className="pt-4 border-t border-slate-50 text-right space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-400 uppercase">الموقع:</span><span className="text-slate-800 truncate max-w-[120px]">{emp.workplace || 'لم يحدد'}</span></div>
                        <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-400 uppercase">الوردية:</span><span className="text-emerald-600">{emp.shiftStart || '08:00'} - {emp.shiftEnd || '16:00'}</span></div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showQRScanner && <QRScanner onScan={(scanned) => {
        const emp = employees.find(e => e.id === scanned);
        if (emp) setSelectedEmployee(emp);
        setShowQRScanner(false);
      }} onClose={() => setShowQRScanner(false)} lang={lang} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-10 space-y-6 animate-in zoom-in">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto border-4 border-slate-50 p-1 shadow-xl bg-white"><img src={selectedEmployee.avatar} className="w-full h-full object-cover rounded-full" /></div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedEmployee.name}</h3>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">{selectedEmployee.role}</p>
              <div className="bg-slate-50 p-6 rounded-3xl space-y-3 text-right">
                <p className="text-xs font-bold text-slate-500">تفاصيل الموقع الميداني:</p>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><MapPin size={14} className="text-red-500" /> {selectedEmployee.workplace || 'غير محدد'}</p>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock size={14} className="text-emerald-500" /> {selectedEmployee.shiftStart} - {selectedEmployee.shiftEnd}</p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl">إغلاق ملف الهوية</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
