'use client';

import * as React from 'react';

import { useMe } from '@/features/me/hooks/useMe';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    sidebarItems,
    sidebarProjects,
    sidebarTeams,
} from '@/config/sidebar.config';
import { Skeleton } from './ui/skeleton';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: user, isLoading } = useMe();

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={sidebarTeams} />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={sidebarItems} />
                {/* <NavProjects projects={sidebarProjects} /> */}
            </SidebarContent>

            <SidebarFooter>
                {isLoading ? (
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[180px]" />
                            <Skeleton className="h-4 w-[160px]" />
                        </div>
                    </div>
                ) : user ? (
                    <NavUser user={user} />
                ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                        尚未登入
                    </div>
                )}
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
