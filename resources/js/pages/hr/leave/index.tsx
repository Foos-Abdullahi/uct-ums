import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/hr/leave';

export default function HrLeaveIndex() {
    return <PortalPlaceholder title="Leave" portal="HR" />;
}

HrLeaveIndex.layout = {
    breadcrumbs: [{ title: 'Leave', href }],
};
