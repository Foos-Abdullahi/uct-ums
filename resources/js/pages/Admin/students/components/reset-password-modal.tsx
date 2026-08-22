import React from 'react';
import { ResetPasswordModal as BaseResetPasswordModal } from '@/components/tools/reset-password-modal';
import type { Student } from '@/types/student';

export interface ResetPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
}

export function ResetPasswordModal({
    open,
    onOpenChange,
    student,
}: ResetPasswordModalProps) {
    if (!student) return null;

    return (
        <BaseResetPasswordModal
            open={open}
            onOpenChange={onOpenChange}
            resetUrl={`/admin/students/${student.id}/reset-password`}
            userName={student.user?.name}
            userIdentifier={student.matric_no}
            title="Reset Student Password"
            description="Set a new secure password for this student user account."
        />
    );
}

export default ResetPasswordModal;
