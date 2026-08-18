import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/lecturer/attendance';

export default function LecturerAttendanceIndex() {
    return <PortalPlaceholder title="Attendance" portal="Lecturer" />;
}

LecturerAttendanceIndex.layout = {
    breadcrumbs: [{ title: 'Attendance', href }],
};
