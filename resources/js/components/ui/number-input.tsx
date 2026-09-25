import * as React from 'react';
import { cn } from '@/lib/utils';

type NumberInputProps = Omit<
    React.ComponentProps<'input'>,
    'onChange' | 'value' | 'type'
> & {
    /** Current value, or an empty string when the field has been cleared. */
    value: number | '';
    onValueChange: (value: number | '') => void;
    /** Smallest accepted value. Zero and negatives are never accepted. */
    min?: number;
    /** Largest accepted value. */
    max?: number;
};

/**
 * Positive integer input.
 *
 * Zero, negative values and decimals are rejected as they are typed, so the
 * field can only ever hold a whole number of at least `min`. Clearing the
 * field leaves it empty rather than snapping back to a default.
 *
 * The native stepper arrows are hidden on pointer-precise devices and restored
 * on touch devices via the `uct-number-input` class, where they are the
 * quickest way to nudge a value.
 */
function NumberInput({
    className,
    value,
    onValueChange,
    min = 1,
    max,
    onKeyDown,
    ...props
}: NumberInputProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const digits = event.target.value.replace(/\D/g, '');

        if (digits === '') {
            onValueChange('');

            return;
        }

        const parsed = Number(digits);
        const lower = Math.max(parsed, min);
        const upper = max === undefined ? lower : Math.min(lower, max);

        onValueChange(upper);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Block the characters a numeric keypad would otherwise allow here.
        if (['e', 'E', '+', '-', '.'].includes(event.key)) {
            event.preventDefault();
        }

        onKeyDown?.(event);
    };

    return (
        <input
            {...props}
            type="number"
            inputMode="numeric"
            step={1}
            min={min}
            max={max}
            data-slot="number-input"
            className={cn(
                'uct-number-input border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
}

export { NumberInput };
