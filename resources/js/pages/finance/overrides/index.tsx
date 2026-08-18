import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/finance/overrides';

export default function FinanceOverridesIndex() {
    return <PortalPlaceholder title="Fee Overrides" portal="Finance" />;
}

FinanceOverridesIndex.layout = {
    breadcrumbs: [{ title: 'Overrides', href }],
};
