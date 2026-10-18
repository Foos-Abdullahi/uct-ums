import { Clock3, MapPin, UserRound } from 'lucide-react';

export interface TimetableEntry {
    id: number;
    course_code: string;
    course_name: string;
    lecturer_name?: string | null;
    program_name?: string | null;
    section: string;
    room: string;
    weekday: string;
    start_time: string;
    end_time: string;
}

const weekdays = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
];

const shortTime = (time: string) => time.slice(0, 5);

export function WeeklyTimetable({ entries }: { entries: TimetableEntry[] }) {
    return (
        <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[1050px] grid-cols-7 gap-3">
                {weekdays.map((weekday) => {
                    const sessions = entries
                        .filter((entry) => entry.weekday === weekday)
                        .sort((first, second) =>
                            first.start_time.localeCompare(second.start_time),
                        );

                    return (
                        <section
                            key={weekday}
                            className="min-h-52 rounded-lg border border-border/60 bg-muted/25 p-2.5"
                        >
                            <h3 className="mb-2 border-b border-border/60 pb-2 text-center text-xs font-bold text-foreground">
                                {weekday}
                            </h3>
                            <div className="space-y-2">
                                {sessions.length > 0 ? (
                                    sessions.map((session) => (
                                        <article
                                            key={session.id}
                                            className="rounded-md border border-primary/15 bg-card p-2.5 shadow-xs"
                                        >
                                            <p className="text-xs font-bold text-primary">
                                                {session.course_code}
                                            </p>
                                            <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-foreground">
                                                {session.course_name}
                                            </p>
                                            <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                                                <p className="flex items-center gap-1">
                                                    <Clock3 className="size-3" />
                                                    {shortTime(session.start_time)}–
                                                    {shortTime(session.end_time)}
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <MapPin className="size-3" />
                                                    {session.room}
                                                </p>
                                                {session.lecturer_name && (
                                                    <p className="flex items-center gap-1">
                                                        <UserRound className="size-3" />
                                                        <span className="truncate">
                                                            {session.lecturer_name}
                                                        </span>
                                                    </p>
                                                )}
                                                <p>{session.section}</p>
                                                {session.program_name && (
                                                    <p className="line-clamp-2">
                                                        {session.program_name}
                                                    </p>
                                                )}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-[10px] text-muted-foreground">
                                        No sessions
                                    </p>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
