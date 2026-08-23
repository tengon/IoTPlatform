'use client'

import { useState, useMemo } from 'react'
import { Package, Plus, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useIIoTStore } from '@/store/iiot'
import type { ProductionOrder } from '@/store/iiot'

const fallbackOrders: ProductionOrder[] = [
  { id: 'PO-20240101', machineName: 'CNC Lathe Alpha', productName: 'Shaft Assembly A', target: 500, actual: 423, defects: 7, status: 'running', startTime: '2024-01-15T06:00:00Z', progress: 84.6 },
  { id: 'PO-20240102', machineName: 'Injection Molder #1', productName: 'Housing Cap B2', target: 2000, actual: 2000, defects: 12, status: 'completed', startTime: '2024-01-15T04:00:00Z', progress: 100 },
  { id: 'PO-20240103', machineName: 'Packaging Line 1', productName: 'Widget Pack C1', target: 3000, actual: 1580, defects: 3, status: 'running', startTime: '2024-01-15T07:30:00Z', progress: 52.7 },
  { id: 'PO-20240104', machineName: 'CNC Mill Beta', productName: 'Bracket Mount D', target: 150, actual: 98, defects: 2, status: 'running', startTime: '2024-01-15T05:00:00Z', progress: 65.3 },
  { id: 'PO-20240105', machineName: 'Robotic Arm R1', productName: 'Weld Assembly E', target: 800, actual: 800, defects: 5, status: 'completed', startTime: '2024-01-14T22:00:00Z', progress: 100 },
  { id: 'PO-20240106', machineName: 'Hydraulic Press P1', productName: 'Panel Frame F', target: 300, actual: 0, defects: 0, status: 'paused', startTime: '2024-01-15T08:00:00Z', progress: 0 },
  { id: 'PO-20240107', machineName: 'Injection Molder #2', productName: 'Connector Shell G', target: 5000, actual: 3210, defects: 18, status: 'running', startTime: '2024-01-15T02:00:00Z', progress: 64.2 },
  { id: 'PO-20240108', machineName: 'CNC Grinder G1', productName: 'Precision Bearing H', target: 100, actual: 100, defects: 1, status: 'completed', startTime: '2024-01-14T18:00:00Z', progress: 100 },
  { id: 'PO-20240109', machineName: 'Conveyor Belt A1', productName: 'Bulk Material I', target: 10000, actual: 6700, defects: 0, status: 'running', startTime: '2024-01-15T00:00:00Z', progress: 67.0 },
]

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'Running' },
  completed: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'Paused' },
}

export function ProductionPage() {
  const storeOrders = useIIoTStore((s) => s.production)
  const orders = storeOrders.length > 0 ? storeOrders : fallbackOrders
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status === 'running').length
    const completedToday = orders.filter((o) => o.status === 'completed').length
    const totalOutput = orders.reduce((sum, o) => sum + o.actual, 0)
    const totalDefects = orders.reduce((sum, o) => sum + o.defects, 0)
    const defectRate = totalOutput > 0 ? ((totalDefects / totalOutput) * 100) : 0
    return { active, completedToday, totalOutput, defectRate: defectRate.toFixed(2) }
  }, [orders])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        title="Production"
        description="Track production orders and output"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Order
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Clock className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <CheckCircle2 className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Today</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.completedToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Package className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Output</p>
              <p className="text-2xl font-bold">{stats.totalOutput.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Defect Rate</p>
              <p className={`text-2xl font-bold ${Number(stats.defectRate) > 1 ? 'text-red-400' : 'text-emerald-400'}`}>{stats.defectRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="running" className="text-xs">Running</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
              <TabsTrigger value="paused" className="text-xs">Paused</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="max-h-[calc(100vh-360px)] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Machine</TableHead>
                  <TableHead className="text-xs text-right hidden sm:table-cell">Target</TableHead>
                  <TableHead className="text-xs text-right hidden sm:table-cell">Actual</TableHead>
                  <TableHead className="text-xs text-right hidden lg:table-cell">Defects</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs min-w-[160px]">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No production orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const sc = statusConfig[order.status]
                    const isCompleted = order.status === 'completed'
                    return (
                      <TableRow key={order.id} className={isCompleted ? 'opacity-60' : order.status === 'running' ? 'bg-emerald-500/5' : ''}>
                        <TableCell className="font-mono text-xs font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{order.productName}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{order.machineName}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{order.target.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{order.actual.toLocaleString()}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          {order.defects > 0 ? (
                            <span className="text-red-400 font-mono text-sm">{order.defects}</span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} text-xs`}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={order.progress}
                              className="h-2 flex-1 [&>div]:bg-[var(--prog-color)]"
                              style={{ '--prog-color': isCompleted ? '#22d3ee' : order.status === 'paused' ? '#f59e0b' : '#10b981' } as React.CSSProperties}
                            />
                            <span className={`text-xs font-mono w-10 text-right ${isCompleted ? 'text-cyan-400' : 'text-muted-foreground'}`}>{order.progress.toFixed(0)}%</span>
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
            <span>Showing {filtered.length} of {orders.length} orders</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}