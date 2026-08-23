'use client'

import { useState, useMemo, useEffect } from 'react'
import { Package, Plus, Clock, CheckCircle2, AlertTriangle, Inbox } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { STATUS_COLORS } from '@/shared/components/chart-utils'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const statusConfig: Record<string, { color: string; bg: string; border: string; ring: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', ring: 'ring-emerald-400/20', label: 'Running' },
  completed: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', ring: 'ring-cyan-400/20', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', ring: 'ring-amber-400/20', label: 'Paused' },
}

const tabActiveClass: Record<string, string> = {
  all: '',
  running: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-cyan-500/15 text-cyan-400',
  paused: 'bg-amber-500/15 text-amber-400',
}

export function ProductionPage() {
  const storeOrders = useIIoTStore((s) => s.production)
  const { lastUpdate } = useIIoTStore()
  const orders = storeOrders.length > 0 ? storeOrders : fallbackOrders
  const [statusFilter, setStatusFilter] = useState('all')
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
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={Package}
        title="Production"
        description="Track production orders and output"
        lastUpdated={lastUpdatedText}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Order
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Clock className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold text-emerald-400 metric-value">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <CheckCircle2 className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Today</p>
              <p className="text-2xl font-bold text-cyan-400 metric-value">{stats.completedToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Package className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Output</p>
              <p className="text-2xl font-bold metric-value">{stats.totalOutput.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Defect Rate</p>
              <p className={`text-2xl font-bold metric-value ${Number(stats.defectRate) > 1 ? 'text-red-400' : 'text-emerald-400'}`}>{stats.defectRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 hover:border-border/60 transition-colors duration-300 animate-slide-up stagger-2">
        <CardContent className="pt-5 px-5 pb-5 space-y-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all" className={`text-xs ${statusFilter === 'all' ? 'bg-primary/15 text-primary' : ''}`}>All</TabsTrigger>
              <TabsTrigger value="running" className={`text-xs ${statusFilter === 'running' ? tabActiveClass.running : ''}`}>Running</TabsTrigger>
              <TabsTrigger value="completed" className={`text-xs ${statusFilter === 'completed' ? tabActiveClass.completed : ''}`}>Completed</TabsTrigger>
              <TabsTrigger value="paused" className={`text-xs ${statusFilter === 'paused' ? tabActiveClass.paused : ''}`}>Paused</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="max-h-[calc(100vh-360px)] overflow-y-auto rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Order ID</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Product</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden md:table-cell">Machine</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right hidden sm:table-cell">Target</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right hidden sm:table-cell">Actual</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right hidden lg:table-cell">Defects</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 min-w-[160px]">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="size-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No production orders found</p>
                        <p className="text-xs text-muted-foreground/50">No orders match the selected filter.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const sc = statusConfig[order.status]
                    const isCompleted = order.status === 'completed'
                    const isPaused = order.status === 'paused'
                    return (
                      <TableRow key={order.id} className={`hover:bg-muted/20 transition-colors duration-150 ${isCompleted ? 'opacity-60' : order.status === 'running' ? 'bg-emerald-500/5' : ''}`}>
                        <TableCell className="font-mono text-xs font-medium py-3">{order.id}</TableCell>
                        <TableCell className="py-3">
                          <div className="font-medium">{order.productName}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3">{order.machineName}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell py-3 metric-value">{order.target.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell py-3 metric-value">{order.actual.toLocaleString()}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell py-3">
                          {order.defects > 0 ? (
                            <span className="text-red-400 font-mono text-sm">{order.defects}</span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} ring-2 ${sc.ring} text-xs`}
                            style={{ boxShadow: 'none' }}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Progress
                                value={order.progress}
                                className="h-2 rounded-full [&>div]:rounded-full"
                                style={{ '--prog-color': isCompleted ? '#22d3ee' : isPaused ? '#f59e0b' : '#10b981' } as React.CSSProperties}
                              />
                              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold ${order.progress > 20 ? 'text-white' : 'text-muted-foreground'}`}>
                                {order.progress.toFixed(0)}%
                              </span>
                            </div>
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