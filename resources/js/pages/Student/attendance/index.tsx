import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/student/attendance';

export default function StudentAttendanceIndex() {
    return <PortalPlaceholder title="Attendance" portal="Student" />;
}

StudentAttendanceIndex.layout = {
    breadcrumbs: [{ title: 'Attendance', href }],
};
