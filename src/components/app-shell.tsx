import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  mdiMap, mdiViewDashboardOutline, mdiCogOutline, mdiShieldOutline,
  mdiWeatherSunny, mdiWeatherNight, mdiMonitor, mdiBarley, mdiOfficeBuilding,
  mdiChartTimelineVariant, mdiArrowLeft, mdiSelectionDrag,
} from '@mdi/js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,

  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserSwitcher } from '@/components/user-switcher';
import { useUsers } from '@/hooks/use-users';
import type { Theme } from '@/hooks/use-users';

const navItems = [
  { title: 'Dashboard', path: '/', icon: mdiViewDashboardOutline },
  { title: 'Map', path: '/map', icon: mdiMap },
  { title: 'Map Selection', path: '/map/selection', icon: mdiSelectionDrag },
  { title: 'Producers', path: '/producers', icon: mdiBarley },
  { title: 'Competitors', path: '/competitors', icon: mdiOfficeBuilding },
  { title: 'Scenarios', path: '/bids', icon: mdiChartTimelineVariant },
  { title: 'Admin', path: '/admin', icon: mdiShieldOutline, adminOnly: true },
  { title: 'Settings', path: '/settings', icon: mdiCogOutline },
];

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];
const THEME_ICON = { light: mdiWeatherSunny, dark: mdiWeatherNight, system: mdiMonitor } as const;
const THEME_LABEL = { light: 'Light', dark: 'Dark', system: 'System' } as const;

function ThemeToggle() {
  const { activeUser, updatePreferences } = useUsers();
  const current = activeUser.preferences.theme ?? 'system';
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length];
  const themeIcon = THEME_ICON[current];

  return (
    <SidebarMenuButton
      tooltip={`Theme: ${THEME_LABEL[current]}`}
      onClick={() => updatePreferences({ theme: next })}
    >
      <Icon path={themeIcon} />
      <span>{THEME_LABEL[current]}</span>
    </SidebarMenuButton>
  );
}

function BackButton() {
  const navigate = useNavigate();
  // Re-evaluate on every location change so the disabled state stays in sync.
  useLocation();
  // history.state.idx is maintained by react-router; 0 means no prior entry.
  const idx = (window.history.state && typeof window.history.state.idx === 'number')
    ? window.history.state.idx
    : 0;
  const canGoBack = idx > 0;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label="Back"
      disabled={!canGoBack}
      onClick={() => navigate(-1)}
    >
      <Icon path={mdiArrowLeft} />
    </Button>
  );
}

function NavItem({ item }: { item: typeof navItems[number] }) {
  const match = useMatch(item.path === '/' ? '/' : `${item.path}/*`);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <NavLink to={item.path}>
            <Icon path={item.icon} />
            <span>{item.title}</span>
          </NavLink>
        }
        isActive={!!match}
        tooltip={item.title}
      />
    </SidebarMenuItem>
  );
}

export function AppShell() {
  const { activeUser } = useUsers();
  const isAdmin = activeUser.types.includes('admin');
  const { pathname } = useLocation();
  const isMapRoute = pathname === "/map" || pathname.startsWith("/map/");

  return (
    <SidebarProvider defaultOpen={false}>
      {/* Desktop sidebar — hidden on map routes for an immersive view */}
      {!isMapRoute && (
      <Sidebar collapsible="icon" className="animate-in slide-in-from-left duration-300">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="default"
                tooltip="Map App"
                render={
                  <NavLink to="/">
                    <Icon path={mdiMap} className="!size-5 -ml-0.5 text-primary" />
                    <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">Map App</span>
                  </NavLink>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>

            <SidebarGroupContent>
              <SidebarMenu>
                {navItems
                  .filter((item) => !('adminOnly' in item && item.adminOnly) || isAdmin)
                  .map((item) => (
                  <NavItem key={item.path} item={item} />
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
      )}

      {/* Main content */}
      <SidebarInset className="flex flex-col overflow-hidden">
        {/* Top bar — only shows trigger + breadcrumb on desktop */}
        <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3 md:h-12 animate-in slide-in-from-top duration-300">
          {!isMapRoute && <SidebarTrigger className="-ml-1" />}
          <BackButton />
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
