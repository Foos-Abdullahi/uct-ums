import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

function NavGroupItem({ item }: { item: NavItem }) {
    const { t } = useTranslation();
    const { isCurrentUrl } = useCurrentUrl();
    const children = item.items ?? [];
    const isActive = children.some(
        (child) => child.href && isCurrentUrl(child.href),
    );
    const [open, setOpen] = useState(isActive);

    return (
        <Collapsible
            key={String(isActive)}
            open={open}
            onOpenChange={setOpen}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={{ children: t(item.title) }}>
                        {item.icon && <item.icon />}
                        <span>{t(item.title)}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={
                                        child.href
                                            ? isCurrentUrl(child.href)
                                            : false
                                    }
                                >
                                    <Link href={child.href!} prefetch>
                                        <span>{t(child.title)}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

function NavLinkItem({ item }: { item: NavItem }) {
    const { t } = useTranslation();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={item.href ? isCurrentUrl(item.href) : false}
                tooltip={{ children: t(item.title) }}
            >
                <Link href={item.href!} prefetch>
                    {item.icon && <item.icon />}
                    <span>{t(item.title)}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { t } = useTranslation();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{t('nav_platform')}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.items?.length ? (
                        <NavGroupItem key={item.title} item={item} />
                    ) : (
                        <NavLinkItem key={item.title} item={item} />
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
