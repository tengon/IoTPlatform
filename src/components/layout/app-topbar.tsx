'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Wifi,
  WifiOff,
  User,
  ChevronDown,
  Moon,
  Sun,
  RefreshCw,
  Command,
} from 'lucide-react'
import { useNavigation } from '@/store/navigation'
import { useIIoTStore } from '@/store/iiot'
import { useTheme } from 'next-themes'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { NotificationPanel } from '@/components/layout/notification-panel'
import { ActivityFeed } from '@/components/layout/activity-feed'
import { GlobalFilters } from '@/shared/components/global-filters'
import { formatDistanceToNow } from 'date-fns'

const pageLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  availability: 'Availability',
  performance: 'Performance',
  quality: 'Quality',
  'live-monitoring': 'Live Monitoring',
  'assets-machines': 'Assets & Machines',
  production: 'Production',
  maintenance: 'Maintenance',
  'historical-data': 'Historical Data',
  analytics: 'Analytics',
  'energy-monitoring': 'Energy Monitoring',
  oee: 'OEE',
  reports: 'Reports',
  'active-alarms': 'Active Alarms',
  'alarm-history': 'Alarm History',
  'alert-rules': 'Alert Rules',
  devices: 'Devices',
  gateways: 'Gateways',
  'firmware-ota': 'Firmware / OTA',
  users: 'Users',
  sites: 'Sites',
  'roles-permissions': 'Roles & Permissions',
  diagnostics: 'Diagnostics',
  'audit-log': 'Audit Log',
  settings: 'Platform Settings',
}

const groupLabels: Record<string, string> = {
  dashboard: 'Overview',
  availability: 'Dashboard',
  performance: 'Dashboard',
  quality: 'Dashboard',
  'live-monitoring': 'Operations',
  'assets-machines': 'Operations',
  production: 'Operations',
  maintenance: 'Operations',
  'historical-data': 'Analytics',
  analytics: 'Analytics',
  'energy-monitoring': 'Analytics',
  oee: 'Analytics',
  reports: 'Analytics',
  'active-alarms': 'Alerts',
  'alarm-history': 'Alerts',
  'alert-rules': 'Alerts',
  devices: 'Management',
  gateways: 'Management',
  'firmware-ota': 'Management',
  users: 'Administration',
  sites: 'Administration',
  'roles-permissions': 'Administration',
  diagnostics: 'Administration',
  'audit-log': 'Administration',
  settings: 'Administration',
}

export function AppTopbar() {
  const { currentPage } = useNavigation()
  const { isConnected, lastUpdate } = useIIoTStore()
  const { theme, setTheme } = useTheme()
  const [lastSyncText, setLastSyncText] = useState('—')
  const [searchFocused, setSearchFocused] = useState(false)
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration guard pattern
  useEffect(() => { setMounted(true) }, [])

  // Update "last synced" text every 10 seconds
  useEffect(() => {
    function update() {
      if (lastUpdate) {
        setLastSyncText(formatDistanceToNow(new Date(lastUpdate), { addSuffix: true }))
      }
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4">
      <SidebarTrigger className="-ml-1 hover:bg-muted/50" />

      <Separator orientation="vertical" className="h-5 opacity-50" />

      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="text-muted-foreground hover:text-foreground transition-colors text-xs">
              {groupLabels[currentPage] || 'Overview'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-medium">{pageLabels[currentPage] || 'Dashboard'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Global Filters (Factory + Time Range) */}
      <div className="hidden lg:flex">
        <GlobalFilters />
      </div>

      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
        {/* Search Bar */}
        <div className={`hidden md:flex relative transition-all duration-200 search-bar-topbar ${searchFocused ? 'w-80' : 'w-64'}`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search devices, machines, alarms..."
            className="h-8 pl-8 pr-8 text-xs bg-muted/30 border-border/40 focus-visible:bg-muted/50 focus-visible:border-primary/30 transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground/60">
            <Command className="size-2.5" />K
          </kbd>
        </div>

        {/* Last Synced */}
        <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-colors whitespace-nowrap ${isConnected ? 'text-muted-foreground/80 bg-muted/30' : 'text-destructive bg-destructive/5'}`}>
          <RefreshCw className={`size-3 flex-shrink-0 ${isConnected ? 'animate-spin' : ''} style={isConnected ? { animationDuration: '3s' } : {}}`} />
          <span className="font-medium">{isConnected ? lastSyncText : 'Reconnecting...'}</span>
        </div>

        <Separator orientation="vertical" className="h-5 opacity-30 mx-0.5 hidden xl:block" />

        {/* Connection Status */}
        <div
          className={`topbar-status-cluster flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 whitespace-nowrap ${
            isConnected
              ? 'text-emerald-400 bg-emerald-500/5'
              : 'text-red-400 bg-red-500/5'
          }`}
        >
          {isConnected ? (
            <Wifi className="size-3.5" />
          ) : (
            <WifiOff className="size-3.5" />
          )}
          <span className="hidden lg:inline">{isConnected ? 'Live' : 'Offline'}</span>
          {isConnected && (
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          )}
        </div>

        {/* Notification Panel */}
        <NotificationPanel />

        {/* Activity Feed */}
        <ActivityFeed />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          suppressHydrationWarning
        >
          {mounted
            ? (theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />)
            : <Sun className="size-4" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-2 px-2 hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-6 w-6 ring-1 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-xs font-medium">Admin</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-card/95 backdrop-blur-xl border-border/60"
          >
            <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2 focus:bg-muted/50">
              <User className="size-3.5" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2 focus:bg-muted/50"
              onClick={() => useNavigation.getState().setCurrentPage('settings')}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2 text-destructive focus:bg-destructive/10">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
