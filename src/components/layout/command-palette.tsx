'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Search,
  Command as CommandIcon,
  Monitor,
  AlertTriangle,
  Wrench,
  FileText,
  History,
  CircleDot,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNavigation, type PageId } from '@/store/navigation'
import { useIIoTStore, type MachineStatus } from '@/store/iiot'
import { MachineDetailDialog } from '@/shared/components/machine-detail-dialog'

// All 21 pages with their icons
const PAGE_ITEMS: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'availability', label: 'Availability', icon: CircleDot },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'quality', label: 'Quality', icon: ShieldCheck },
  { id: 'live-monitoring', label: 'Live Monitoring', icon: Activity },
  { id: 'assets-machines', label: 'Assets & Machines', icon: Factory },
  { id: 'production', label: 'Production', icon: Package },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'historical-data', label: 'Historical Data', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'energy-monitoring', label: 'Energy Monitoring', icon: Zap },
  { id: 'oee', label: 'OEE', icon: Gauge },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'active-alarms', label: 'Active Alarms', icon: Bell },
  { id: 'alarm-history', label: 'Alarm History', icon: CheckCircle },
  { id: 'alert-rules', label: 'Alert Rules', icon: Settings },
  { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
  { id: 'gateways', label: 'Gateways', icon: Radio },
  { id: 'firmware-ota', label: 'Firmware / OTA', icon: RefreshCw },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sites', label: 'Sites', icon: Building2 },
  { id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
  { id: 'settings', label: 'Platform Settings', icon: Cog },
]

const STATUS_COLORS: Record<string, string> = {
  running: 'text-emerald-400',
  idle: 'text-amber-400',
  maintenance: 'text-slate-400',
  error: 'text-red-400',
  online: 'text-emerald-400',
  offline: 'text-muted-foreground',
  warning: 'text-amber-400',
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-cyan-500',
}

const MAX_RECENT = 5

function getRecentPages(): PageId[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('iiot-recent-pages') || '[]')
  } catch { return [] }
}

function addRecentPage(pageId: PageId) {
  try {
    const recent = getRecentPages().filter(p => p !== pageId)
    recent.unshift(pageId)
    localStorage.setItem('iiot-recent-pages', JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch { /* ignore */ }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<MachineStatus | null>(null)
  const [machineDetailOpen, setMachineDetailOpen] = useState(false)
  const [recentPages, setRecentPages] = useState<PageId[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('iiot-recent-pages') || '[]') } catch { return [] }
  })
  const { currentPage, setCurrentPage } = useNavigation()
  const machines = useIIoTStore((s) => s.machines)
  const devices = useIIoTStore((s) => s.devices)
  const alarms = useIIoTStore((s) => s.alarms)
  const activeAlarms = alarms.filter((a) => a.status === 'active').slice(0, 10)

  // Mock data for command palette search groups
  const mockProductionOrders = [
    { id: 'PO-2401', product: 'Widget A', status: 'in_progress', quantity: 5000, completed: 3200 },
    { id: 'PO-2402', product: 'Widget B', status: 'completed', quantity: 3000, completed: 3000 },
    { id: 'PO-2403', product: 'Part C-7', status: 'in_progress', quantity: 8000, completed: 1500 },
    { id: 'PO-2404', product: 'Assembly D', status: 'paused', quantity: 2000, completed: 800 },
    { id: 'PO-2405', product: 'Module E-2', status: 'in_progress', quantity: 12000, completed: 9500 },
  ]

  const mockSites = [
    { id: 'SITE-001', name: 'Main Factory - Shanghai', devices: 124, machines: 32 },
    { id: 'SITE-002', name: 'Assembly Plant - Suzhou', devices: 86, machines: 18 },
    { id: 'SITE-003', name: 'Warehouse - Hangzhou', devices: 42, machines: 8 },
    { id: 'SITE-004', name: 'R&D Center - Beijing', devices: 28, machines: 5 },
  ]

  const mockUsers = [
    { id: 'USR-001', name: 'Ahmad Darmawan', role: 'Administrator', status: 'active' },
    { id: 'USR-002', name: 'Budi Santoso', role: 'Engineer', status: 'active' },
    { id: 'USR-003', name: 'Chen Wei', role: 'Operator', status: 'active' },
    { id: 'USR-004', name: 'Diana Putri', role: 'Supervisor', status: 'inactive' },
    { id: 'USR-005', name: 'Eko Prasetyo', role: 'Manager', status: 'active' },
  ]

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  const handlePageSelect = (pageId: PageId) => {
    setOpen(false)
    setCurrentPage(pageId)
    addRecentPage(pageId)
  }

  const handleMachineSelect = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId)
    if (machine) {
      setOpen(false)
      setSelectedMachine(machine)
      setMachineDetailOpen(true)
    }
  }

  const handleDeviceSelect = () => {
    setOpen(false)
    setCurrentPage('devices')
  }

  const handleAlarmSelect = () => {
    setOpen(false)
    setCurrentPage('active-alarms')
  }

  const handleProductionSelect = () => {
    setOpen(false)
    setCurrentPage('production')
  }

  const handleSiteSelect = () => {
    setOpen(false)
    setCurrentPage('sites')
  }

  const handleUserSelect = () => {
    setOpen(false)
    setCurrentPage('users')
  }

  const hasMachines = machines.length > 0
  const hasDevices = devices.length > 0
  const hasAlarms = activeAlarms.length > 0

  const ORDER_STATUS_COLORS: Record<string, string> = {
    in_progress: 'text-emerald-400',
    completed: 'text-cyan-400',
    paused: 'text-amber-400',
  }

  const USER_STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-400',
    inactive: 'text-muted-foreground',
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-[620px] bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground/60 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4">
            <div className="flex items-center border-b border-border/40 px-4">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <CommandInput
                placeholder="Search anything..."
                className="flex-1 h-12 border-0 bg-transparent px-3 text-sm focus:ring-0"
              />
              <kbd className="pointer-events-none hidden sm:flex select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
                ESC
              </kbd>
            </div>
            <CommandList className="max-h-[420px] overflow-y-auto">
              <CommandEmpty className="py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Search className="size-8 text-muted-foreground/30" />
                  <p className="text-sm">No results found</p>
                  <p className="text-xs text-muted-foreground/60">Try a different search term</p>
                </div>
              </CommandEmpty>

              {/* Recent Pages Group */}
              {recentPages.length > 0 && (
                <CommandGroup heading="Recent" className="[&_[cmdk-group-items]]:space-y-0.5">
                  {recentPages.map((pageId) => {
                    const page = PAGE_ITEMS.find(p => p.id === pageId)
                    if (!page) return null
                    const Icon = page.icon
                    return (
                      <CommandItem
                        key={`recent-${page.id}`}
                        value={`recent ${page.label}`}
                        onSelect={() => handlePageSelect(page.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                      >
                        <History className="size-3.5 text-muted-foreground/50 shrink-0" />
                        <Icon className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{page.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              <CommandSeparator className="my-1" />

              {/* Pages Group */}
              <CommandGroup heading="Pages" className="[&_[cmdk-group-items]]:space-y-0.5">
                {PAGE_ITEMS.map((page) => {
                  const Icon = page.icon
                  return (
                    <CommandItem
                      key={page.id}
                      value={`page ${page.label}`}
                      onSelect={() => handlePageSelect(page.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                    >
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1">{page.label}</span>
                      <kbd className="pointer-events-none select-none items-center gap-0.5 rounded border border-border/30 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/40 hidden sm:flex">
                        <CommandIcon className="size-2.5" />
                      </kbd>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Machines Group */}
              {hasMachines && (
                <>
                  <CommandSeparator className="my-1" />
                  <CommandGroup heading="Machines" className="[&_[cmdk-group-items]]:space-y-0.5">
                    {machines.map((machine) => (
                      <CommandItem
                        key={machine.id}
                        value={`machine ${machine.name} ${machine.type}`}
                        onSelect={() => handleMachineSelect(machine.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                      >
                        <Factory className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{machine.name}</span>
                        <span className={`text-[11px] font-medium ${STATUS_COLORS[machine.status] || 'text-muted-foreground'}`}>
                          {machine.status}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Devices Group */}
              {hasDevices && (
                <>
                  <CommandSeparator className="my-1" />
                  <CommandGroup heading="Devices" className="[&_[cmdk-group-items]]:space-y-0.5">
                    {devices.map((device) => (
                      <CommandItem
                        key={device.id}
                        value={`device ${device.name} ${device.type}`}
                        onSelect={handleDeviceSelect}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                      >
                        <Monitor className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{device.name}</span>
                        <span className={`text-[11px] font-medium ${STATUS_COLORS[device.status] || 'text-muted-foreground'}`}>
                          {device.status}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Production Orders Group */}
              <>
                <CommandSeparator className="my-1" />
                <CommandGroup heading="Production Orders" className="[&_[cmdk-group-items]]:space-y-0.5">
                  {mockProductionOrders.map((order) => (
                    <CommandItem
                      key={order.id}
                      value={`order ${order.id} ${order.product}`}
                      onSelect={handleProductionSelect}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                    >
                      <Package className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm line-clamp-1 block">{order.product}</span>
                        <span className="text-[11px] text-muted-foreground">{order.id}</span>
                      </div>
                      <span className={`text-[11px] font-medium ${ORDER_STATUS_COLORS[order.status] || 'text-muted-foreground'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>

              {/* Sites Group */}
              <>
                <CommandSeparator className="my-1" />
                <CommandGroup heading="Sites" className="[&_[cmdk-group-items]]:space-y-0.5">
                  {mockSites.map((site) => (
                    <CommandItem
                      key={site.id}
                      value={`site ${site.name} ${site.id}`}
                      onSelect={handleSiteSelect}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                    >
                      <Building2 className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm line-clamp-1 block">{site.name}</span>
                        <span className="text-[11px] text-muted-foreground">{site.devices} devices · {site.machines} machines</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>

              {/* Users Group */}
              <>
                <CommandSeparator className="my-1" />
                <CommandGroup heading="Users" className="[&_[cmdk-group-items]]:space-y-0.5">
                  {mockUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`user ${user.name} ${user.role} ${user.id}`}
                      onSelect={handleUserSelect}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                    >
                      <Users className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm line-clamp-1 block">{user.name}</span>
                        <span className="text-[11px] text-muted-foreground">{user.role}</span>
                      </div>
                      <span className={`text-[11px] font-medium ${USER_STATUS_COLORS[user.status] || 'text-muted-foreground'}`}>
                        {user.status}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>

              {/* Recent Alarms Group */}
              {hasAlarms && (
                <>
                  <CommandSeparator className="my-1" />
                  <CommandGroup heading="Recent Alarms" className="[&_[cmdk-group-items]]:space-y-0.5">
                    {activeAlarms.map((alarm) => (
                      <CommandItem
                        key={alarm.id}
                        value={`alarm ${alarm.source} ${alarm.message}`}
                        onSelect={handleAlarmSelect}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                      >
                        <AlertTriangle className={`size-4 shrink-0 ${
                          alarm.severity === 'critical'
                            ? 'text-red-400'
                            : alarm.severity === 'warning'
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm line-clamp-1 block">{alarm.message}</span>
                          <span className="text-[11px] text-muted-foreground">{alarm.source}</span>
                        </div>
                        <span className={`size-2 rounded-full shrink-0 ${SEVERITY_DOT[alarm.severity] || 'bg-muted-foreground'}`} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 text-[11px] text-muted-foreground/50">
              <span>Search pages, machines, devices, alarms, orders & more</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border/30 bg-muted/30 px-1 font-mono text-[10px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border/30 bg-muted/30 px-1 font-mono text-[10px]">↵</kbd>
                  Select
                </span>
              </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Machine Detail Dialog */}
      {selectedMachine && (
        <MachineDetailDialog
          machine={selectedMachine}
          open={machineDetailOpen}
          onOpenChange={setMachineDetailOpen}
        />
      )}
    </>
  )
}
