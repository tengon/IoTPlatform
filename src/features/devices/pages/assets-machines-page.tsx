'use client'

import { useState, useMemo, useEffect } from 'react'
import { Factory, Search, Eye, Pencil, Cog, Inbox } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { oeeColor, STATUS_COLORS } from '@/shared/components/chart-utils'
import { PageHeader } from '@/shared/components/page-header'
import { SortableTableHeader, useSort, SortDirection } from '@/shared/components/sortable-table-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

interface MachineAsset {
  id: string
  name: string
  type: string
  model: string
  status: 'running' | 'idle' | 'maintenance' | 'error'
  oee: number
  availability: number
  location: string
}

const mockMachines: MachineAsset[] = [
  { id: 'MCH-001', name: 'CNC Lathe Alpha', type: 'CNC', model: 'DMG MORI NLX 2500', status: 'running', oee: 87.3, availability: 94.1, location: 'Line A' },
  { id: 'MCH-002', name: 'CNC Mill Beta', type: 'CNC', model: 'Haas VF-2SS', status: 'running', oee: 82.5, availability: 91.3, location: 'Line A' },
  { id: 'MCH-003', name: 'Injection Molder #1', type: 'Injection Molding', model: 'ENGEL e-mac 180', status: 'running', oee: 91.2, availability: 96.8, location: 'Line B' },
  { id: 'MCH-004', name: 'Injection Molder #2', type: 'Injection Molding', model: 'ARBURG Allrounder 470A', status: 'idle', oee: 0, availability: 88.5, location: 'Line B' },
  { id: 'MCH-005', name: 'Conveyor Belt A1', type: 'Conveyor', model: 'Dorner 2200 Series', status: 'running', oee: 95.1, availability: 99.2, location: 'Line A' },
  { id: 'MCH-006', name: 'Conveyor Belt B1', type: 'Conveyor', model: 'Hytrol EZLogic', status: 'maintenance', oee: 0, availability: 76.3, location: 'Line B' },
  { id: 'MCH-007', name: 'Robotic Arm R1', type: 'Robot', model: 'FANUC LR-200iC', status: 'running', oee: 89.7, availability: 97.5, location: 'Line C' },
  { id: 'MCH-008', name: 'Robotic Arm R2', type: 'Robot', model: 'ABB IRB 6700', status: 'error', oee: 12.4, availability: 45.2, location: 'Line C' },
  { id: 'MCH-009', name: 'Packaging Line 1', type: 'Packaging', model: 'Bosch CUC 3001', status: 'running', oee: 88.6, availability: 93.7, location: 'Line D' },
  { id: 'MCH-010', name: 'Hydraulic Press P1', type: 'Press', model: 'Schuler SM 1000', status: 'idle', oee: 0, availability: 90.1, location: 'Line E' },
  { id: 'MCH-011', name: 'CNC Grinder G1', type: 'CNC', model: 'STUDER S33', status: 'running', oee: 85.4, availability: 92.6, location: 'Line A' },
  { id: 'MCH-012', name: 'Welding Robot W1', type: 'Robot', model: 'KUKA KR 16', status: 'maintenance', oee: 0, availability: 82.4, location: 'Line C' },
  { id: 'MCH-013', name: 'Packaging Line 2', type: 'Packaging', model: 'Multivac R 245', status: 'idle', oee: 0, availability: 95.3, location: 'Line D' },
]

const statusConfig: Record<string, { color: string; bg: string; border: string; ring: string; label: string; borderColor: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', ring: 'ring-emerald-400/20', label: 'Running', borderColor: 'border-l-emerald-500' },
  idle: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', ring: 'ring-amber-400/20', label: 'Idle', borderColor: 'border-l-amber-500' },
  maintenance: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', ring: 'ring-cyan-400/20', label: 'Maintenance', borderColor: 'border-l-cyan-500' },
  error: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', ring: 'ring-red-400/20', label: 'Error', borderColor: 'border-l-red-500' },
}

const tabActiveClass: Record<string, string> = {
  all: '',
  running: 'bg-emerald-500/15 text-emerald-400 border-l-emerald-500',
  idle: 'bg-amber-500/15 text-amber-400 border-l-amber-500',
  maintenance: 'bg-cyan-500/15 text-cyan-400 border-l-cyan-500',
  error: 'bg-red-500/15 text-red-400 border-l-red-500',
}

function OEEBar({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">N/A</span>
  const color = oeeColor(value)
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="relative flex-1">
        <Progress value={value} className="h-2 rounded-full [&>div]:rounded-full" style={{ '--bar-color': color } as React.CSSProperties} />
      </div>
      <span className="text-xs font-mono font-medium w-12 text-right metric-value" style={{ color }}>{value}%</span>
    </div>
  )
}

export function AssetsMachinesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { lastUpdate } = useIIoTStore()
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

  const filtered = useMemo(() => {
    return mockMachines.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()) || m.model.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, undefined, undefined)

  const getSortDir = (key: keyof MachineAsset): SortDirection => {
    if (sortKey !== key) return null
    return sortDir
  }

  const stats = useMemo(() => {
    const total = mockMachines.length
    const running = mockMachines.filter((m) => m.status === 'running').length
    const idle = mockMachines.filter((m) => m.status === 'idle').length
    const maintenance = mockMachines.filter((m) => m.status === 'maintenance').length
    return { total, running, idle, maintenance }
  }, [])

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader icon={Factory} title="Assets & Machines" description="Manage industrial assets and equipment" lastUpdated={lastUpdatedText} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Cog className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Machines</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Factory className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Running</p>
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400 ring-2 ring-emerald-400/20">{stats.running}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Factory className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Idle</p>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20">{stats.idle}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/20 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <Factory className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Maintenance</p>
              <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-400 ring-2 ring-cyan-400/20">{stats.maintenance}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 hover:border-border/60 transition-colors duration-300 animate-slide-up stagger-2">
        <CardContent className="pt-5 px-5 pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search machines..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className={`text-xs px-3 h-7 ${statusFilter === 'all' ? 'bg-primary/15 text-primary' : ''}`}>All</TabsTrigger>
                <TabsTrigger value="running" className={`text-xs px-3 h-7 ${statusFilter === 'running' ? tabActiveClass.running : ''}`}>Running</TabsTrigger>
                <TabsTrigger value="idle" className={`text-xs px-3 h-7 ${statusFilter === 'idle' ? tabActiveClass.idle : ''}`}>Idle</TabsTrigger>
                <TabsTrigger value="maintenance" className={`text-xs px-3 h-7 ${statusFilter === 'maintenance' ? tabActiveClass.maintenance : ''}`}>Maintenance</TabsTrigger>
                <TabsTrigger value="error" className={`text-xs px-3 h-7 ${statusFilter === 'error' ? tabActiveClass.error : ''}`}>Error</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <SortableTableHeader label="Machine Name" sortDirection={getSortDir('name')} onSort={() => toggleSort('name')} />
                  <SortableTableHeader label="Type" sortDirection={getSortDir('type')} onSort={() => toggleSort('type')} />
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden md:table-cell">Model</TableHead>
                  <SortableTableHeader label="Status" sortDirection={getSortDir('status')} onSort={() => toggleSort('status')} />
                  <SortableTableHeader label="OEE %" sortDirection={getSortDir('oee')} onSort={() => toggleSort('oee')} className="min-w-[180px]" />
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 min-w-[140px] hidden lg:table-cell">Availability %</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="size-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No machines found</p>
                        <p className="text-xs text-muted-foreground/50">Try adjusting your search or filter criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((machine) => {
                    const sc = statusConfig[machine.status]
                    return (
                      <TableRow key={machine.id} className={`hover:bg-muted/20 transition-colors duration-150 border-l-2 ${sc.borderColor} ${machine.status === 'error' ? 'bg-red-500/5' : ''}`}>
                        <TableCell className="py-3">
                          <div className="font-medium">{machine.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{machine.id}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="text-xs font-normal">{machine.type}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3">{machine.model}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} ${sc.ring} ring-2 text-xs`}
                            style={{ boxShadow: 'none' }}>
                            <span className={`inline-block size-1.5 rounded-full mr-1.5`} style={{ backgroundColor: STATUS_COLORS[machine.status] || '#71717a' }} />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3"><OEEBar value={machine.oee} /></TableCell>
                        <TableCell className="hidden lg:table-cell py-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={machine.availability} className="h-2 rounded-full flex-1 [&>div]:rounded-full [&>div]:bg-emerald-500" />
                            <span className="text-xs font-mono w-10 text-right text-muted-foreground metric-value">{machine.availability}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <Pencil className="size-4" />
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
            <span>Showing {sorted.length} of {mockMachines.length} machines</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}