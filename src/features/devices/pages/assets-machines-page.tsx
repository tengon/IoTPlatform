'use client'

import { useState, useMemo } from 'react'
import { Factory, Search, Eye, Pencil, Cog } from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'Running' },
  idle: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'Idle' },
  maintenance: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', label: 'Maintenance' },
  error: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'Error' },
}

function OEEBar({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">N/A</span>
  const color = value >= 85 ? 'bg-emerald-500' : value >= 70 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <Progress value={value} className="h-2 flex-1 [&>div]:bg-[var(--bar-color)]" style={{ '--bar-color': value >= 85 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444' } as React.CSSProperties} />
      <span className={`text-xs font-mono font-medium w-12 text-right ${value >= 85 ? 'text-emerald-400' : value >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{value}%</span>
    </div>
  )
}

export function AssetsMachinesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return mockMachines.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()) || m.model.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const stats = useMemo(() => {
    const total = mockMachines.length
    const running = mockMachines.filter((m) => m.status === 'running').length
    const idle = mockMachines.filter((m) => m.status === 'idle').length
    const maintenance = mockMachines.filter((m) => m.status === 'maintenance').length
    return { total, running, idle, maintenance }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader icon={Factory} title="Assets & Machines" description="Manage industrial assets and equipment" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Cog className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Machines</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Factory className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Running</p>
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400">{stats.running}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Factory className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Idle</p>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-400">{stats.idle}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <Factory className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Maintenance</p>
              <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-400">{stats.maintenance}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search machines..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                <TabsTrigger value="running" className="text-xs px-3 h-7">Running</TabsTrigger>
                <TabsTrigger value="idle" className="text-xs px-3 h-7">Idle</TabsTrigger>
                <TabsTrigger value="maintenance" className="text-xs px-3 h-7">Maintenance</TabsTrigger>
                <TabsTrigger value="error" className="text-xs px-3 h-7">Error</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Machine Name</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Model</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs min-w-[180px]">OEE %</TableHead>
                  <TableHead className="text-xs min-w-[140px] hidden lg:table-cell">Availability %</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No machines found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((machine) => {
                    const sc = statusConfig[machine.status]
                    return (
                      <TableRow key={machine.id} className={machine.status === 'error' ? 'bg-red-500/5' : ''}>
                        <TableCell>
                          <div className="font-medium">{machine.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{machine.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-normal">{machine.type}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{machine.model}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} text-xs`}>
                            <span className={`inline-block size-1.5 rounded-full mr-1.5 ${sc.bg.replace('/10', '')}`} style={{ backgroundColor: machine.status === 'running' ? '#10b981' : machine.status === 'idle' ? '#f59e0b' : machine.status === 'maintenance' ? '#22d3ee' : '#ef4444' }} />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell><OEEBar value={machine.oee} /></TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={machine.availability} className="h-1.5 flex-1 [&>div]:bg-emerald-500" />
                            <span className="text-xs font-mono w-10 text-right text-muted-foreground">{machine.availability}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
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
            <span>Showing {filtered.length} of {mockMachines.length} machines</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}