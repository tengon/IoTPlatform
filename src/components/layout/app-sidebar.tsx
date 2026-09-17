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
  Wrench,
  Users,
  Building2,
  Shield,
  Cog,
  HeartPulse,
  FileText,
  ScrollText,
  ChevronRight,
  CircleDot,
  TrendingUp,
  ShieldCheck,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface MenuItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: number
  badgeVariant?: 'default' | 'destructive' | 'warning'
  subItems?: { id: PageId; label: string; icon: React.ElementType }[]
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        subItems: [
          { id: 'availability', label: 'Availability', icon: CircleDot },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'quality', label: 'Quality', icon: ShieldCheck },
        ],
      },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'live-monitoring', label: 'Live Monitoring', icon: Activity },
      { id: 'assets-machines', label: 'Assets & Machines', icon: Factory },
      { id: 'production', label: 'Production', icon: Package },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { id: 'historical-data', label: 'Historical Data', icon: Clock },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'energy-monitoring', label: 'Energy Monitoring', icon: Zap },
      { id: 'oee', label: 'OEE', icon: Gauge },
      { id: 'reports', label: 'Reports', icon: FileText },
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
      { id: 'audit-log', label: 'Audit Log', icon: ScrollText },
      { id: 'diagnostics', label: 'Diagnostics', icon: HeartPulse },
      { id: 'settings', label: 'Platform Settings', icon: Cog },
    ],
  },
]

// Check if a pageId is a sub-item of Dashboard
const DASHBOARD_SUB_IDS: PageId[] = ['availability', 'performance', 'quality']

export function AppSidebar() {
  const { currentPage, setCurrentPage } = useNavigation()
  const alarms = useIIoTStore((s) => s.alarms)
  const activeAlarmCount = alarms.filter((a) => a.status === 'active').length

  // Determine if the dashboard group should be open (any sub-item is active)
  const isDashboardOpen = currentPage === 'dashboard' || DASHBOARD_SUB_IDS.includes(currentPage)

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
          <SidebarGroup key={group.label} className={gi > 0 ? 'mt-1' : ''}>
            <SidebarGroupLabel className="text-[10px] tracking-widest uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  const isSubActive = item.subItems?.some((sub) => sub.id === currentPage)
                  let badgeCount = item.badge
                  if (item.id === 'active-alarms') badgeCount = activeAlarmCount

                  // Items with sub-items: render as collapsible
                  if (item.subItems && item.subItems.length > 0) {
                    return (
                      <Collapsible
                        key={item.id}
                        defaultOpen={isSubActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isActive || isSubActive}
                              onClick={() => setCurrentPage(item.id)}
                              tooltip={item.label}
                              className={(isActive || isSubActive) ? 'border-l-2 border-l-primary' : ''}
                            >
                              <Icon className="size-4" />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((sub) => {
                                const SubIcon = sub.icon
                                const isSubItemActive = currentPage === sub.id
                                return (
                                  <SidebarMenuSubItem key={sub.id}>
                                    <SidebarMenuSubButton
                                      isActive={isSubItemActive}
                                      onClick={() => setCurrentPage(sub.id)}
                                      className={isSubItemActive ? 'font-semibold' : ''}
                                    >
                                      <SubIcon className="size-3.5" />
                                      <span>{sub.label}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  // Regular items without sub-items
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setCurrentPage(item.id)}
                        tooltip={item.label}
                        className={isActive ? 'border-l-2 border-l-primary' : ''}
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
