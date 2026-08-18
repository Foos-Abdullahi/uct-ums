import {
    BookOpen,
    Calendar,
    ClipboardList,
    CreditCard,
    FileText,
    GraduationCap,
    LayoutGrid,
    Library,
    Receipt,
    ScrollText,
    Settings,
    Shield,
    UserCog,
    Users,
} from 'lucide-react';
import type { NavItem } from '@/types';

export const adminNav: NavItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Roles', href: '/admin/roles', icon: UserCog },
    { title: 'Permissions', href: '/admin/permissions', icon: Shield },
    { title: 'Audit Log', href: '/admin/audit-log', icon: ScrollText },
    { title: 'System', href: '/admin/system', icon: Settings },
];

export const registrarNav: NavItem[] = [
    { title: 'Dashboard', href: '/registrar/dashboard', icon: LayoutGrid },
    { title: 'Admissions', href: '/registrar/admissions', icon: Users },
    { title: 'Students', href: '/registrar/students', icon: GraduationCap },
    { title: 'Programs', href: '/registrar/programs', icon: BookOpen },
    { title: 'Courses', href: '/registrar/courses', icon: BookOpen },
    { title: 'Sections', href: '/registrar/sections', icon: Library },
    { title: 'Semesters', href: '/registrar/semesters', icon: Calendar },
    { title: 'Enrollments', href: '/registrar/enrollments', icon: Users },
    { title: 'Transcripts', href: '/registrar/transcripts', icon: GraduationCap },
];

export const financeNav: NavItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard', icon: LayoutGrid },
    { title: 'Fee Structures', href: '/finance/fee-structures', icon: Receipt },
    { title: 'Invoices', href: '/finance/invoices', icon: FileText },
    { title: 'Payments', href: '/finance/payments', icon: CreditCard },
    { title: 'Overrides', href: '/finance/overrides', icon: Shield },
    { title: 'Reports', href: '/finance/reports', icon: ClipboardList },
];

export const hrNav: NavItem[] = [
    { title: 'Dashboard', href: '/hr/dashboard', icon: LayoutGrid },
    { title: 'Staff', href: '/hr/staff', icon: Users },
    { title: 'Leave', href: '/hr/leave', icon: Calendar },
];

export const lecturerNav: NavItem[] = [
    { title: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutGrid },
    { title: 'My Courses', href: '/lecturer/courses', icon: BookOpen },
    { title: 'Attendance', href: '/lecturer/attendance', icon: ClipboardList },
    { title: 'Gradebook', href: '/lecturer/gradebook', icon: GraduationCap },
    { title: 'Materials', href: '/lecturer/materials', icon: FileText },
];

export const studentNav: NavItem[] = [
    { title: 'Dashboard', href: '/student/dashboard', icon: LayoutGrid },
    { title: 'Courses', href: '/student/courses', icon: BookOpen },
    { title: 'Grades', href: '/student/grades', icon: GraduationCap },
    { title: 'Attendance', href: '/student/attendance', icon: ClipboardList },
    { title: 'Fees', href: '/student/fees', icon: CreditCard },
    { title: 'Documents', href: '/student/documents', icon: FileText },
];
