import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

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
        className="h-9 w-9 cursor-pointer hover:text-black shadow-2xs"
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