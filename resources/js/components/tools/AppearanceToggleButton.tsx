import { Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';

export default function AppearanceToggleButton({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const toggleAppearance = () => {
        if (appearance === 'dark') {
            updateAppearance('light');
        } else {
            updateAppearance('dark');
        }
    };

    return (
        <div className={className} {...props}>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer shadow-2xs hover:text-black"
                onClick={toggleAppearance}
            >
                {appearance === 'dark' ? (
                    <Moon className="h-5 w-5" />
                ) : (
                    <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    );
}
