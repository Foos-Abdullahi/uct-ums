import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/finance/fee-structures';

export default function FinanceFeeStructuresIndex() {
    return <PortalPlaceholder title="Fee Structures" portal="Finance" />;
}

FinanceFeeStructuresIndex.layout = {
    breadcrumbs: [{ title: 'Fee Structures', href }],
};
