export enum UserRole {
  WORKER = 'WORKER',
  SUPERVISOR = 'SUPERVISOR',
  DEPT_HEAD = 'DEPT_HEAD',
  ADMIN = 'ADMIN'
}

export enum AttendanceStatus {
  PRESENT = 'حاضر',
  PRESENT_EN = 'Present',
  ABSENT = 'غائب',
  ABSENT_EN = 'Absent',
  LATE = 'متأخر',
  LATE_EN = 'Late',
  OUT_OF_BOUNDS = 'خارج الموقع',
  OUT_OF_BOUNDS_EN = 'Out of Bounds'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface CompanyConfig {
  name: string;
  logo: string;
}

export interface LogEntry {
  id: string;
  employeeId: string;
  name: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  photo: string;
  location: Location;
  status: AttendanceStatus;
  note?: string;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  headId?: string; 
}

export interface ReportEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  content: string;
  type: 'text' | 'file' | 'link';
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'group' | 'private' | 'multi';
  departmentId?: string;
  recipientIds?: string[];
}

export interface FileEntry {
  id: string;
  name: string;
  url: string;
  departmentId: string;
  uploadDate: string;
  type: 'PDF' | 'IMAGE' | 'EXCEL';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetDeptId: string | 'all';
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  userRole: UserRole;
  avatar: string;
  phone: string;
  password?: string;
  departmentId: string;
  isRegistered?: boolean;
  isShiftRequired: boolean;
  shiftStart?: string; 
  shiftEnd?: string;   
  workplace?: string; 
  workplaceLat?: number;
  workplaceLng?: number;
}

export type Language = 'ar' | 'en';
