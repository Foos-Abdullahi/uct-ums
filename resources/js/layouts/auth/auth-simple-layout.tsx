import { useAppearance } from '@/hooks/use-appearance';
import uctLogo from '@/components/images/uct-logo__white-02.svg';
import uctLogoDark from '@/components/images/uct-logo__white-01.svg';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { appearance } = useAppearance();

    const logo = appearance === 'dark' ? uctLogoDark : uctLogo;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-sidebar p-6 text-foreground md:p-10">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                <div className="relative rounded-xl border border-primary/20 bg-card p-6 text-card-foreground shadow-lg transition-all duration-300 hover:border-primary/40 hover:shadow-xl md:p-10">
                    {/* Subtle primary accent line */}
                    <div className="absolute inset-x-10 top-0 h-px bg-primary/50" />

                    <div className="mb-8 flex flex-col items-center gap-5 text-center">
                        <div className="flex items-center justify-center transition-transform duration-500 hover:scale-105">
                            <img
                                src={logo}
                                alt="UCT Management Logo"
                                className="h-16 w-auto object-contain"
                            />
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-primary">
                                {title}
                            </h1>

                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}