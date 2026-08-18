import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/finance/invoices';

export default function FinanceInvoicesIndex() {
    return <PortalPlaceholder title="Invoices" portal="Finance" />;
}

FinanceInvoicesIndex.layout = {
    breadcrumbs: [{ title: 'Invoices', href }],
};
