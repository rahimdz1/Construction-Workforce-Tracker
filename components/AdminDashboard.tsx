
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, Search, 
  MessageSquare, Plus, Globe, Clock, ShieldCheck, 
  UserCheck, Sparkles, RefreshCw, LayoutGrid, MapPin,
  Settings as SettingsIcon, AlertTriangle, Loader2, X, Trash2, Edit2, Palette, Building2, QrCode, Check, Send, Paperclip, Link as LinkIcon, Info, Calendar, Filter, ArrowUpDown
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, FileEntry, Announcement, Language, CompanyConfig, UserRole
} from '../types';
import { TRANSLATIONS } from '../constants';
import MapView from './MapView';
import QRScanner from './QRScanner';
import { analyzeAttendance } from '../geminiService';

interface AdminDashboardProps {
  logs: LogEntry[];
  reports: ReportEntry[];
  chatMessages: ChatMessage[];
  departmentFiles: FileEntry[];
  employees: Employee[];
  departments: Department[];
  announcements: Announcement[];
  companyConfig: CompanyConfig;
  lang: Language;
  onSetLang: (l: Language) => void;
  onSendMessage: (m: ChatMessage) => Promise<void>;
  onLogout: () => void;
  onUpdateEmployees: (e: Employee[]) => Promise<void>;
  onUpdateDepartments: (d: Department[]) => Promise<void>;
  onUpdateAnnouncements: (a: Announcement[]) => Promise<void>;
  onUpdateFiles: (f: FileEntry[]) => Promise<void>;
  onUpdateCompanyConfig: (c: CompanyConfig) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  logs, reports, chatMessages, employees, departments,
  companyConfig, lang, onSetLang, onLogout, onUpdateEmployees,
  onUpdateDepartments, onUpdateCompanyConfig, onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'reports' | 'chat' | 'settings'>('overview');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [chatTarget, setChatTarget] = useState<{type: 'all' | 'dept' | 'user', id?: string}>({type: 'all'});
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilterDept, setReportFilterDept] = useState<string>('all');

  // Modals
  const [showEmployeeEditModal, setShowEmployeeEditModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({ name: '', phone: '', role: '', departmentId: '' });

  const t = TRANSLATIONS[lang];

  // Logic: Filter and sort reports (Table Mode)
  const sortedReports = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return reports
      .filter(r => {
        const isCorrectDept = reportFilterDept === 'all' || r.departmentId === reportFilterDept;
        const reportDate = new Date(r.timestamp);
        return isCorrectDept && reportDate > oneMonthAgo;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, reportFilterDept]);

  const handleQRScan = (scannedData: string) => {
    try {
      const data = JSON.parse(scannedData);
      const emp = employees.find(e => e.id === data.id);
      if (emp) { setSelectedEmployee(emp); setShowQRScanner(false); }
    } catch {
      const emp = employees.find(e => e.id === scannedData);
      if (emp) { setSelectedEmployee(emp); setShowQRScanner(false); }
    }
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeAttendance(logs);
      setAiAnalysis(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiAnalysis("حدث خطأ أثناء تحليل البيانات.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      const updated = employees.map(emp => emp.id === editingEmp.id ? editingEmp : emp);
      await onUpdateEmployees(updated);
      setShowEmployeeEditModal(false);
    } else {
      const emp: Employee = {
        id: 'emp_' + Math.random().toString(36).substr(2, 9),
        name: newEmployeeForm.name,
        phone: newEmployeeForm.phone,
        role: newEmployeeForm.role,
        departmentId: newEmployeeForm.departmentId || departments[0]?.id,
        userRole: UserRole.WORKER,
        avatar: `https://picsum.photos/seed/${newEmployeeForm.name}/150/150`,
        isShiftRequired: true,
        shiftStart: '08:00',
        shiftEnd: '16:00',
        password: '123'
      };
      await onUpdateEmployees([...employees, emp]);
      setShowAddEmployeeModal(false);
      setNewEmployeeForm({ name: '', phone: '', role: '', departmentId: '' });
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'ADMIN',
      senderName: 'الإدارة',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
      type: chatTarget.type === 'all' ? 'group' : 'multi',
      departmentId: chatTarget.type === 'dept' ? chatTarget.id : 'all'
    };
    await onSendMessage(msg);
    setChatInput('');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar - Enhanced Professional Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-[60]">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-xs uppercase hidden md:block tracking-widest">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'الرئيسية' },
            { id: 'map', icon: MapIcon, label: 'الخريطة الميدانية' },
            { id: 'employees', icon: Users, label: 'إدارة العمال' },
            { id: 'reports', icon: FileText, label: 'التقارير الميدانية' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة الجماعية' },
            { id: 'settings', icon: SettingsIcon, label: 'إعدادات النظام' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 shadow-xl text-white' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={18} /> <span className="text-[10px] font-bold hidden md:block uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5 space-y-2">
           <button onClick={() => setShowQRScanner(true)} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-white/10 transition-colors"><QrCode size={18} /> <span className="text-[9px] font-bold hidden md:block uppercase tracking-widest">مسح هويـة</span></button>
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 transition-colors"><LogOut size={18} /> <span className="text-[9px] font-bold hidden md:block uppercase tracking-widest">تسجيل الخروج</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-tight">{activeTab} Dashboard</h2>
          <div className="hidden md:flex items-center bg-slate-50 border rounded-xl px-4 py-2 gap-3">
            <Search size={14} className="text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-xs w-48 font-bold text-slate-700" placeholder="بحث سريع في النظام..." />
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'إجمالي الكادر', val: employees.length, icon: Users, color: 'blue' },
                    { label: 'حضور اليوم', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                    { label: 'خارج الموقع', val: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length, icon: AlertTriangle, color: 'red' },
                    { label: 'تقارير نشطة', val: sortedReports.length, icon: FileText, color: 'amber' }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-5 hover:border-blue-300 transition-all group">
                      <div className={`w-14 h-14 bg-${s.color}-50 text-${s.color}-600 rounded-[1.2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}><s.icon size={28} /></div>
                      <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</p><p className="text-2xl font-bold text-slate-800">{s.val}</p></div>
                    </div>
                  ))}
               </div>
               
               <div className="bg-gradient-to-br from-indigo-700 to-blue-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-10 translate-x-10 blur-3xl" />
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3"><Sparkles className="text-amber-400" size={32} /> التحليلات الذكية (Gemini AI)</h3>
                    <p className="text-sm opacity-90 max-w-2xl leading-relaxed">احصل على رؤية ثاقبة لأداء عمالك اليوم من خلال تحليل البيانات التاريخية وسلوك الحضور الميداني.</p>
                    <button onClick={handleRunAiAnalysis} className="bg-white text-blue-900 font-bold px-10 py-4 rounded-[1.2rem] shadow-xl text-xs hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-3">
                       {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                       تحليل البيانات الميدانية
                    </button>
                    {aiAnalysis && (
                       <div className="mt-8 p-8 bg-black/20 backdrop-blur-md rounded-[2rem] text-sm leading-relaxed border border-white/10 animate-in slide-in-from-top-4">
                          <p className="font-bold text-xs uppercase text-blue-300 mb-2 border-b border-white/10 pb-2">نتائج التحليل التلقائي:</p>
                          {aiAnalysis}
                       </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                       <div className="p-4 bg-amber-50 text-amber-600 rounded-[1.5rem] shadow-inner"><FileText size={28} /></div>
                       <div><h3 className="font-bold text-slate-800 text-xl tracking-tight">الأرشيف الميداني للتقارير</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Field Operation Audit Logs</p></div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border w-full md:w-auto overflow-x-auto scrollbar-hide shadow-inner">
                       <button onClick={() => setReportFilterDept('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${reportFilterDept === 'all' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>الكل</button>
                       {departments.map(d => (
                         <button key={d.id} onClick={() => setReportFilterDept(d.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap transition-all ${reportFilterDept === d.id ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>{d.name}</button>
                       ))}
                    </div>
                  </div>

                  {/* Warning Note */}
                  <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-[1.5rem] flex items-center gap-4 text-amber-800">
                     <div className="p-2 bg-amber-100 rounded-lg"><Info size={20} /></div>
                     <div className="flex-1">
                        <p className="text-xs font-bold uppercase mb-1">تنبيه الحذف التلقائي:</p>
                        <p className="text-[10px] opacity-80 leading-relaxed font-bold">يتم تنظيف قاعدة البيانات تلقائياً من التقارير التي تجاوزت الـ 30 يوماً لضمان استقرار وسرعة النظام الميداني.</p>
                     </div>
                  </div>

                  {/* Table View - Requested Layout */}
                  <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                          <th className="p-6 text-right">الموظف الميداني</th>
                          <th className="p-6 text-right flex items-center gap-2">التاريخ <ArrowUpDown size={12} /></th>
                          <th className="p-6 text-right">القسم المختص</th>
                          <th className="p-6 text-right">محتوى التقرير</th>
                          <th className="p-6 text-center">المرفقات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedReports.length > 0 ? sortedReports.map(report => (
                          <tr key={report.id} className="hover:bg-blue-50/30 transition-all group">
                            <td className="p-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">{report.employeeName.charAt(0)}</div>
                                  <div>
                                     <span className="font-bold text-slate-800 text-xs block">{report.employeeName}</span>
                                     <span className="text-[9px] text-slate-400 uppercase">Worker Profile</span>
                                  </div>
                               </div>
                            </td>
                            <td className="p-6 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                               <div className="flex flex-col">
                                  <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                                  <span className="opacity-50">{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               </div>
                            </td>
                            <td className="p-6">
                               <span className="text-[9px] px-3 py-1 bg-slate-100 rounded-full font-bold text-slate-500 group-hover:bg-blue-100 transition-colors uppercase">
                                  {departments.find(d => d.id === report.departmentId)?.name || report.departmentId}
                               </span>
                            </td>
                            <td className="p-6 max-w-[300px]">
                               <p className="text-[11px] text-slate-600 leading-relaxed font-bold truncate group-hover:text-slate-800">{report.content}</p>
                            </td>
                            <td className="p-6">
                               <div className="flex justify-center gap-2">
                                  {report.type === 'link' && <a href={report.attachmentUrl} target="_blank" className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><LinkIcon size={16} /></a>}
                                  {report.type === 'file' && <a href={report.attachmentUrl} download={report.attachmentName} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Paperclip size={16} /></a>}
                                  {!report.attachmentUrl && <span className="text-[9px] text-slate-300 font-bold uppercase">N/A</span>}
                               </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="p-24 text-center opacity-30 flex flex-col items-center gap-4">
                               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto"><FileText size={48} /></div>
                               <p className="font-bold text-sm uppercase tracking-widest">لا توجد تقارير ميدانية في هذا القسم حالياً</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'map' && (
             <div className="h-[75vh] bg-white rounded-[3rem] border shadow-xl overflow-hidden relative p-3 animate-in zoom-in">
                <MapView logs={logs} />
             </div>
          )}

          {activeTab === 'chat' && (
             <div className="flex flex-col h-[75vh] bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="p-8 bg-slate-50 border-b flex gap-4 overflow-x-auto scrollbar-hide shadow-inner">
                   <button onClick={() => setChatTarget({type: 'all'})} className={`px-10 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${chatTarget.type === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>بث للجميع</button>
                   {departments.map(d => (
                     <button key={d.id} onClick={() => setChatTarget({type: 'dept', id: d.id})} className={`px-10 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${chatTarget.type === 'dept' && chatTarget.id === d.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>{d.name}</button>
                   ))}
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/10">
                   {chatMessages.filter(m => chatTarget.type === 'all' || (chatTarget.type === 'dept' && m.departmentId === chatTarget.id)).map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[75%] p-6 rounded-[2rem] text-[11px] shadow-sm transition-all hover:scale-[1.01] ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                         <p className="text-[9px] font-bold opacity-60 mb-2 uppercase tracking-widest">{msg.senderName}</p>
                         <p className="leading-relaxed">{msg.text}</p>
                       </div>
                       <span className="text-[8px] text-slate-400 mt-2 font-bold opacity-60 px-2">{msg.timestamp}</span>
                     </div>
                   ))}
                </div>
                <div className="p-8 border-t bg-white flex gap-5 items-center">
                   <input 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      className="flex-1 bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-inner" 
                      placeholder="اكتب رسالة توجيهية للقسم المختار..." 
                   />
                   <button onClick={handleSendChat} className="p-5 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"><Send size={24} /></button>
                </div>
             </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-800 text-2xl tracking-tight">إدارة الكوادر والمواقع</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Workforce Registry & Assignments</p>
                  </div>
                  <button onClick={() => setShowAddEmployeeModal(true)} className="bg-blue-600 text-white font-bold px-8 py-4 rounded-[1.5rem] shadow-xl hover:bg-blue-500 transition-all flex items-center gap-3 text-xs"><Plus size={20} /> إضافة عامل ميداني</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {employees.filter(e => e.name.includes(searchQuery)).map(emp => (
                    <div key={emp.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group relative hover:border-blue-400 transition-all overflow-hidden">
                       <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingEmp(emp); setShowEmployeeEditModal(true); }} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm"><Edit2 size={16} /></button>
                          <button onClick={() => { if(confirm('حذف العامل؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 shadow-sm"><Trash2 size={16} /></button>
                       </div>
                       
                       <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 p-1 mb-6 shadow-inner bg-slate-50 group-hover:scale-105 transition-transform"><img src={emp.avatar} className="w-full h-full object-cover rounded-[1.8rem]" /></div>
                       <h4 className="font-bold text-slate-800 text-lg">{emp.name}</h4>
                       <p className="text-[10px] text-blue-600 font-bold uppercase mb-6 tracking-widest">{emp.role}</p>
                       
                       <div className="w-full space-y-3 pt-6 border-t border-slate-100">
                          <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-400">القسم:</span><span className="text-slate-800">{departments.find(d => d.id === emp.departmentId)?.name}</span></div>
                          <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-400">الموقع:</span><span className="text-slate-800 truncate max-w-[120px]">{emp.workplace || 'غير محدد'}</span></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8">
               <div className="bg-white p-12 rounded-[3.5rem] border shadow-sm space-y-10">
                  <h3 className="font-bold text-2xl flex items-center gap-4 border-b border-slate-50 pb-8"><Palette className="text-emerald-500" size={32} /> إدارة الأقسام وتوزيع المهام</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {departments.map(dept => (
                      <div key={dept.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 hover:border-blue-300 hover:bg-white transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className="w-6 h-6 rounded-full shadow-inner border-2 border-white" style={{backgroundColor: dept.color}} />
                           <p className="font-bold text-slate-800 text-lg">{dept.name}</p>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">رئيس القسم المعتمد</label>
                          <select 
                            value={dept.headId || ''} 
                            onChange={e => {
                               const updated = departments.map(d => d.id === dept.id ? {...d, headId: e.target.value} : d);
                               onUpdateDepartments(updated);
                               const updatedEmps = employees.map(emp => {
                                 if (emp.id === e.target.value) return {...emp, userRole: UserRole.DEPT_HEAD};
                                 if (emp.id === dept.headId) return {...emp, userRole: UserRole.WORKER};
                                 return emp;
                               });
                               onUpdateEmployees(updatedEmps);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                          >
                            <option value="">اختر رئيس قسم من العمال...</option>
                            {employees.filter(e => e.departmentId === dept.id).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Employee Editor Modal */}
      {(showEmployeeEditModal || showAddEmployeeModal) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-2xl tracking-tight">{editingEmp ? `تعديل الملف: ${editingEmp.name}` : 'إضافة عضو ميداني جديد'}</h3>
                <button onClick={() => { setShowEmployeeEditModal(false); setShowAddEmployeeModal(false); }} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleSaveEmployee} className="p-12 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {editingEmp ? (
                      <>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الاسم الكامل</label>
                          <input value={editingEmp.name} onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">رقم الهاتف</label>
                          <input value={editingEmp.phone} onChange={e => setEditingEmp({...editingEmp, phone: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" />
                        </div>
                        <div className="space-y-3 col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الموقع الميداني (GPS Area)</label>
                          <input value={editingEmp.workplace || ''} onChange={e => setEditingEmp({...editingEmp, workplace: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" placeholder="اسم الموقع الميداني" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">خط العرض (Lat)</label>
                          <input type="number" step="any" value={editingEmp.workplaceLat || ''} onChange={e => setEditingEmp({...editingEmp, workplaceLat: parseFloat(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">خط الطول (Lng)</label>
                          <input type="number" step="any" value={editingEmp.workplaceLng || ''} onChange={e => setEditingEmp({...editingEmp, workplaceLng: parseFloat(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">بداية الوردية</label>
                          <input type="time" value={editingEmp.shiftStart || '08:00'} onChange={e => setEditingEmp({...editingEmp, shiftStart: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نهاية الوردية</label>
                          <input type="time" value={editingEmp.shiftEnd || '16:00'} onChange={e => setEditingEmp({...editingEmp, shiftEnd: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner" />
                        </div>
                        <div className="space-y-3 col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">القسم الميداني</label>
                          <select value={editingEmp.departmentId} onChange={e => setEditingEmp({...editingEmp, departmentId: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold shadow-inner">
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 space-y-4">
                        <input required value={newEmployeeForm.name} onChange={e => setNewEmployeeForm({...newEmployeeForm, name: e.target.value})} placeholder="الاسم الكامل" className="w-full bg-slate-50 border rounded-2xl p-5 text-sm font-bold shadow-inner" />
                        <input required value={newEmployeeForm.phone} onChange={e => setNewEmployeeForm({...newEmployeeForm, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full bg-slate-50 border rounded-2xl p-5 text-sm font-bold shadow-inner" />
                        <input required value={newEmployeeForm.role} onChange={e => setNewEmployeeForm({...newEmployeeForm, role: e.target.value})} placeholder="المسمى الوظيفي" className="w-full bg-slate-50 border rounded-2xl p-5 text-sm font-bold shadow-inner" />
                        <select required value={newEmployeeForm.departmentId} onChange={e => setNewEmployeeForm({...newEmployeeForm, departmentId: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-5 text-sm font-bold shadow-inner">
                          <option value="">اختر القسم الميداني...</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    )}
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-6 rounded-[2rem] shadow-2xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest">تحديث كافة البيانات الميدانية</button>
              </form>
           </div>
        </div>
      )}

      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[4rem] shadow-2xl p-12 text-center space-y-8 animate-in zoom-in">
              <div className="w-36 h-36 rounded-[3.5rem] overflow-hidden mx-auto border-8 border-slate-50 p-1 shadow-2xl bg-white"><img src={selectedEmployee.avatar} className="w-full h-full object-cover rounded-[3rem]" /></div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedEmployee.name}</h3>
                <p className="text-blue-600 font-bold text-sm uppercase tracking-[0.3em]">{selectedEmployee.role}</p>
              </div>
              <div className="space-y-4 text-right">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border flex justify-between items-center shadow-inner"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">القسم</span><span className="font-bold text-slate-800">{departments.find(d => d.id === selectedEmployee.departmentId)?.name || 'غير محدد'}</span></div>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border flex justify-between items-center shadow-inner"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الموقع</span><span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{selectedEmployee.workplace || 'لم يحدد'}</span></div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-widest">إغلاق ملف الهوية</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
