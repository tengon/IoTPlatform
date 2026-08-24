'use client'

import { useState } from 'react'
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface AlertRule {
  id: string
  name: string
  description: string
  metric: string
  condition: '>' | '<' | '=' | '!='
  threshold: number
  severity: 'critical' | 'warning' | 'info'
  cooldown: number
  enabled: boolean
}

const METRICS = [
  'Temperature',
  'Vibration',
  'Pressure',
  'RPM',
  'Power Consumption',
  'Current',
  'Voltage',
  'OEE',
  'Humidity',
  'Flow Rate',
]

const CONDITIONS: Array<{ value: AlertRule['condition']; label: string }> = [
  { value: '>', label: 'Greater than (>)' },
  { value: '<', label: 'Less than (<)' },
  { value: '=', label: 'Equal to (=)' },
  { value: '!=', label: 'Not equal (!=)' },
]

const INITIAL_RULES: AlertRule[] = [
  { id: 'r1', name: 'High Spindle Temp', description: 'Alert when CNC spindle exceeds safe operating temperature', metric: 'Temperature', condition: '>', threshold: 85, severity: 'critical', cooldown: 300, enabled: true },
  { id: 'r2', name: 'Vibration Anomaly', description: 'Detect abnormal vibration patterns on rotating equipment', metric: 'Vibration', condition: '>', threshold: 7.5, severity: 'warning', cooldown: 600, enabled: true },
  { id: 'r3', name: 'Low OEE Alert', description: 'Notify when machine OEE drops below acceptable threshold', metric: 'OEE', condition: '<', threshold: 65, severity: 'warning', cooldown: 1800, enabled: true },
  { id: 'r4', name: 'Overpressure', description: 'Trigger on hydraulic system overpressure conditions', metric: 'Pressure', condition: '>', threshold: 250, severity: 'critical', cooldown: 120, enabled: true },
  { id: 'r5', name: 'Power Spike', description: 'Detect sudden power consumption spikes beyond normal range', metric: 'Power Consumption', condition: '>', threshold: 45, severity: 'warning', cooldown: 300, enabled: false },
  { id: 'r6', name: 'Low RPM', description: 'Alert when motor RPM drops below minimum operating speed', metric: 'RPM', condition: '<', threshold: 1200, severity: 'warning', cooldown: 600, enabled: true },
  { id: 'r7', name: 'Voltage Dip', description: 'Detect voltage sags that could affect sensitive equipment', metric: 'Voltage', condition: '<', threshold: 380, severity: 'info', cooldown: 300, enabled: true },
  { id: 'r8', name: 'High Current Draw', description: 'Alert on excessive current draw indicating potential fault', metric: 'Current', condition: '>', threshold: 32, severity: 'critical', cooldown: 180, enabled: true },
  { id: 'r9', name: 'Humidity Drift', description: 'Monitor environmental humidity in sensitive production areas', metric: 'Humidity', condition: '>', threshold: 75, severity: 'info', cooldown: 3600, enabled: false },
  { id: 'r10', name: 'Flow Rate Low', description: 'Detect reduced coolant flow rate to prevent overheating', metric: 'Flow Rate', condition: '<', threshold: 8, severity: 'critical', cooldown: 120, enabled: true },
]

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    critical: { className: 'bg-red-500/15 text-red-400 border-red-500/25', label: 'Critical' },
    warning: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/25', label: 'Warning' },
    info: { className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25', label: 'Info' },
  }
  const v = variants[severity] || variants.info
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
  )
}

function RuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: Partial<AlertRule>
  onSave: (rule: AlertRule) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(rule.name || '')
  const [description, setDescription] = useState(rule.description || '')
  const [metric, setMetric] = useState(rule.metric || METRICS[0])
  const [condition, setCondition] = useState<AlertRule['condition']>(rule.condition || '>')
  const [threshold, setThreshold] = useState(String(rule.threshold || 0))
  const [severity, setSeverity] = useState<AlertRule['severity']>(rule.severity || 'warning')
  const [cooldown, setCooldown] = useState(String(rule.cooldown || 300))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: rule.id || `r${Date.now()}`,
      name,
      description,
      metric,
      condition,
      threshold: Number(threshold),
      severity,
      cooldown: Number(cooldown),
      enabled: rule.enabled ?? true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="rule-name">Name</Label>
          <Input
            id="rule-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rule name"
            className="bg-background"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="rule-desc">Description</Label>
          <Input
            id="rule-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the rule"
            className="bg-background"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Metric</Label>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Condition</Label>
          <Select value={condition} onValueChange={(v) => setCondition(v as AlertRule['condition'])}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-threshold">Threshold</Label>
          <Input
            id="rule-threshold"
            type="number"
            step="any"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="bg-background"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Severity</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as AlertRule['severity'])}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="rule-cooldown">Cooldown (seconds)</Label>
          <Input
            id="rule-cooldown"
            type="number"
            min={0}
            value={cooldown}
            onChange={(e) => setCooldown(e.target.value)}
            className="bg-background"
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="border-border/50">
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {rule.id ? 'Save Changes' : 'Create Rule'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_RULES)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Partial<AlertRule> | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const enabledCount = rules.filter((r) => r.enabled).length
  const criticalRulesCount = rules.filter((r) => r.severity === 'critical' && r.enabled).length

  const handleOpenAdd = () => {
    setEditingRule(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (rule: AlertRule) => {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  const handleSave = (rule: AlertRule) => {
    setRules((prev) => {
      const exists = prev.find((r) => r.id === rule.id)
      if (exists) {
        return prev.map((r) => (r.id === rule.id ? rule : r))
      }
      return [...prev, rule]
    })
    setDialogOpen(false)
    setEditingRule(null)
  }

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
    setDeleteConfirmId(null)
  }

  const formatCooldown = (seconds: number) => {
    if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`
    if (seconds >= 60) return `${Math.round(seconds / 60)}m`
    return `${seconds}s`
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={Settings}
        title="Alert Rules"
        description={`${rules.length} rules configured · ${enabledCount} active · ${criticalRulesCount} critical`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingRule(null)
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="size-4 mr-1.5" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-background border-border/60 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRule?.id ? 'Edit Alert Rule' : 'Create New Alert Rule'}</DialogTitle>
                <DialogDescription>
                  {editingRule?.id
                    ? 'Modify the alert rule configuration below.'
                    : 'Define a new alert rule to monitor your industrial equipment.'}
                </DialogDescription>
              </DialogHeader>
              <RuleForm
                rule={editingRule || {}}
                onSave={handleSave}
                onCancel={() => {
                  setDialogOpen(false)
                  setEditingRule(null)
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Rules table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-10">On</TableHead>
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400 hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-slate-400">Condition</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400 hidden md:table-cell">Cooldown</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className={`
                      border-border/30
                      ${!rule.enabled ? 'opacity-50' : ''}
                      ${rule.severity === 'critical' && rule.enabled ? 'border-l-2 border-l-red-500/50' : ''}
                      ${rule.severity === 'warning' && rule.enabled ? 'border-l-2 border-l-amber-500/40' : ''}
                      ${rule.severity === 'info' && rule.enabled ? 'border-l-2 border-l-cyan-500/30' : ''}
                    `}
                  >
                    <TableCell className="py-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggle(rule.id)}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground/90">{rule.name}</span>
                        <span className="text-xs text-muted-foreground lg:hidden">{rule.metric}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      <span className="text-xs text-foreground/60 line-clamp-1 max-w-48 block">{rule.description}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <code className="text-xs px-2 py-1 rounded bg-muted/50 text-foreground/80 font-mono">
                        {rule.metric} {rule.condition} {rule.threshold}
                      </code>
                    </TableCell>
                    <TableCell className="py-3">
                      <SeverityBadge severity={rule.severity} />
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{formatCooldown(rule.cooldown)}</span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {deleteConfirmId === rule.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => handleDelete(rule.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-border/50"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(rule)}
                            >
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                              onClick={() => setDeleteConfirmId(rule.id)}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm bg-background border-border/60">
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border/50"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
