export type DataTableFilterOption = {
    label: string;
    value: string;
};

export type DataTableServerFilter = {
    key: string;
    title: string;
    options: DataTableFilterOption[];
    value?: string;
};

export const ACTIVE_STATUS_FILTER_OPTIONS: DataTableFilterOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

export const SALE_STATUS_FILTER_OPTIONS: DataTableFilterOption[] = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Ordered', value: 'ordered' },
];

export const PAYMENT_STATUS_FILTER_OPTIONS: DataTableFilterOption[] = [
    { label: 'Paid', value: 'paid' },
    { label: 'Due', value: 'due' },
    { label: 'Partial', value: 'partial' },
];

export const ROLE_ASSIGNMENT_FILTER_OPTIONS: DataTableFilterOption[] = [
    { label: 'Assigned to users', value: 'assigned' },
    { label: 'Not assigned', value: 'unassigned' },
];

export const QUOTATION_STATUS_FILTER_OPTIONS: DataTableFilterOption[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
];

export const TRANSFER_STATUS_FILTER_OPTIONS: DataTableFilterOption[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
];

export type DataTableDateRangeFilter = {
    start_date?: string;
    end_date?: string;
};
