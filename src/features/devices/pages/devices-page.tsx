'use client'

import { useState, useMemo, useEffect } from 'react'
import { MonitorSmartphone, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Inbox, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { STATUS_COLORS } from '@/shared/components/chart-utils'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { DeviceStatus } from '@/store/iiot'

const fallbackDevices: DeviceStatus[] = [
  { id: 'DEV-001', name: 'Temp Sensor A1', type: 'Temperature', status: 'online', lastSeen: '2024-01-15T10:30:00Z', metrics: { temperature: 72.3, humidity: 45.1 } },
  { id: 'DEV-002', name: 'Vibration Sensor B1', type: 'Vibration', status: 'online', lastSeen: '2024-01-15T10:29:00Z', metrics: { vibration: 0.42, frequency: 120.5 } },
  { id: 'DEV-003', name: 'Pressure Sensor C1', type: 'Pressure', status: 'warning', lastSeen: '2024-01-15T10:25:00Z', metrics: { pressure: 89.2, flow: 12.7 } },
  { id: 'DEV-004', name: 'Flow Meter D1', type: 'Flow', status: 'online', lastSeen: '2024-01-15T10:30:00Z', metrics: { flow: 15.3, pressure: 42.1 } },
  { id: 'DEV-005', name: 'Current Sensor E1', type: 'Current', status: 'offline', lastSeen: '2024-01-15T08:15:00Z', metrics: {} },
  { id: 'DEV-006', name: 'Proximity Sensor F1', type: 'Proximity', status: 'online', lastSeen: '2024-01-15T10:30:00Z', metrics: { distance: 12.5, signal: 98.1 } },
  { id: 'DEV-007', name: 'Load Cell G1', type: 'Weight', status: 'online', lastSeen: '2024-01-15T10:28:00Z', metrics: { weight: 245.7, tare: 2.1 } },
  { id: 'DEV-008', name: 'RFID Reader H1', type: 'RFID', status: 'error', lastSeen: '2024-01-15T07:45:00Z', metrics: {} },
  { id: 'DEV-009', name: 'pH Sensor I1', type: 'Chemical', status: 'online', lastSeen: '2024-01-15T10:29:00Z', metrics: { ph: 7.2, temp: 22.1 } },
  { id: 'DEV-010', name: 'Humidity Sensor J1', type: 'Humidity', status: 'online', lastSeen: '2024-01-15T10:30:00Z', metrics: { humidity: 52.3, temperature: 24.8 } },
]

const statusConfig: Record<string, { dotColor: string; color: string; bg: string; border: string; ring: string; label: string }> = {
  online: { dotColor: '#10b981', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', ring: 'ring-emerald-400/20', label: 'Online' },
  offline: { dotColor: '#ef4444', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', ring: 'ring-red-400/20', label: 'Offline' },
  warning: { dotColor: '#f59e0b', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', ring: 'ring-amber-400/20', label: 'Warning' },
  error: { dotColor: '#ef4444', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', ring: 'ring-red-400/20', label: 'Error' },
}

const statusIconMap: Record<string, typeof Wifi> = {
  online: Wifi,
  offline: WifiOff,
  warning: AlertTriangle,
  error: AlertTriangle,
}

const tabActiveClass: Record<string, string> = {
  all: '',
  online: 'bg-emerald-500/15 text-emerald-400',
  offline: 'bg-red-500/15 text-red-400',
  warning: 'bg-amber-500/15 text-amber-400',
  error: 'bg-red-500/15 text-red-400',
}

const deviceTypes = ['Temperature', 'Vibration', 'Pressure', 'Flow', 'Current', 'Proximity', 'Weight', 'RFID', 'Chemical', 'Humidity']

export function DevicesPage() {
  const storeDevices = useIIoTStore((s) => s.devices)
  const { lastUpdate } = useIIoTStore()
  const devices: DeviceStatus[] = storeDevices.length > 0 ? storeDevices : fallbackDevices
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: '', type: 'Temperature', status: 'online' })
  const [lastUpdatedText, setLastUpdatedText] = useState('—')

  useEffect(() => {
    function update() {
      if (lastUpdate) {
        setLastUpdatedText(formatDistanceToNow(new Date(lastUpdate), { addSuffix: true }))
      }
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  const stats = useMemo(() => {
    const total = devices.length
    const online = devices.filter((d) => d.status === 'online').length
    const offline = devices.filter((d) => d.status === 'offline').length
    const warning = devices.filter((d) => d.status === 'warning' || d.status === 'error').length
    return { total, online, offline, warning }
  }, [devices])

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [devices, search, statusFilter])

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const formatMetrics = (metrics: Record<string, number>) => {
    if (!metrics || Object.keys(metrics).length === 0) return <span className="text-muted-foreground text-xs">No data</span>
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono">
        {Object.entries(metrics).map(([k, v]) => (
          <span key={k} className="text-muted-foreground">
            <span className="text-foreground/80">{k}</span>: <span className="metric-value">{typeof v === 'number' ? v.toFixed(1) : v}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={MonitorSmartphone}
        title="Devices"
        description="Manage IoT devices and sensors"
        lastUpdated={lastUpdatedText}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Device</DialogTitle>
                <DialogDescription>Register a new IoT device or sensor to the platform.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Device Information</Label>
                  <Separator className="my-2" />
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Device Name</Label>
                      <Input
                        placeholder="e.g. Temp Sensor A2"
                        value={newDevice.name}
                        onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Device Type</Label>
                      <Select value={newDevice.type} onValueChange={(v) => setNewDevice({ ...newDevice, type: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {deviceTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Add Device</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MonitorSmartphone className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Devices</p>
              <p className="text-2xl font-bold metric-value">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Wifi className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-emerald-400 metric-value">{stats.online}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <WifiOff className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold text-red-400 metric-value">{stats.offline}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Warning</p>
              <p className="text-2xl font-bold text-amber-400 metric-value">{stats.warning}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 hover:border-border/60 transition-colors duration-300 animate-slide-up stagger-2">
        <CardContent className="pt-5 px-5 pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search devices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className={`text-xs px-3 h-7 ${statusFilter === 'all' ? 'bg-primary/15 text-primary' : ''}`}>All</TabsTrigger>
                <TabsTrigger value="online" className={`text-xs px-3 h-7 ${statusFilter === 'online' ? tabActiveClass.online : ''}`}>Online</TabsTrigger>
                <TabsTrigger value="offline" className={`text-xs px-3 h-7 ${statusFilter === 'offline' ? tabActiveClass.offline : ''}`}>Offline</TabsTrigger>
                <TabsTrigger value="warning" className={`text-xs px-3 h-7 ${statusFilter === 'warning' ? tabActiveClass.warning : ''}`}>Warning</TabsTrigger>
                <TabsTrigger value="error" className={`text-xs px-3 h-7 ${statusFilter === 'error' ? tabActiveClass.error : ''}`}>Error</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden md:table-cell">Last Seen</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden lg:table-cell">Metrics</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="size-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No devices found</p>
                        <p className="text-xs text-muted-foreground/50">Try adjusting your search or filter criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((device) => {
                    const sc = statusConfig[device.status]
                    return (
                      <TableRow key={device.id} className={`hover:bg-muted/20 transition-colors duration-150 ${device.status === 'error' ? 'bg-red-500/5' : device.status === 'warning' ? 'bg-amber-500/5' : ''}`}>
                        <TableCell className="py-3">
                          <div className="font-medium">{device.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{device.id}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="text-xs font-normal">{device.type}</Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${device.status === 'online' ? 'bg-emerald-400' : device.status === 'offline' ? 'bg-red-400' : 'bg-amber-400'}`} />
                            <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} ring-2 ${sc.ring} text-xs`} style={{ boxShadow: 'none' }}>{sc.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground font-mono py-3">
                          {formatTime(device.lastSeen)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-3">
                          {formatMetrics(device.metrics)}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {devices.length} devices</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}