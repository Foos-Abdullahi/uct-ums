import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/student/fees';

export default function StudentFeesIndex() {
    return (
        <PortalPlaceholder
            title="Fees & Payments"
            portal="Student"
            description="View your balance and pay outstanding fees."
        />
    );
}

StudentFeesIndex.layout = {
    breadcrumbs: [{ title: 'Fees', href }],
};
