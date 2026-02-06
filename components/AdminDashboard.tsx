
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Map as MapIcon, FileText, Bell, LogOut, Search, Download, 
  Briefcase, MessageSquare, Send, Plus, Filter, QrCode, Edit, Trash2, 
  Megaphone, BellRing, X, Camera, Globe, Phone, Clock, ShieldCheck, 
  UserCheck, Award, FileUp, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Lock, 
  Eye, LayoutGrid, List, FileArchive, CheckCircle2, Upload, ExternalLink, MapPin,
  Settings as SettingsIcon, Image as ImageIcon, Link as LinkIcon, Paperclip, Loader2,
  // Added missing AlertTriangle icon import
  AlertTriangle
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, FileEntry, Announcement, Language, UserRole, CompanyConfig
} from '../types.ts';
import { TRANSLATIONS } from '../constants.ts';
import MapView from './MapView.tsx';
import QRScanner from './QRScanner.tsx';
import { analyzeAttendance } from '../geminiService.ts';

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
  logs, reports, chatMessages, departmentFiles, employees, departments,
  announcements, companyConfig, lang, onSetLang, onSendMessage, onLogout,
  onUpdateEmployees, onUpdateDepartments, onUpdateAnnouncements, onUpdateFiles, onUpdateCompanyConfig
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'reports' | 'chat' | 'announcements' | 'settings'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeAttendance(logs.slice(0, 50));
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const stats = {
    totalEmployees: employees.length,
    todayPresent: logs.filter(l => l.type === 'IN' && l.status === AttendanceStatus.PRESENT).length,
    todayAbsent: employees.length - logs.filter(l => l.type === 'IN').length,
    outOfBounds: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
            { id: 'announcements', icon: Megaphone, label: t.announcements },
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
          <div className="flex items-center gap-4">
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

              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">آخر التحركات</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                        <th className="px-6 py-4">الموظف</th>
                        <th className="px-6 py-4">التوقيت</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4">الموقع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.slice(0, 8).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={log.photo} className="w-10 h-10 rounded-xl object-cover" />
                              <div className="font-bold text-sm text-slate-800">{log.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">{log.timestamp}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${log.status === AttendanceStatus.OUT_OF_BOUNDS ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => { setActiveTab('map'); setSelectedLogId(log.id); }} className="text-blue-500 hover:scale-110 transition-transform"><MapPin size={18} /></button>
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
            <div className="h-[calc(100vh-160px)] bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner p-2 relative animate-in fade-in duration-500">
               <MapView logs={logs} highlightLogId={selectedLogId} />
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xl">{t.workersManagement}</h3>
                  <button className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 hover:bg-blue-500 active:scale-95 transition-all">
                    <Plus size={20} /> إضافة موظف
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {employees.map(emp => (
                    <div key={emp.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                       <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-inner border border-slate-100 p-1">
                          <img src={emp.avatar} className="w-full h-full object-cover rounded-xl" />
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
                    {reports.map(report => (
                      <div key={report.id} className="p-6 hover:bg-slate-50 transition-all flex flex-col gap-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{report.employeeName.charAt(0)}</div>
                               <span className="font-bold text-sm text-slate-800">{report.employeeName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{report.timestamp}</span>
                         </div>
                         <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">{report.content}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
