import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/hr/staff';

export default function HrStaffIndex() {
    return <PortalPlaceholder title="Staff" portal="HR" />;
}

HrStaffIndex.layout = {
    breadcrumbs: [{ title: 'Staff', href }],
};
