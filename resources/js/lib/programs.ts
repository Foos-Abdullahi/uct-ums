/** Degree levels a program can be offered at. */
export const DEGREE_LEVELS = [
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'doctorate', label: 'Doctorate (Ph.D.)' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'certificate', label: 'Certificate' },
] as const;

export type DegreeLevel = (typeof DEGREE_LEVELS)[number]['value'];

/** Degree levels whose duration is counted in months rather than semesters. */
const MONTH_BASED_DEGREE_LEVELS: DegreeLevel[] = ['certificate'];

export function degreeLevelLabel(value: string): string {
    return (
        DEGREE_LEVELS.find((level) => level.value === value)?.label ?? value
    );
}

/**
 * Whether a program's duration is expressed in months. Short certificate
 * programs are measured in months; every other level uses semesters.
 */
export function isMonthBasedDuration(degreeLevel: string): boolean {
    return MONTH_BASED_DEGREE_LEVELS.includes(degreeLevel as DegreeLevel);
}

/** Unit name for a program's duration, e.g. "Semesters" or "Months". */
export function durationUnit(degreeLevel: string): string {
    return isMonthBasedDuration(degreeLevel) ? 'Months' : 'Semesters';
}

/** Singular unit name, e.g. "Semester" or "Month". */
export function durationUnitSingular(degreeLevel: string): string {
    return isMonthBasedDuration(degreeLevel) ? 'Month' : 'Semester';
}

/** Inclusive bounds for a program's duration, in its own unit. */
export function durationBounds(degreeLevel: string): {
    min: number;
    max: number;
    placeholder: string;
} {
    return isMonthBasedDuration(degreeLevel)
        ? { min: 1, max: 72, placeholder: '6' }
        : { min: 1, max: 16, placeholder: '8' };
}

/** Form values shared by the program create and edit screens. */
export type ProgramFormValues = {
    name: string;
    code: string;
    degree_level: string;
    duration_semesters: number | '';
    total_credits: number | '';
    department: string;
    faculty: string;
    status: string;
    description: string;
};
