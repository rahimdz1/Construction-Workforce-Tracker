
import React, { useState } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, Search, 
  MessageSquare, Plus, Globe, Clock, ShieldCheck, 
  UserCheck, Sparkles, RefreshCw, LayoutGrid, MapPin,
  Settings as SettingsIcon, AlertTriangle, Loader2, X, Trash2, Edit2, Palette, Building2, QrCode, Check, Send, Paperclip, Link as LinkIcon
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

  // Modals for editing
  const [showEmployeeEditModal, setShowEmployeeEditModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const t = TRANSLATIONS[lang];

  const handleQRScan = (scannedId: string) => {
    const emp = employees.find(e => e.id === scannedId);
    if (emp) {
      setSelectedEmployee(emp);
      setShowQRScanner(false);
    } else {
      alert(lang === 'ar' ? 'موظف غير معروف' : 'Unknown employee');
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

  const handleUpdateEmployeeDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    const updated = employees.map(emp => emp.id === editingEmp.id ? editingEmp : emp);
    await onUpdateEmployees(updated);
    setShowEmployeeEditModal(false);
    setEditingEmp(null);
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white border-r flex flex-col sticky top-0 h-screen z-50 shadow-xl">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-slate-800 truncate hidden md:block text-sm">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutGrid, label: t.overview },
            { id: 'map', icon: MapIcon, label: 'الخريطة' },
            { id: 'employees', icon: Users, label: 'الموظفين' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={20} />
              <span className="font-bold text-xs hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t flex flex-col gap-2">
          <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all">
            <QrCode size={20} />
            <span className="font-bold text-xs hidden md:block">مسح هوية</span>
          </button>
          <button onClick={onLogout} className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={20} />
            <span className="font-bold text-xs hidden md:block">{t.logout}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40">
          <h2 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{activeTab}</h2>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-400 font-bold">الموظفين</p><p className="text-2xl font-bold">{employees.length}</p></div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-400 font-bold">الأقسام</p><p className="text-2xl font-bold">{departments.length}</p></div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-400 font-bold">حضور اليوم</p><p className="text-2xl font-bold">{logs.filter(l => l.type === 'IN').length}</p></div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-400 font-bold">تقارير جديدة</p><p className="text-2xl font-bold">{reports.length}</p></div>
               </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800 tracking-tight">إدارة الكوادر البشرية</h3>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border p-0.5"><img src={emp.avatar} className="w-full h-full object-cover rounded-xl" /></div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {emp.name} 
                          {departments.find(d => d.headId === emp.id) && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">رئيس قسم</span>}
                        </h4>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{emp.role} • {emp.departmentId}</p>
                        <p className="text-[9px] text-slate-400"><MapPin size={8} className="inline mr-1" /> {emp.workplace || 'لم يحدد الموقع'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingEmp(emp); setShowEmployeeEditModal(true); }} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:text-blue-600 transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => { if(confirm('حذف الموظف؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[70vh] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
               <div className="p-5 bg-slate-50 border-b flex items-center gap-4">
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                    <button onClick={() => setChatTarget({type: 'all'})} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${chatTarget.type === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>الكل</button>
                    {departments.map(d => (
                      <button key={d.id} onClick={() => setChatTarget({type: 'dept', id: d.id})} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${chatTarget.type === 'dept' && chatTarget.id === d.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>{d.name}</button>
                    ))}
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.filter(m => chatTarget.type === 'all' || (chatTarget.type === 'dept' && m.departmentId === chatTarget.id)).map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none shadow-md' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                        <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1">{msg.timestamp}</span>
                    </div>
                  ))}
               </div>
               <div className="p-5 border-t flex gap-3 bg-slate-50/50">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="اكتب رسالة جماعية..." />
                  <button onClick={handleSendChat} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-500 transition-all"><Send size={24} /></button>
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
               <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">الأرشيف الميداني</h3>
                    <div className="flex gap-2">
                       {departments.map(d => <span key={d.id} className="text-[9px] font-bold px-2 py-1 rounded-full border" style={{borderColor: d.color, color: d.color}}>{d.name}</span>)}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {reports.map(report => (
                      <div key={report.id} className="p-6 hover:bg-slate-50 transition-all flex flex-col gap-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-600">{report.employeeName.charAt(0)}</div>
                               <div>
                                 <p className="font-bold text-sm text-slate-800">{report.employeeName}</p>
                                 <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{report.timestamp} • {report.departmentId}</p>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               {report.type === 'link' && <a href={report.attachmentUrl} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg"><LinkIcon size={14} /></a>}
                               {report.type === 'file' && <a href={report.attachmentUrl} target="_blank" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Paperclip size={14} /></a>}
                            </div>
                         </div>
                         <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">{report.content}</div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-xl flex items-center gap-2"><Palette className="text-emerald-500" /> إدارة الأقسام والمسؤولين</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map(dept => (
                      <div key={dept.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: dept.color}} />
                            <p className="font-bold text-slate-800">{dept.name}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">رئيس القسم</label>
                          <select 
                            value={dept.headId || ''} 
                            onChange={e => {
                               const updated = departments.map(d => d.id === dept.id ? {...d, headId: e.target.value} : d);
                               onUpdateDepartments(updated);
                               // Update employee role to DEPT_HEAD
                               const updatedEmps = employees.map(emp => {
                                 if (emp.id === e.target.value) return {...emp, userRole: UserRole.DEPT_HEAD};
                                 if (emp.id === dept.headId) return {...emp, userRole: UserRole.WORKER};
                                 return emp;
                               });
                               onUpdateEmployees(updatedEmps);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none"
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

      {/* Edit Employee Modal */}
      {showEmployeeEditModal && editingEmp && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
              <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                <h3 className="font-bold">تعديل بيانات {editingEmp.name}</h3>
                <button onClick={() => setShowEmployeeEditModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateEmployeeDetails} className="p-8 space-y-5">
                 <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">مكان العمل / الموقع الميداني</label>
                      <input value={editingEmp.workplace || ''} onChange={e => setEditingEmp({...editingEmp, workplace: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm" placeholder="مثلاً: الموقع رقم 4 - الطابق الثاني" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">بداية الوردية</label>
                        <input type="time" value={editingEmp.shiftStart || '08:00'} onChange={e => setEditingEmp({...editingEmp, shiftStart: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">نهاية الوردية</label>
                        <input type="time" value={editingEmp.shiftEnd || '16:00'} onChange={e => setEditingEmp({...editingEmp, shiftEnd: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">القسم</label>
                      <select value={editingEmp.departmentId} onChange={e => setEditingEmp({...editingEmp, departmentId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm">
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl">حفظ التغييرات</button>
              </form>
           </div>
        </div>
      )}

      {/* QR Scanner Display */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}

      {/* Employee Info Modal from QR */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6">
              <div className="w-24 h-24 rounded-[2rem] overflow-hidden mx-auto border-4 border-blue-100 p-1 shadow-inner">
                <img src={selectedEmployee.avatar} className="w-full h-full object-cover rounded-[1.5rem]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{selectedEmployee.name}</h3>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">{selectedEmployee.role}</p>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">القسم</span>
                    <span className="font-bold text-slate-700">{selectedEmployee.departmentId}</span>
                 </div>
                 <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">الموقع</span>
                    <span className="font-bold text-slate-700">{selectedEmployee.workplace || 'غير محدد'}</span>
                 </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">إغلاق</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
