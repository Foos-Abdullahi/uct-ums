import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/finance/reports';

export default function FinanceReportsIndex() {
    return <PortalPlaceholder title="Reports" portal="Finance" />;
}

FinanceReportsIndex.layout = {
    breadcrumbs: [{ title: 'Reports', href }],
};
