import React, { useState } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, Search, 
  MessageSquare, Plus, Globe, Clock, ShieldCheck, 
  UserCheck, Sparkles, RefreshCw, LayoutGrid, MapPin,
  Settings as SettingsIcon, AlertTriangle, Loader2, X, Trash2, Edit2, Palette, Building2
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, FileEntry, Announcement, Language, CompanyConfig, UserRole
} from '../types';
import { TRANSLATIONS } from '../constants';
import MapView from './MapView';
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
  onUpdateDepartments, onUpdateCompanyConfig
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'reports' | 'chat' | 'settings'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  
  // Modals States
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', role: '', departmentId: '' });
  
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', nameEn: '', color: '#3b82f6' });

  const [compConfigForm, setCompConfigForm] = useState({ name: companyConfig.name, logo: companyConfig.logo });

  const t = TRANSLATIONS[lang];

  // AI Logic
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeAttendance(logs.slice(0, 50));
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Employee Logic
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEmployee.name,
      phone: newEmployee.phone,
      role: newEmployee.role,
      departmentId: newEmployee.departmentId || departments[0]?.id || 'default',
      userRole: UserRole.WORKER,
      avatar: `https://picsum.photos/seed/${newEmployee.name}/100/100`,
      password: '123',
      isShiftRequired: true,
      shiftStart: '08:00',
      shiftEnd: '16:00'
    };
    await onUpdateEmployees([...employees, employee]);
    setShowAddEmployeeModal(false);
    setNewEmployee({ name: '', phone: '', role: '', departmentId: '' });
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
      await onUpdateEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  // Department Logic
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      const updated = departments.map(d => d.id === editingDept.id ? { ...d, ...deptForm } : d);
      await onUpdateDepartments(updated);
    } else {
      const newDept: Department = {
        id: 'dept_' + Math.random().toString(36).substr(2, 5),
        ...deptForm
      };
      await onUpdateDepartments([...departments, newDept]);
    }
    setShowDeptModal(false);
    setEditingDept(null);
    setDeptForm({ name: '', nameEn: '', color: '#3b82f6' });
  };

  const handleDeleteDepartment = async (id: string) => {
    if (confirm(lang === 'ar' ? 'حذف القسم سيؤثر على الموظفين المنتمين له، هل أنت متأكد؟' : 'Deleting a department affects its employees, proceed?')) {
      await onUpdateDepartments(departments.filter(d => d.id !== id));
    }
  };

  const handleUpdateConfig = async () => {
    await onUpdateCompanyConfig(compConfigForm);
    alert(lang === 'ar' ? 'تم تحديث إعدادات الشركة' : 'Company settings updated');
  };

  const stats = {
    totalEmployees: employees.length,
    todayPresent: logs.filter(l => l.type === 'IN' && l.status === AttendanceStatus.PRESENT).length,
    todayAbsent: employees.length - logs.filter(l => l.type === 'IN').length,
    outOfBounds: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white border-r flex flex-col sticky top-0 h-screen z-50">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-slate-800 truncate hidden md:block text-sm">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutGrid, label: t.overview },
            { id: 'map', icon: MapIcon, label: lang === 'ar' ? 'الخريطة' : 'Map' },
            { id: 'employees', icon: Users, label: t.workersManagement },
            { id: 'reports', icon: FileText, label: t.reports },
            { id: 'chat', icon: MessageSquare, label: t.chat },
            { id: 'settings', icon: SettingsIcon, label: lang === 'ar' ? 'الإعدادات' : 'Settings' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={20} />
              <span className="font-bold text-xs hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          <button onClick={() => onSetLang(lang === 'ar' ? 'en' : 'ar')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
            <Globe size={20} />
            <span className="font-bold text-xs hidden md:block">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={20} />
            <span className="font-bold text-xs hidden md:block">{t.logout}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40">
          <h2 className="font-bold text-slate-800 text-lg uppercase tracking-tight">
            {TRANSLATIONS[lang][activeTab as keyof typeof TRANSLATIONS['en']] || activeTab}
          </h2>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t.search} 
              className="bg-slate-50 border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-blue-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={24} /></div>
                  <div><p className="text-xs text-slate-500 font-bold">{lang === 'ar' ? 'الموظفين' : 'Employees'}</p><p className="text-2xl font-bold text-slate-800">{stats.totalEmployees}</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><UserCheck size={24} /></div>
                  <div><p className="text-xs text-slate-500 font-bold">{lang === 'ar' ? 'حضور' : 'Present'}</p><p className="text-2xl font-bold text-slate-800">{stats.todayPresent}</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><AlertTriangle size={24} /></div>
                  <div><p className="text-xs text-slate-500 font-bold">{lang === 'ar' ? 'خارج الموقع' : 'Out of Bounds'}</p><p className="text-2xl font-bold text-slate-800">{stats.outOfBounds}</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
                  <div><p className="text-xs text-slate-500 font-bold">{lang === 'ar' ? 'متوقع' : 'Expected'}</p><p className="text-2xl font-bold text-slate-800">--</p></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="text-amber-400" size={28} />
                    <h3 className="text-xl font-bold">التحليل الذكي (Gemini AI)</h3>
                  </div>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-4 py-8">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-bold animate-pulse">جاري معالجة البيانات الميدانية...</p>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 whitespace-pre-wrap text-sm leading-relaxed">
                      {aiAnalysis}
                      <button onClick={handleRunAiAnalysis} className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-200 hover:text-white transition-colors">
                        <RefreshCw size={14} /> تحديث
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-blue-100 mb-6">احصل على تقارير فورية حول كفاءة الميدان وتوصيات تحسين الأداء</p>
                      <button onClick={handleRunAiAnalysis} className="bg-white text-blue-600 font-bold px-10 py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto">
                        <Sparkles size={20} /> تحليل الآن
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-[calc(100vh-160px)] bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner p-2 relative">
               <MapView logs={logs} highlightLogId={selectedLogId} />
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xl">{t.workersManagement}</h3>
                  <button 
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 hover:bg-blue-500 active:scale-95 transition-all"
                  >
                    <Plus size={20} /> إضافة موظف
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {employees.map(emp => (
                    <div key={emp.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center relative group">
                       <button 
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={16} />
                       </button>
                       <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-inner border border-slate-100 p-1">
                          <img src={emp.avatar} className="w-full h-full object-cover rounded-xl" alt={emp.name} />
                       </div>
                       <h4 className="font-bold text-slate-800">{emp.name}</h4>
                       <p className="text-[10px] text-blue-600 font-bold uppercase mb-4">{emp.role}</p>
                       <div className="w-full space-y-2 text-right">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 border-b pb-1">
                            <span>القسم:</span>
                            <span className="text-slate-700">{departments.find(d => d.id === emp.departmentId)?.name || 'غير محدد'}</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 border-b pb-1">
                            <span>الهاتف:</span>
                            <span className="text-slate-700">{emp.phone}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b bg-slate-50/50"><h3 className="font-bold text-slate-800">{t.reports}</h3></div>
                  <div className="divide-y divide-slate-100">
                    {reports.length > 0 ? reports.map(report => (
                      <div key={report.id} className="p-6 hover:bg-slate-50 transition-all flex flex-col gap-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{(report.employeeName || '?').charAt(0)}</div>
                               <span className="font-bold text-sm text-slate-800">{report.employeeName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{report.timestamp}</span>
                         </div>
                         <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">{report.content}</p>
                      </div>
                    )) : (
                      <div className="p-12 text-center text-slate-400">لا توجد تقارير حالياً</div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[70vh] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                <h3 className="font-bold text-slate-800">دردشة النظام</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">{msg.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              {/* Company Profile Settings */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <Building2 className="text-blue-600" />
                  <h3 className="font-bold text-slate-800">بيانات المؤسسة</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">اسم الشركة</label>
                    <input 
                      value={compConfigForm.name} 
                      onChange={e => setCompConfigForm({...compConfigForm, name: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">رابط الشعار (URL)</label>
                    <input 
                      value={compConfigForm.logo} 
                      onChange={e => setCompConfigForm({...compConfigForm, logo: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 outline-none" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleUpdateConfig}
                  className="bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  حفظ التعديلات
                </button>
              </div>

              {/* Departments Management */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Palette className="text-emerald-600" />
                    <h3 className="font-bold text-slate-800">إدارة الأقسام</h3>
                  </div>
                  <button 
                    onClick={() => { setEditingDept(null); setDeptForm({ name: '', nameEn: '', color: '#3b82f6' }); setShowDeptModal(true); }}
                    className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:bg-emerald-50 px-3 py-2 rounded-xl"
                  >
                    <Plus size={16} /> إضافة قسم
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map(dept => (
                    <div key={dept.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-10 rounded-full" style={{ backgroundColor: dept.color }} />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{dept.name}</p>
                          <p className="text-[10px] text-slate-400">{dept.nameEn}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingDept(dept); setDeptForm({ name: dept.name, nameEn: dept.nameEn, color: dept.color }); setShowDeptModal(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold">إضافة موظف جديد</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">اسم الموظف</label>
                  <input required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 outline-none" placeholder="الاسم الكامل" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">رقم الهاتف</label>
                  <input required value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} type="tel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 outline-none" placeholder="05XXXXXXXX" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">الدور الوظيفي</label>
                  <input required value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 outline-none" placeholder="مثلاً: عامل صيانة" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">القسم</label>
                  <select required value={newEmployee.departmentId} onChange={e => setNewEmployee({...newEmployee, departmentId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 outline-none">
                    <option value="">اختر القسم</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">حفظ الموظف</button>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="font-bold">{editingDept ? 'تعديل قسم' : 'إضافة قسم جديد'}</h3>
              <button onClick={() => setShowDeptModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveDepartment} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">اسم القسم (عربي)</label>
                  <input required value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">اسم القسم (EN)</label>
                  <input required value={deptForm.nameEn} onChange={e => setDeptForm({...deptForm, nameEn: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm focus:border-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-2">لون القسم</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" value={deptForm.color} onChange={e => setDeptForm({...deptForm, color: e.target.value})} className="w-12 h-12 rounded-lg border-none cursor-pointer" />
                    <span className="text-xs text-slate-500 font-mono uppercase">{deptForm.color}</span>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">
                {editingDept ? 'تحديث القسم' : 'حفظ القسم'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
