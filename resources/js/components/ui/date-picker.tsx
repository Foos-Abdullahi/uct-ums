import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function formatDateValue(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export function parseDateValue(
    value: string | null | undefined,
): Date | undefined {
    if (!value) {
        return undefined
    }

    const clean = value.includes('T') ? value.split('T')[0] : value
    const parts = clean.split('-')

    if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const date = new Date(year, month, day)

        return Number.isNaN(date.getTime()) ? undefined : date
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDateDisplay(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export interface DatePickerProps {
    value?: string | null
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    id?: string
    className?: string
    maxDate?: Date
    minDate?: Date
}

function DatePicker({
    value,
    onChange,
    placeholder = "Select a date",
    disabled = false,
    id,
    className,
    maxDate,
    minDate,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    const selected = React.useMemo(() => parseDateValue(value), [value])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full h-9 justify-start rounded-md border-input bg-background px-3 py-1 text-sm font-normal shadow-sm",
                        !selected && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selected ? (
                        formatDateDisplay(selected)
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                        onChange(date ? formatDateValue(date) : "")
                        setOpen(false)
                    }}
                    disabled={(date) => {
                        if (maxDate && date > maxDate) {
                            return true
                        }

                        if (minDate && date < minDate) {
                            return true
                        }

                        return false
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

export { DatePicker }