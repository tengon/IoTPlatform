'use client'

import {
  LayoutDashboard,
  Activity,
  Factory,
 Package,
  Clock,
  BarChart3,
  Zap,
  Gauge,
  Bell,
  CheckCircle,
  Settings,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Users,
  Building2,
  Shield,
  Cog,
} from 'lucide-react'
import { useNavigation, type PageId } from '@/store/navigation'
import { useIIoTStore } from '@/store/iiot'
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
  SidebarMenuBadge,
  SidebarSeparator,
} from '@/components/ui/sidebar'

interface MenuItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: number
  badgeVariant?: 'default' | 'destructive' | 'warning'
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'live-monitoring', label: 'Live Monitoring', icon: Activity },
      { id: 'assets-machines', label: 'Assets & Machines', icon: Factory },
      { id: 'production', label: 'Production', icon: Package },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { id: 'historical-data', label: 'Historical Data', icon: Clock },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'energy-monitoring', label: 'Energy Monitoring', icon: Zap },
      { id: 'oee', label: 'OEE', icon: Gauge },
    ],
  },
  {
    label: 'ALERTS',
    items: [
      { id: 'active-alarms', label: 'Active Alarms', icon: Bell, badgeVariant: 'destructive' },
      { id: 'alarm-history', label: 'Alarm History', icon: CheckCircle },
      { id: 'alert-rules', label: 'Alert Rules', icon: Settings },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
      { id: 'gateways', label: 'Gateways', icon: Radio },
      { id: 'firmware-ota', label: 'Firmware / OTA', icon: RefreshCw },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'sites', label: 'Sites', icon: Building2 },
      { id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
      { id: 'settings', label: 'Platform Settings', icon: Cog },
    ],
  },
]

export function AppSidebar() {
  const { currentPage, setCurrentPage } = useNavigation()
  const alarms = useIIoTStore((s) => s.alarms)
  const activeAlarmCount = alarms.filter((a) => a.status === 'active').length

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            II
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              INDUSTRIAL IOT
            </span>
            <span className="text-[10px] text-sidebar-foreground/50 tracking-widest uppercase">
              Monitoring Platform
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-2">
        {menuGroups.map((group, gi) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] tracking-widest uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  let badgeCount = item.badge
                  if (item.id === 'active-alarms') badgeCount = activeAlarmCount
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setCurrentPage(item.id)}
                        tooltip={item.label}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                        {badgeCount && badgeCount > 0 && (
                          <SidebarMenuBadge
                            className={
                              item.badgeVariant === 'destructive'
                                ? 'bg-destructive text-destructive-foreground'
                                : item.badgeVariant === 'warning'
                                  ? 'bg-amber-500 text-white'
                                  : ''
                            }
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {gi < menuGroups.length - 1 && <SidebarSeparator className="mt-1" />}
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/50 group-data-[collapsible=icon]:hidden">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-xs text-sidebar-foreground/70">System Online</span>
        </div>
      </SidebarFooter>
      <SidebarSeparator />
    </Sidebar>
  )
}
