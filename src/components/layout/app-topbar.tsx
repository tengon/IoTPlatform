'use client'

import { Bell, Search, Wifi, WifiOff, User, ChevronDown, Moon, Sun } from 'lucide-react'
import { useNavigation } from '@/store/navigation'
import { useIIoTStore } from '@/store/iiot'
import { useTheme } from 'next-themes'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

const pageLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'live-monitoring': 'Live Monitoring',
  'assets-machines': 'Assets & Machines',
  production: 'Production',
  'historical-data': 'Historical Data',
  analytics: 'Analytics',
  'energy-monitoring': 'Energy Monitoring',
  oee: 'OEE',
  'active-alarms': 'Active Alarms',
  'alarm-history': 'Alarm History',
  'alert-rules': 'Alert Rules',
  devices: 'Devices',
  gateways: 'Gateways',
  'firmware-ota': 'Firmware / OTA',
  users: 'Users',
  sites: 'Sites',
  'roles-permissions': 'Roles & Permissions',
  settings: 'Platform Settings',
}

const groupLabels: Record<string, string> = {
  dashboard: 'Overview',
  'live-monitoring': 'Operations',
  'assets-machines': 'Operations',
  production: 'Operations',
  'historical-data': 'Analytics',
  analytics: 'Analytics',
  'energy-monitoring': 'Analytics',
  oee: 'Analytics',
  'active-alarms': 'Alerts',
  'alarm-history': 'Alerts',
  'alert-rules': 'Alerts',
  devices: 'Management',
  gateways: 'Management',
  'firmware-ota': 'Management',
  users: 'Administration',
  sites: 'Administration',
  'roles-permissions': 'Administration',
  settings: 'Administration',
}

export function AppTopbar() {
  const { currentPage } = useNavigation()
  const { isConnected, alarms } = useIIoTStore()
  const { theme, setTheme } = useTheme()
  const activeAlarms = alarms.filter((a) => a.status === 'active')
  const criticalAlarms = activeAlarms.filter((a) => a.severity === 'critical')

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-md px-4">
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="h-5" />

      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="text-muted-foreground hover:text-foreground">
              {groupLabels[currentPage] || 'Overview'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabels[currentPage] || 'Dashboard'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search devices, machines, alarms..."
            className="h-8 w-64 pl-8 text-sm bg-muted/50 border-border/50"
          />
        </div>

        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${isConnected ? 'text-emerald-400' : 'text-destructive'}`}>
          {isConnected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          <span className="hidden lg:inline">{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={() => useNavigation.getState().setCurrentPage('active-alarms')}
        >
          <Bell className="size-4" />
          {activeAlarms.length > 0 && (
            <Badge
              className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] ${criticalAlarms.length > 0 ? 'bg-destructive' : 'bg-amber-500'}`}
            >
              {activeAlarms.length}
            </Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">AD</AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm">Admin</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => useNavigation.getState().setCurrentPage('settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
