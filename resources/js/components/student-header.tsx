import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { studentNav } from '@/config/navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const activeItemStyles = 'bg-primary text-primary-foreground shadow-sm';

export function StudentHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    return (
        <>
            <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-background/95 shadow-sm backdrop-blur dark:border-border">
                <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center px-4 sm:px-6">
                    <div className="xl:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 size-10 rounded-xl"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-72 flex-col"
                            >
                                <SheetTitle className="sr-only">
                                    Student navigation
                                </SheetTitle>
                                <SheetHeader className="border-b px-2 pb-5 text-left">
                                    <AppLogo />
                                </SheetHeader>
                                <nav className="flex flex-col gap-1 p-4">
                                    {studentNav.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                    'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                ),
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="size-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href="/student/dashboard"
                        prefetch
                        className="flex items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    <div className="ml-8 hidden h-full items-center xl:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-1">
                                {studentNav.map((item) => (
                                    <NavigationMenuItem
                                        key={item.title}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                ),
                                                'h-10 cursor-pointer rounded-xl px-3 text-sm font-medium transition-all',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {isCurrentUrl(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary" />
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="hidden text-right sm:block">
                            <p className="max-w-40 truncate text-sm font-semibold">
                                {auth.user?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Student portal
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-xl border border-border/70 bg-muted/40 p-1 hover:bg-muted"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-lg">
                                        <AvatarImage
                                            src={auth.user?.avatar}
                                            alt={auth.user?.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                            {getInitials(auth.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                {auth.user && (
                                    <UserMenuContent user={auth.user} />
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <ol className="flex gap-2 text-sm">
                            {breadcrumbs.map((item, index) => (
                                <li key={index}>
                                    {index < breadcrumbs.length - 1 ? (
                                        <Link
                                            href={item.href}
                                            className="hover:text-foreground"
                                        >
                                            {item.title}
                                        </Link>
                                    ) : (
                                        <span>{item.title}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}
        </>
    );
}
