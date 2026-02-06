
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, Search, 
  MessageSquare, Plus, Globe, Clock, ShieldCheck, 
  UserCheck, Sparkles, RefreshCw, LayoutGrid, MapPin,
  Settings as SettingsIcon, AlertTriangle, Loader2, X, Trash2, Edit2, Palette, Building2, QrCode, Check, Send, Paperclip, Link as LinkIcon, Info, Calendar, Filter
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

  /**
   * Fix: Implement handleRunAiAnalysis to trigger the Gemini-powered analysis
   */
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeAttendance(logs);
      setAiAnalysis(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiAnalysis("حدث خطأ أثناء تحليل البيانات بالذكاء الاصطناعي.");
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
      {/* Sidebar - Pro Design */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-xs uppercase hidden md:block">{companyConfig.name}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'الرئيسية' },
            { id: 'map', icon: MapIcon, label: 'الخريطة' },
            { id: 'employees', icon: Users, label: 'العمال' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={18} /> <span className="text-[10px] font-bold hidden md:block uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
           <button onClick={() => setShowQRScanner(true)} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl text-blue-400"><QrCode size={18} /> <span className="text-[9px] font-bold hidden md:block">مسح QR</span></button>
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-400"><LogOut size={18} /> <span className="text-[9px] font-bold hidden md:block">خروج</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40">
          <h2 className="font-bold text-slate-800 text-md uppercase">{activeTab}</h2>
          <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 gap-2">
            <Search size={14} className="text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-xs w-48" placeholder="بحث..." />
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'العمال', val: employees.length, icon: Users, color: 'blue' },
                    { label: 'حضور اليوم', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                    { label: 'خارج الموقع', val: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length, icon: AlertTriangle, color: 'red' },
                    { label: 'تقارير نشطة', val: sortedReports.length, icon: FileText, color: 'amber' }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                      <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center`}><s.icon size={24} /></div>
                      <div><p className="text-[9px] text-slate-400 font-bold uppercase">{s.label}</p><p className="text-xl font-bold">{s.val}</p></div>
                    </div>
                  ))}
               </div>
               
               <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-amber-400" /> تحليلات الذكاء الاصطناعي</h3>
                    <p className="text-xs opacity-80 max-w-lg">احصل على ملخص شامل لأداء العمال والإنتاجية من خلال تحليل سجلات الحضور والتقارير الميدانية.</p>
                    <button onClick={handleRunAiAnalysis} className="bg-white text-blue-900 font-bold px-6 py-3 rounded-xl shadow-lg text-xs hover:scale-105 transition-all">تحليل البيانات الآن</button>
                    {isAnalyzing && <div className="mt-4 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> <span className="text-[10px]">جاري التحليل...</span></div>}
                    {aiAnalysis && <div className="mt-4 p-4 bg-white/10 rounded-2xl text-xs leading-relaxed border border-white/20">{aiAnalysis}</div>}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText size={24} /></div>
                       <div><h3 className="font-bold text-slate-800">سجل التقارير الميدانية</h3><p className="text-[9px] text-slate-400 font-bold uppercase">Field Operation Logs</p></div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border w-full md:w-auto overflow-x-auto">
                       <button onClick={() => setReportFilterDept('all')} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase ${reportFilterDept === 'all' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>الكل</button>
                       {departments.map(d => (
                         <button key={d.id} onClick={() => setReportFilterDept(d.id)} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase whitespace-nowrap ${reportFilterDept === d.id ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>{d.name}</button>
                       ))}
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-700">
                     <Info size={16} /> <p className="text-[10px] font-bold uppercase">سيتم حذف التقارير تلقائياً بعد مرور 30 يوماً</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                          <th className="p-4 rounded-tr-2xl text-right">الموظف</th>
                          <th className="p-4 text-right">التاريخ</th>
                          <th className="p-4 text-right">القسم</th>
                          <th className="p-4 text-right">المحتوى</th>
                          <th className="p-4 rounded-tl-2xl text-center">المرفقات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedReports.length > 0 ? sortedReports.map(report => (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">{report.employeeName.charAt(0)}</div>
                                  <span className="font-bold text-slate-800 text-xs">{report.employeeName}</span>
                               </div>
                            </td>
                            <td className="p-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">{new Date(report.timestamp).toLocaleDateString()}</td>
                            <td className="p-4">
                               <span className="text-[9px] px-2 py-1 bg-slate-100 rounded-full font-bold text-slate-600">{departments.find(d => d.id === report.departmentId)?.name || report.departmentId}</span>
                            </td>
                            <td className="p-4 max-w-[250px]">
                               <p className="text-[10px] text-slate-600 truncate">{report.content}</p>
                            </td>
                            <td className="p-4">
                               <div className="flex justify-center gap-2">
                                  {report.type === 'link' && <a href={report.attachmentUrl} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg"><LinkIcon size={14} /></a>}
                                  {report.type === 'file' && <a href={report.attachmentUrl} download={report.attachmentName} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Paperclip size={14} /></a>}
                                  {!report.attachmentUrl && <span className="text-[9px] text-slate-300">لا يوجد</span>}
                               </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="p-12 text-center opacity-30 flex flex-col items-center gap-2">
                               <FileText size={48} /> <p className="font-bold text-sm uppercase">لا توجد تقارير حالياً</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border shadow-sm">
                  <h3 className="font-bold text-slate-800 text-lg">إدارة الكادر البشري</h3>
                  <button onClick={() => setShowAddEmployeeModal(true)} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs"><Plus size={16} /> إضافة عامل</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {employees.filter(e => e.name.includes(searchQuery)).map(emp => (
                    <div key={emp.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center group relative hover:border-blue-400 transition-all">
                       <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingEmp(emp); setShowEmployeeEditModal(true); }} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                          <button onClick={() => { if(confirm('حذف العامل؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                       </div>
                       <div className="w-20 h-20 rounded-3xl overflow-hidden border p-1 mb-4 shadow-inner bg-slate-50"><img src={emp.avatar} className="w-full h-full object-cover rounded-2xl" /></div>
                       <h4 className="font-bold text-slate-800 text-md">{emp.name}</h4>
                       <p className="text-[9px] text-blue-600 font-bold uppercase mb-4 tracking-widest">{emp.role}</p>
                       <div className="w-full space-y-2 text-[10px] font-bold text-slate-400 border-t pt-4">
                          <div className="flex justify-between"><span>القسم:</span><span className="text-slate-800">{departments.find(d => d.id === emp.departmentId)?.name}</span></div>
                          <div className="flex justify-between"><span>الموقع:</span><span className="text-slate-800 truncate max-w-[120px]">{emp.workplace || 'غير محدد'}</span></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
               <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm space-y-8">
                  <h3 className="font-bold text-xl flex items-center gap-3"><Palette className="text-emerald-500" /> هيكلة الأقسام والمسؤولين</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {departments.map(dept => (
                      <div key={dept.id} className="p-6 bg-slate-50 rounded-3xl border space-y-4">
                        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{backgroundColor: dept.color}} /><p className="font-bold text-slate-800">{dept.name}</p></div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">رئيس القسم المسؤول</label>
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
                            className="w-full bg-white border rounded-xl p-3 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">تعيين رئيس قسم...</option>
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

      {/* Modals for Adding/Editing */}
      {(showEmployeeEditModal || showAddEmployeeModal) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-xl">{editingEmp ? `تعديل البيانات` : 'إضافة عامل جديد'}</h3>
                <button onClick={() => { setShowEmployeeEditModal(false); setShowAddEmployeeModal(false); }} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveEmployee} className="p-10 space-y-6">
                 {editingEmp ? (
                   <div className="space-y-4">
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">الاسم الكامل</label><input value={editingEmp.name} onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" /></div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">الموقع الميداني (GPS)</label><input value={editingEmp.workplace || ''} onChange={e => setEditingEmp({...editingEmp, workplace: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" placeholder="مثلاً: الموقع رقم 5" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">خط العرض</label><input type="number" step="any" value={editingEmp.workplaceLat || ''} onChange={e => setEditingEmp({...editingEmp, workplaceLat: parseFloat(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">خط الطول</label><input type="number" step="any" value={editingEmp.workplaceLng || ''} onChange={e => setEditingEmp({...editingEmp, workplaceLng: parseFloat(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" /></div>
                      </div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">القسم</label>
                        <select value={editingEmp.departmentId} onChange={e => setEditingEmp({...editingEmp, departmentId: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold">
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      <input required value={newEmployeeForm.name} onChange={e => setNewEmployeeForm({...newEmployeeForm, name: e.target.value})} placeholder="الاسم الكامل" className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" />
                      <input required value={newEmployeeForm.phone} onChange={e => setNewEmployeeForm({...newEmployeeForm, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" />
                      <input required value={newEmployeeForm.role} onChange={e => setNewEmployeeForm({...newEmployeeForm, role: e.target.value})} placeholder="المسمى الوظيفي" className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold" />
                      <select required value={newEmployeeForm.departmentId} onChange={e => setNewEmployeeForm({...newEmployeeForm, departmentId: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 text-sm font-bold">
                        <option value="">اختر القسم...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                   </div>
                 )}
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-5 rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all">حفظ البيانات</button>
              </form>
           </div>
        </div>
      )}

      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[4rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden mx-auto border-8 border-slate-50 p-1 shadow-2xl bg-white"><img src={selectedEmployee.avatar} className="w-full h-full object-cover rounded-[2rem]" /></div>
              <div><h3 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedEmployee.name}</h3><p className="text-blue-600 font-bold text-xs uppercase tracking-widest">{selectedEmployee.role}</p></div>
              <div className="space-y-4 text-right">
                 <div className="p-5 bg-slate-50 rounded-[2rem] border flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">القسم</span><span className="font-bold text-slate-800">{departments.find(d => d.id === selectedEmployee.departmentId)?.name}</span></div>
                 <div className="p-5 bg-slate-50 rounded-[2rem] border flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">الموقع</span><span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{selectedEmployee.workplace || 'لم يحدد'}</span></div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-bold">إغلاق الهوية</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
