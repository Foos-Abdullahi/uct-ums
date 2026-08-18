import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/finance/payments';

export default function FinancePaymentsIndex() {
    return <PortalPlaceholder title="Payments" portal="Finance" />;
}

FinancePaymentsIndex.layout = {
    breadcrumbs: [{ title: 'Payments', href }],
};
