
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  HardHat,
  Settings,
  Users,
  Bell
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import type { User } from '@/lib/types';

type MainNavProps = {
  role: User['role'];
};

export function MainNav({ role }: MainNavProps) {
  const pathname = usePathname();

  const allMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart, roles: ['Admin', 'Senior', 'Engineer'] },
    { href: '/jobs', label: 'Jobs', icon: HardHat, roles: ['Admin', 'Senior', 'Engineer'] },
    { href: '/engineers', label: 'Engineers', icon: Users, roles: ['Admin', 'Senior', 'Engineer'] },
    { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['Admin', 'Senior', 'Engineer'] },
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Senior', 'Engineer'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {menuItems.map(({ href, label, icon: Icon }) => (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild tooltip={label} isActive={pathname.startsWith(href)}>
              <Link href={href}>
                <Icon />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
