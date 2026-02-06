import { Employee, Department, UserRole, ReportEntry, ChatMessage } from './types';

export const ADMIN_PIN = '000';

export const DEPARTMENTS: Department[] = [
  { id: 'dept_1', name: 'قسم الصيانة', nameEn: 'Maintenance Dept', color: '#3b82f6' },
  { id: 'dept_2', name: 'قسم عمال الموقع', nameEn: 'Site Workers Dept', color: '#10b981' },
  { id: 'dept_3', name: 'قسم الكهرباء', nameEn: 'Electrical Dept', color: '#f59e0b' },
  { id: 'dept_4', name: 'قسم الحدادة', nameEn: 'Blacksmith Dept', color: '#ef4444' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '123_id', name: 'موظف تجريبي', role: 'عامل صيانة', userRole: UserRole.WORKER, phone: '123', password: '123', avatar: 'https://picsum.photos/seed/test/100/100', departmentId: 'dept_1', isShiftRequired: true, shiftStart: '08:00', shiftEnd: '16:00' },
  { id: '101_id', name: 'أحمد محمود', role: 'مشرف إنشائي', userRole: UserRole.SUPERVISOR, phone: '0501112222', password: '123', avatar: 'https://picsum.photos/seed/1/100/100', departmentId: 'dept_2', isShiftRequired: false },
];

export const MOCK_REPORTS: ReportEntry[] = [
  { id: 'r1', employeeId: '123_id', employeeName: 'موظف تجريبي', content: 'تم الانتهاء من فحص معدات الطابق الثاني.', timestamp: new Date().toLocaleString(), departmentId: 'dept_1' },
  { id: 'r2', employeeId: '101_id', employeeName: 'أحمد محمود', content: 'نقص في مواد البناء بالموقع رقم 4.', timestamp: new Date().toLocaleString(), departmentId: 'dept_2' }
];

export const MOCK_CHATS: ChatMessage[] = [
  { id: 'c1', senderId: 'ADMIN', senderName: 'الإدارة', text: 'مرحباً بالجميع، يرجى الالتزام بمواعيد الوردية الصباحية.', timestamp: '08:00 AM', type: 'group', departmentId: 'all' }
];

export const TRANSLATIONS = {
  ar: {
    title: 'نظام متابعة العمال',
    login: 'تسجيل الدخول',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    wrongPassword: 'كلمة المرور خاطئة!',
    attendance: 'الحضور',
    reports: 'التقارير',
    chat: 'الدردشة',
    profile: 'هويتي',
    announcements: 'الإعلانات',
    departments: 'الأقسام',
    checkIn: 'تسجيل حضور',
    checkOut: 'تسجيل انصراف',
    shift: 'الوردية',
    shiftStart: 'البداية',
    shiftEnd: ' النهاية',
    verified: 'موثق',
    workersManagement: 'إدارة الموظفين',
    overview: 'نظرة عامة',
    search: 'بحث...',
    logout: 'خروج'
  },
  en: {
    title: 'Workforce System',
    login: 'Login',
    phone: 'Phone',
    password: 'Password',
    wrongPassword: 'Wrong password!',
    attendance: 'Attendance',
    reports: 'Reports',
    chat: 'Chat',
    profile: 'Profile',
    announcements: 'Notices',
    departments: 'Depts',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    shift: 'Shift',
    shiftStart: 'Start',
    shiftEnd: 'End',
    verified: 'Verified',
    workersManagement: 'Staff Mgmt',
    overview: 'Overview',
    search: 'Search...',
    logout: 'Logout'
  }
};

export const WORK_SITE_LOCATION = { lat: 24.7136, lng: 46.6753 };
export const ALLOWED_RADIUS_METERS = 500;
