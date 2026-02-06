import React, { useState } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, Search, 
  MessageSquare, Plus, Globe, Clock, ShieldCheck, 
  UserCheck, Sparkles, RefreshCw, LayoutGrid, MapPin,
  Settings as SettingsIcon, AlertTriangle, Loader2, X, Trash2, Edit2, Palette, Building2, QrCode, Check, Send, Paperclip, Link as LinkIcon, Camera
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

  // Modals
  const [showEmployeeEditModal, setShowEmployeeEditModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({ name: '', phone: '', role: '', departmentId: '' });

  const t = TRANSLATIONS[lang];

  const handleQRScan = (scannedData: string) => {
    try {
      const data = JSON.parse(scannedData);
      const emp = employees.find(e => e.id === data.id);
      if (emp) {
        setSelectedEmployee(emp);
        setShowQRScanner(false);
      } else {
        alert(lang === 'ar' ? 'الموظف غير مسجل في النظام' : 'Employee not in system');
      }
    } catch {
      const emp = employees.find(e => e.id === scannedData);
      if (emp) {
        setSelectedEmployee(emp);
        setShowQRScanner(false);
      } else {
        alert(lang === 'ar' ? 'فشل قراءة الرمز' : 'QR Scan failed');
      }
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(),
      senderId: 'ADMIN',
      senderName: 'الإدارة',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
      type: chatTarget.type === 'user' ? 'private' : 'group',
      departmentId: chatTarget.type === 'dept' ? chatTarget.id : 'all',
      recipientIds: chatTarget.type === 'user' ? [chatTarget.id!] : undefined
    };
    await onSendMessage(msg);
    setChatInput('');
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

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeAttendance(logs.slice(0, 50));
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const stats = {
    totalEmployees: employees.length,
    todayPresent: logs.filter(l => l.type === 'IN').length,
    outOfBounds: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length,
    reportsCount: reports.length
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen z-50">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold truncate hidden md:block text-sm uppercase tracking-widest">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutGrid, label: t.overview },
            { id: 'map', icon: MapIcon, label: 'الخريطة الميدانية' },
            { id: 'employees', icon: Users, label: 'إدارة العمال' },
            { id: 'reports', icon: FileText, label: 'التقارير الواردة' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة الجماعية' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <item.icon size={20} />
              <span className="font-bold text-xs hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <button onClick={() => setShowQRScanner(true)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-all shadow-lg">
            <QrCode size={20} />
            <span className="font-bold text-xs hidden md:block">مسح QR العامل</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            <span className="font-bold text-xs hidden md:block">{t.logout}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40">
          <h2 className="font-bold text-slate-800 text-lg uppercase">{activeTab}</h2>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث سريع..." 
              className="bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-xs w-64 focus:ring-1 focus:ring-blue-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={24} /></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">إجمالي العمال</p><p className="text-2xl font-bold">{stats.totalEmployees}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><UserCheck size={24} /></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">حاضر اليوم</p><p className="text-2xl font-bold">{stats.todayPresent}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><AlertTriangle size={24} /></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">خارج الموقع</p><p className="text-2xl font-bold">{stats.outOfBounds}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">تقارير جديدة</p><p className="text-2xl font-bold">{stats.reportsCount}</p></div>
                  </div>
               </div>

               <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-4">
                       <h3 className="text-2xl font-bold flex items-center gap-3"><Sparkles className="text-amber-400" /> تحليل الأداء الذكي (Gemini)</h3>
                       <p className="text-blue-100 max-w-md text-sm">احصل على رؤية عميقة لحالة العمل الميدانية وتوصيات فورية لتحسين الإنتاجية باستخدام الذكاء الاصطناعي.</p>
                       <button onClick={handleRunAiAnalysis} className="bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">تحليل البيانات الآن</button>
                    </div>
                    {isAnalyzing && <div className="flex items-center gap-3"><Loader2 className="animate-spin" size={32} /><span className="font-bold">جاري المعالجة...</span></div>}
                    {aiAnalysis && <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-sm max-w-xl leading-relaxed">{aiAnalysis}</div>}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-[75vh] bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative p-2">
               <MapView logs={logs} />
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight">إدارة الكادر الوظيفي</h3>
                  <button onClick={() => setShowAddEmployeeModal(true)} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2"><Plus size={20} /> إضافة عامل</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {employees.filter(e => e.name.includes(searchQuery)).map(emp => (
                    <div key={emp.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-blue-300 transition-all relative">
                       <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingEmp(emp); setShowEmployeeEditModal(true); }} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                          <button onClick={() => { if(confirm('حذف العامل؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                       </div>
                       <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-inner mb-4">
                          <img src={emp.avatar} className="w-full h-full object-cover" alt={emp.name} />
                       </div>
                       <h4 className="font-bold text-slate-800 text-lg mb-1">{emp.name}</h4>
                       <p className="text-[10px] text-blue-600 font-bold uppercase mb-4 tracking-widest">{emp.role}</p>
                       <div className="w-full space-y-2 text-right">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 border-b pb-1"><span>القسم:</span><span className="text-slate-800">{departments.find(d => d.id === emp.departmentId)?.name || 'غير محدد'}</span></div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 border-b pb-1"><span>الموقع:</span><span className="text-slate-800">{emp.workplace || 'لم يحدد'}</span></div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 border-b pb-1"><span>رقم الهاتف:</span><span className="text-slate-800">{emp.phone}</span></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight">الأرشيف الميداني المتكامل</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {reports.map(report => (
                      <div key={report.id} className="p-8 hover:bg-slate-50 transition-all flex flex-col gap-4">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-lg">{report.employeeName.charAt(0)}</div>
                               <div>
                                 <p className="font-bold text-slate-800">{report.employeeName}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{report.timestamp} • {report.departmentId}</p>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               {report.type === 'link' && <a href={report.attachmentUrl} target="_blank" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><LinkIcon size={18} /></a>}
                               {report.type === 'file' && <a href={report.attachmentUrl} download={report.attachmentName} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2">
                                  <Paperclip size={18} /> <span className="text-[10px] font-bold">تحميل المرفق</span>
                               </a>}
                            </div>
                         </div>
                         <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 text-xs text-slate-600 leading-relaxed shadow-inner">
                            {report.content}
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[70vh] bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 bg-slate-50 border-b flex gap-3 overflow-x-auto">
                  <button onClick={() => setChatTarget({type: 'all'})} className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${chatTarget.type === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>الكل</button>
                  {departments.map(d => (
                    <button key={d.id} onClick={() => setChatTarget({type: 'dept', id: d.id})} className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${chatTarget.type === 'dept' && chatTarget.id === d.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>{d.name}</button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/20">
                  {chatMessages.filter(m => chatTarget.type === 'all' || (chatTarget.type === 'dept' && m.departmentId === chatTarget.id)).map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-[1.5rem] text-sm shadow-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                        <p className="text-[9px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                        {msg.text}
                      </div>
                    </div>
                  ))}
               </div>
               <div className="p-6 border-t bg-slate-50 flex gap-4">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-600" placeholder="اكتب رسالة إلى القسم المختار..." />
                  <button onClick={handleSendChat} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-500 transition-all"><Send size={24} /></button>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
               <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                  <h3 className="font-bold text-2xl flex items-center gap-3 border-b pb-6"><Palette className="text-emerald-500" /> إدارة الأقسام وتعيين المسؤولين</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {departments.map(dept => (
                      <div key={dept.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-5 h-5 rounded-full shadow-inner" style={{backgroundColor: dept.color}} />
                           <p className="font-bold text-slate-800 text-lg">{dept.name}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">رئيس القسم المسؤول</label>
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
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">تعيين رئيس قسم من العمال...</option>
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

      {/* Employee Edit/Add Modal */}
      {(showEmployeeEditModal || showAddEmployeeModal) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in">
              <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                <h3 className="font-bold text-xl">{editingEmp ? `تعديل: ${editingEmp.name}` : 'إضافة عامل جديد'}</h3>
                <button onClick={() => { setShowEmployeeEditModal(false); setShowAddEmployeeModal(false); }} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveEmployee} className="p-10 space-y-6">
                 {editingEmp ? (
                   <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">اسم العامل</label>
                        <input value={editingEmp.name} onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">مكان العمل الميداني</label>
                        <input value={editingEmp.workplace || ''} onChange={e => setEditingEmp({...editingEmp, workplace: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" placeholder="المبنى C - الموقع 4" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">بداية الوردية</label>
                          <input type="time" value={editingEmp.shiftStart || '08:00'} onChange={e => setEditingEmp({...editingEmp, shiftStart: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">نهاية الوردية</label>
                          <input type="time" value={editingEmp.shiftEnd || '16:00'} onChange={e => setEditingEmp({...editingEmp, shiftEnd: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">القسم</label>
                        <select value={editingEmp.departmentId} onChange={e => setEditingEmp({...editingEmp, departmentId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm">
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      <input required value={newEmployeeForm.name} onChange={e => setNewEmployeeForm({...newEmployeeForm, name: e.target.value})} placeholder="الاسم الكامل" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" />
                      <input required value={newEmployeeForm.phone} onChange={e => setNewEmployeeForm({...newEmployeeForm, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" />
                      <input required value={newEmployeeForm.role} onChange={e => setNewEmployeeForm({...newEmployeeForm, role: e.target.value})} placeholder="الدور الوظيفي" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" />
                      <select required value={newEmployeeForm.departmentId} onChange={e => setNewEmployeeForm({...newEmployeeForm, departmentId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm">
                        <option value="">اختر القسم</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                   </div>
                 )}
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-5 rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all">حفظ البيانات</button>
              </form>
           </div>
        </div>
      )}

      {/* QR Scanner */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}

      {/* Detailed Employee Modal from QR */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[4rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in">
              <div className="w-32 h-32 rounded-[3rem] overflow-hidden mx-auto border-8 border-blue-50 p-1 shadow-2xl">
                <img src={selectedEmployee.avatar} className="w-full h-full object-cover rounded-[2.5rem]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedEmployee.name}</h3>
                <p className="text-blue-600 font-bold text-sm uppercase tracking-[0.2em]">{selectedEmployee.role}</p>
              </div>
              <div className="space-y-4 text-right">
                 <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">القسم الميداني</span>
                    <span className="font-bold text-slate-800">{departments.find(d => d.id === selectedEmployee.departmentId)?.name || 'غير محدد'}</span>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الموقع المخصص</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedEmployee.workplace || 'لم يحدد'}</span>
                 </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-bold shadow-2xl hover:bg-slate-800 transition-all">إغلاق الهوية</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
