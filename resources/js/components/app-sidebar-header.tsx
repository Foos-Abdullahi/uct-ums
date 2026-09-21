import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import AppearanceToggleButton from './tools/AppearanceToggleButton';
import { useLanguage } from '@/contexts/LanguageContext';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { language, setLanguage } = useLanguage();

    return (
        <header className="flex h-18 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-2">
                {/* Language Selector */}
                <Select
                    value={language}
                    onValueChange={(value) =>
                        setLanguage(value as 'en' | 'ar')
                    }
                >
                    <SelectTrigger className="w-[130px]">
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="en">
                            English
                        </SelectItem>

                        <SelectItem value="ar">
                            العربية
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* Appearance */}
                <AppearanceToggleButton />
            </div>
        </header>
    );
}