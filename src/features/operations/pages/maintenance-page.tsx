'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Wrench,
  Plus,
  CalendarDays,
  LayoutList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Eye,
  Pencil,
  Inbox,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Skipped'
type TaskType = 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency'
type Priority = 'Critical' | 'High' | 'Medium' | 'Low'

interface MaintenanceTask {
  id: string
  machine: string
  taskType: TaskType
  priority: Priority
  scheduledDate: string
  status: TaskStatus
  assignedTo: string
  estimatedDuration: string
  description: string
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MACHINE_NAMES = [
  'CNC Lathe Alpha',
  'CNC Mill Beta',
  'Injection Molder #1',
  'Injection Molder #2',
  'Conveyor Belt A1',
  'Conveyor Belt B1',
  'Robotic Arm R1',
  'Robotic Arm R2',
  'Packaging Line 1',
  'Hydraulic Press P1',
  'CNC Grinder G1',
  'Welding Robot W1',
]

const TECHNICIANS = [
  'Zhang Wei',
  'Li Ming',
  'Wang Jun',
  'Chen Yang',
  'Zhao Tao',
  'Liu Hua',
]

const today = new Date()
const d = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd')

const mockTasks: MaintenanceTask[] = [
  { id: 'MT-2401', machine: 'CNC Lathe Alpha', taskType: 'Preventive', priority: 'High', scheduledDate: d(2), status: 'Scheduled', assignedTo: 'Zhang Wei', estimatedDuration: '2h', description: 'Quarterly spindle bearing inspection and lubrication' },
  { id: 'MT-2402', machine: 'Robotic Arm R1', taskType: 'Corrective', priority: 'Critical', scheduledDate: d(-1), status: 'Overdue', assignedTo: 'Chen Yang', estimatedDuration: '4h', description: 'Replace faulty servo motor on joint 3' },
  { id: 'MT-2403', machine: 'Injection Molder #1', taskType: 'Preventive', priority: 'Medium', scheduledDate: d(5), status: 'Scheduled', assignedTo: 'Li Ming', estimatedDuration: '3h', description: 'Barrel and screw inspection, thermocouple calibration' },
  { id: 'MT-2404', machine: 'Conveyor Belt A1', taskType: 'Predictive', priority: 'High', scheduledDate: d(1), status: 'In Progress', assignedTo: 'Wang Jun', estimatedDuration: '1.5h', description: 'Belt tension adjustment based on vibration analysis' },
  { id: 'MT-2405', machine: 'Hydraulic Press P1', taskType: 'Emergency', priority: 'Critical', scheduledDate: d(-2), status: 'Completed', assignedTo: 'Zhao Tao', estimatedDuration: '6h', description: 'Hydraulic seal failure - full system rebuild' },
  { id: 'MT-2406', machine: 'CNC Grinder G1', taskType: 'Preventive', priority: 'Low', scheduledDate: d(14), status: 'Scheduled', assignedTo: 'Liu Hua', estimatedDuration: '2h', description: 'Wheel dressing and coolant system flush' },
  { id: 'MT-2407', machine: 'Welding Robot W1', taskType: 'Corrective', priority: 'High', scheduledDate: d(-3), status: 'Completed', assignedTo: 'Chen Yang', estimatedDuration: '3h', description: 'Wire feed mechanism realignment and nozzle replacement' },
  { id: 'MT-2408', machine: 'CNC Mill Beta', taskType: 'Preventive', priority: 'Medium', scheduledDate: d(7), status: 'Scheduled', assignedTo: 'Zhang Wei', estimatedDuration: '2.5h', description: 'Ball screw preload check and axis calibration' },
  { id: 'MT-2409', machine: 'Conveyor Belt B1', taskType: 'Corrective', priority: 'High', scheduledDate: d(-1), status: 'Overdue', assignedTo: 'Wang Jun', estimatedDuration: '4h', description: 'Replace worn roller bearings on section B3-B7' },
  { id: 'MT-2410', machine: 'Injection Molder #2', taskType: 'Predictive', priority: 'Medium', scheduledDate: d(4), status: 'Scheduled', assignedTo: 'Li Ming', estimatedDuration: '2h', description: 'Heater band resistance check per predictive model' },
  { id: 'MT-2411', machine: 'Robotic Arm R2', taskType: 'Emergency', priority: 'Critical', scheduledDate: d(0), status: 'In Progress', assignedTo: 'Zhao Tao', estimatedDuration: '5h', description: 'Emergency brake system malfunction - full diagnostics' },
  { id: 'MT-2412', machine: 'Packaging Line 1', taskType: 'Preventive', priority: 'Low', scheduledDate: d(-5), status: 'Completed', assignedTo: 'Liu Hua', estimatedDuration: '1.5h', description: 'Seal bar replacement and sensor cleaning' },
  { id: 'MT-2413', machine: 'CNC Lathe Alpha', taskType: 'Corrective', priority: 'Medium', scheduledDate: d(-7), status: 'Skipped', assignedTo: 'Zhang Wei', estimatedDuration: '2h', description: 'Chuck jaw replacement - postponed due to part unavailability' },
  { id: 'MT-2414', machine: 'Packaging Line 1', taskType: 'Preventive', priority: 'Medium', scheduledDate: d(10), status: 'Scheduled', assignedTo: 'Chen Yang', estimatedDuration: '2h', description: 'Conveyor chain tensioning and photo-eye alignment' },
]

// ─── Config Maps ─────────────────────────────────────────────────────────────

const taskTypeConfig: Record<TaskType, { color: string; bg: string; border: string; ring: string }> = {
  Preventive: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', ring: 'ring-cyan-400/20' },
  Corrective: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', ring: 'ring-amber-400/20' },
  Predictive: { color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/30', ring: 'ring-violet-400/20' },
  Emergency: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', ring: 'ring-red-400/20' },
}

const priorityConfig: Record<Priority, { color: string; bg: string; border: string; ring: string }> = {
  Critical: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', ring: 'ring-red-400/20' },
  High: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', ring: 'ring-orange-400/20' },
  Medium: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', ring: 'ring-amber-400/20' },
  Low: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', ring: 'ring-emerald-400/20' },
}

const statusChipClass: Record<TaskStatus, string> = {
  Overdue: 'maintenance-chip-overdue',
  Scheduled: 'maintenance-chip-scheduled',
  Completed: 'maintenance-chip-completed',
  'In Progress': 'maintenance-chip-upcoming',
  Skipped: 'maintenance-chip-overdue',
}

const statusDotColor: Record<TaskStatus, string> = {
  Scheduled: 'bg-cyan-400',
  'In Progress': 'bg-amber-400',
  Completed: 'bg-emerald-400',
  Overdue: 'bg-red-400',
  Skipped: 'bg-zinc-500',
}

const calendarDotColor: Record<TaskType, string> = {
  Preventive: 'bg-cyan-400',
  Corrective: 'bg-amber-400',
  Predictive: 'bg-violet-400',
  Emergency: 'bg-red-400',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MaintenancePage() {
  const storeMachines = useIIoTStore((s) => s.machines)
  const machineNames = useMemo(() => {
    if (storeMachines.length > 0) {
      return storeMachines.map((m) => m.name)
    }
    return MACHINE_NAMES
  }, [storeMachines])

  const [tasks, setTasks] = useState<MaintenanceTask[]>(mockTasks)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMachine, setFilterMachine] = useState<string>('all')

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Add task form state
  const [formMachine, setFormMachine] = useState('')
  const [formType, setFormType] = useState<TaskType>('Preventive')
  const [formPriority, setFormPriority] = useState<Priority>('Medium')
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formTechnician, setFormTechnician] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // ─── Computed values ─────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = startOfDay(new Date())
    const weekLater = addDays(now, 7)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const upcoming = tasks.filter(
      (t) =>
        (t.status === 'Scheduled' || t.status === 'In Progress') &&
        !isBefore(new Date(t.scheduledDate), now) &&
        !isBefore(weekLater, new Date(t.scheduledDate))
    ).length

    const overdue = tasks.filter((t) => t.status === 'Overdue').length

    const completedThisMonth = tasks.filter(
      (t) =>
        t.status === 'Completed' &&
        !isBefore(new Date(t.scheduledDate), monthStart) &&
        !isBefore(monthEnd, new Date(t.scheduledDate))
    ).length

    const totalScheduled = tasks.filter((t) => t.status !== 'Skipped').length
    const totalCompleted = tasks.filter((t) => t.status === 'Completed').length
    const avgRate = totalScheduled > 0 ? ((totalCompleted / totalScheduled) * 100).toFixed(1) : '0.0'

    return { upcoming, overdue, completedThisMonth, avgRate }
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false
      if (filterType !== 'all' && t.taskType !== filterType) return false
      if (filterMachine !== 'all' && t.machine !== filterMachine) return false
      return true
    })
  }, [tasks, filterStatus, filterPriority, filterType, filterMachine])

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all' || filterMachine !== 'all'

  const clearFilters = useCallback(() => {
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterType('all')
    setFilterMachine('all')
  }, [])

  // ─── Calendar helpers ────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDay = getDay(monthStart) // 0=Sun
    return { days, startDay }
  }, [calendarMonth])

  const getTasksForDay = useCallback(
    (day: Date) => tasks.filter((t) => isSameDay(new Date(t.scheduledDate), day)),
    [tasks]
  )

  // ─── Add task handler ────────────────────────────────────────────────────

  const handleAddTask = useCallback(() => {
    if (!formMachine || !formDate || !formTechnician || !formDuration) return
    const newId = `MT-${2415 + tasks.length}`
    const newTask: MaintenanceTask = {
      id: newId,
      machine: formMachine,
      taskType: formType,
      priority: formPriority,
      scheduledDate: formDate,
      status: 'Scheduled',
      assignedTo: formTechnician,
      estimatedDuration: formDuration,
      description: formDescription,
    }
    setTasks((prev) => [newTask, ...prev])
    setDialogOpen(false)
    // Reset form
    setFormMachine('')
    setFormType('Preventive')
    setFormPriority('Medium')
    setFormDate(format(new Date(), 'yyyy-MM-dd'))
    setFormTechnician('')
    setFormDuration('')
    setFormDescription('')
  }, [formMachine, formDate, formTechnician, formDuration, formType, formPriority, formDescription, tasks.length])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={Wrench}
        title="Maintenance Schedule"
        description="Plan and track equipment maintenance tasks"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="size-4" />
              <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add Task</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px] bg-card border-border/60">
                <DialogHeader>
                  <DialogTitle className="text-base">Add Maintenance Task</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Schedule a new maintenance task for equipment.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Machine / Asset</Label>
                    <Select value={formMachine} onValueChange={setFormMachine}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select machine..." />
                      </SelectTrigger>
                      <SelectContent>
                        {machineNames.map((name) => (
                          <SelectItem key={name} value={name} className="text-sm">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Task Type</Label>
                      <Select value={formType} onValueChange={(v) => setFormType(v as TaskType)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Preventive" className="text-sm">Preventive</SelectItem>
                          <SelectItem value="Corrective" className="text-sm">Corrective</SelectItem>
                          <SelectItem value="Predictive" className="text-sm">Predictive</SelectItem>
                          <SelectItem value="Emergency" className="text-sm">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Priority</Label>
                      <Select value={formPriority} onValueChange={(v) => setFormPriority(v as Priority)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Critical" className="text-sm">Critical</SelectItem>
                          <SelectItem value="High" className="text-sm">High</SelectItem>
                          <SelectItem value="Medium" className="text-sm">Medium</SelectItem>
                          <SelectItem value="Low" className="text-sm">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Scheduled Date</Label>
                      <Input
                        type="date"
                        className="h-9 text-sm"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Estimated Duration</Label>
                      <Input
                        type="text"
                        className="h-9 text-sm"
                        placeholder="e.g. 2h, 30min"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Assigned Technician</Label>
                    <Select value={formTechnician} onValueChange={setFormTechnician}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select technician..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNICIANS.map((name) => (
                          <SelectItem key={name} value={name} className="text-sm">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      className="text-sm min-h-[80px] resize-none"
                      placeholder="Describe the maintenance task..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddTask}>
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* ─── KPI Summary Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        <Card className="border-border/50 kpi-card-hover">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <Clock className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground metric-label">Upcoming Tasks</p>
              <p className="text-2xl font-bold text-cyan-400 metric-value">{stats.upcoming}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Next 7 days</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 kpi-card-hover cursor-pointer" onClick={() => { setFilterStatus(filterStatus === 'Overdue' ? 'all' : 'Overdue') }}>
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground metric-label">Overdue Tasks {filterStatus === 'Overdue' ? '(filtered)' : ''}</p>
              <p className="text-2xl font-bold text-red-400 metric-value">{stats.overdue}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Click to filter</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 kpi-card-hover cursor-pointer" onClick={() => { setFilterStatus(filterStatus === 'Completed' ? 'all' : 'Completed') }}>
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground metric-label">Completed This Month {filterStatus === 'Completed' ? '(filtered)' : ''}</p>
              <p className="text-2xl font-bold text-emerald-400 metric-value">{stats.completedThisMonth}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">On schedule</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 kpi-card-hover">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground metric-label">Avg Completion Rate</p>
              <p className="text-2xl font-bold text-primary metric-value">{stats.avgRate}%</p>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">+2.3% from last month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────────── */}
      <Card className="border-border/50 animate-slide-up stagger-2">
        <CardContent className="pt-4 px-5 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="Scheduled" className="text-xs">Scheduled</SelectItem>
                <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                <SelectItem value="Overdue" className="text-xs">Overdue</SelectItem>
                <SelectItem value="Skipped" className="text-xs">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
                <SelectItem value="Critical" className="text-xs">Critical</SelectItem>
                <SelectItem value="High" className="text-xs">High</SelectItem>
                <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                <SelectItem value="Low" className="text-xs">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Task Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="Preventive" className="text-xs">Preventive</SelectItem>
                <SelectItem value="Corrective" className="text-xs">Corrective</SelectItem>
                <SelectItem value="Predictive" className="text-xs">Predictive</SelectItem>
                <SelectItem value="Emergency" className="text-xs">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMachine} onValueChange={setFilterMachine}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Machines</SelectItem>
                {machineNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground" onClick={clearFilters}>
                <X className="size-3" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Table View ──────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <Card className="border-border/50 animate-slide-up stagger-3">
          <CardContent className="pt-5 px-5 pb-5">
            <div className="max-h-[calc(100vh-420px)] overflow-y-auto rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Task ID</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Machine</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden sm:table-cell">Priority</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden lg:table-cell">Technician</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hidden xl:table-cell">Duration</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Inbox className="size-8 text-muted-foreground/30" />
                          <p className="text-sm font-medium text-muted-foreground">No maintenance tasks found</p>
                          <p className="text-xs text-muted-foreground/50">Try adjusting your filter criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((task) => {
                      const tc = taskTypeConfig[task.taskType]
                      const pc = priorityConfig[task.priority]
                      const chipClass = statusChipClass[task.status]
                      const dotColor = statusDotColor[task.status]
                      return (
                        <TableRow key={task.id} className={`table-row-severity zebra-row ${index % 2 === 0 ? '' : 'bg-muted/[0.02]'}`}>
                          <TableCell className="font-mono text-xs font-medium py-3">{task.id}</TableCell>
                          <TableCell className="py-3">
                            <div className="font-medium text-sm">{task.machine}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-3">
                            <Badge
                              variant="outline"
                              className={`${tc.bg} ${tc.color} ${tc.border} ring-2 ${tc.ring} text-xs`}
                              style={{ boxShadow: 'none' }}
                            >
                              {task.taskType}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-3">
                            <Badge
                              variant="outline"
                              className={`${pc.bg} ${pc.color} ${pc.border} ring-2 ${pc.ring} text-xs`}
                              style={{ boxShadow: 'none' }}
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-muted-foreground">
                            {format(new Date(task.scheduledDate), 'MMM dd')}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${chipClass}`}>
                              <span className={`size-1.5 rounded-full ${dotColor}`} />
                              {task.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell py-3 text-sm text-muted-foreground">
                            {task.assignedTo}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell py-3 text-sm text-muted-foreground metric-value">
                            {task.estimatedDuration}
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button className="ghost-action-btn" title="View details">
                                <Eye className="size-4" />
                              </button>
                              <button className="ghost-action-btn" title="Edit task">
                                <Pencil className="size-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
              <span>Showing {filtered.length} of {tasks.length} tasks</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Calendar View ───────────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <Card className="border-border/50 animate-slide-up stagger-3 glass-card">
          <CardContent className="pt-5 px-5 pb-5">
            {/* Calendar header with navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <h3 className="text-sm font-semibold tracking-tight">
                {format(calendarMonth, 'MMMM yyyy')}
              </h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-border/20 rounded-lg overflow-hidden">
              {/* Empty cells for offset */}
              {Array.from({ length: calendarDays.startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-card/50 min-h-[72px] sm:min-h-[88px] p-1.5" />
              ))}

              {/* Day cells */}
              {calendarDays.days.map((day) => {
                const dayTasks = getTasksForDay(day)
                const todayFlag = isToday(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-card/50 min-h-[72px] sm:min-h-[88px] p-1.5 transition-colors hover:bg-muted/20 ${todayFlag ? 'ring-1 ring-primary/30' : ''}`}
                  >
                    <div className={`text-[11px] font-medium mb-1 ${todayFlag ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium leading-tight max-w-full truncate"
                          title={`${task.id} - ${task.taskType}: ${task.description}`}
                        >
                          <span className={`size-1.5 rounded-full shrink-0 ${calendarDotColor[task.taskType]}`} />
                          <span className="truncate text-muted-foreground/80">{task.id}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-muted-foreground/50 px-1">+{dayTasks.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Calendar legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">Task Types:</span>
              {(['Preventive', 'Corrective', 'Predictive', 'Emergency'] as TaskType[]).map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${calendarDotColor[type]}`} />
                  <span className="text-[11px] text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
