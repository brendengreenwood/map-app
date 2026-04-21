import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Map, LayoutDashboard, Settings, Shield, Sun, Moon, Monitor, Wheat, Building2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { UserSwitcher } from '@/components/user-switcher';
import { useUsers } from '@/hooks/use-users';
import type { Theme } from '@/hooks/use-users';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Map', path: '/map', icon: Map },
  { title: 'Producers', path: '/producers', icon: Wheat },
  { title: 'Competitors', path: '/competitors', icon: Building2 },
  { title: 'Admin', path: '/admin', icon: Shield, adminOnly: true },
  { title: 'Settings', path: '/settings', icon: Settings },
];

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];
const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const THEME_LABEL = { light: 'Light', dark: 'Dark', system: 'System' } as const;

function ThemeToggle() {
  const { activeUser, updatePreferences } = useUsers();
  const current = activeUser.preferences.theme ?? 'system';
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length];
  const Icon = THEME_ICON[current];

  return (
    <SidebarMenuButton
      tooltip={`Theme: ${THEME_LABEL[current]}`}
      onClick={() => updatePreferences({ theme: next })}
    >
      <Icon />
      <span>{THEME_LABEL[current]}</span>
    </SidebarMenuButton>
  );
}

export function AppShell() {
  const { activeUser } = useUsers();
  const isAdmin = activeUser.types.includes('admin');
  const { pathname } = useLocation();

  return (
    <SidebarProvider defaultOpen={false}>
      {/* Desktop sidebar — slides in from left when returning from map */}
      <Sidebar collapsible="icon" className="animate-in slide-in-from-left duration-300">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="Map App">
                <NavLink to="/">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Map className="!size-4" />
                  </div>
                  <span className="truncate font-semibold">Map App</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems
                  .filter((item) => !('adminOnly' in item && item.adminOnly) || isAdmin)
                  .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                        }
                        end={item.path === '/'}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeToggle />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <UserSwitcher />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main content */}
      <SidebarInset className="flex flex-col">
        {/* Top bar — only shows trigger + breadcrumb on desktop */}
        <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3 md:h-12 animate-in slide-in-from-top duration-300">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <span className="text-sm font-medium text-muted-foreground">Map App</span>
        </header>

        {/* Page content — key on pathname to re-trigger entrance animation on nav */}
        <main key={pathname} className="flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
