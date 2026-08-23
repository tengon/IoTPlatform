'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Shield, Cog, Plus, MapPin, Clock,
  LayoutGrid, List, Pencil, Eye, Bell, Globe, Database, Lock, Webhook,
  Sun, Moon, Monitor, AlertTriangle, Volume2, Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { useIIoTStore } from '@/store/iiot'
import { formatDistanceToNow } from 'date-fns'

// ============================================================
// SITES PAGE
// ============================================================

interface Site {
  id: string
  name: string
  code: string
  address: string
  timezone: string
  deviceCount: number
  machineCount: number
  status: 'active' | 'inactive' | 'commissioning'
}

const mockSites: Site[] = [
  { id: 'SITE-001', name: 'Main Factory - Shanghai', code: 'SH-01', address: '1234 Industrial Blvd, Pudong, Shanghai', timezone: 'Asia/Shanghai', deviceCount: 124, machineCount: 32, status: 'active' },
  { id: 'SITE-002', name: 'Assembly Plant - Suzhou', code: 'SZ-01', address: '5678 Tech Park Rd, SIP, Suzhou', timezone: 'Asia/Shanghai', deviceCount: 86, machineCount: 18, status: 'active' },
  { id: 'SITE-003', name: 'Warehouse - Hangzhou', code: 'HZ-01', address: '9101 Logistics Ave, Xiaoshan, Hangzhou', timezone: 'Asia/Shanghai', deviceCount: 42, machineCount: 8, status: 'commissioning' },
  { id: 'SITE-004', name: 'R&D Center - Beijing', code: 'BJ-01', address: '1115 Innovation St, Haidian, Beijing', timezone: 'Asia/Shanghai', deviceCount: 28, machineCount: 5, status: 'inactive' },
]

const siteStatusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Active' },
  inactive: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Inactive' },
  commissioning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Commissioning' },
}

export function SitesPage() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [dialogOpen, setDialogOpen] = useState(false)
  const lastUpdate = useIIoTStore((s) => s.lastUpdate)
  const [lastUpdatedText, setLastUpdatedText] = useState('')

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

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={Building2}
        title="Sites"
        description="Manage factory sites and locations"
        lastUpdated={lastUpdatedText}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border/40 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-9 p-0 rounded-none border-0 ${viewMode === 'cards' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-9 p-0 rounded-none border-0 ${viewMode === 'table' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                onClick={() => setViewMode('table')}
              >
                <List className="size-4" />
              </Button>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Add Site
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Add New Site</DialogTitle>
                  <DialogDescription>Create a new factory site location</DialogDescription>
                </DialogHeader>
                <Separator />
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input placeholder="e.g., Main Factory - Location" className="border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Site Code</Label>
                    <Input placeholder="e.g., SH-02" className="border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea placeholder="Full address" className="border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="Asia/Shanghai">
                      <SelectTrigger className="w-full border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                        <SelectItem value="Europe/Berlin">Europe/Berlin (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => setDialogOpen(false)}>Create Site</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mockSites.map((site, idx) => {
            const sc = siteStatusConfig[site.status]
            return (
              <Card key={site.id} className={`border-border/40 hover:border-border/60 transition-colors duration-300 relative overflow-hidden ${site.status === 'inactive' ? 'grayscale-[40%] brightness-90' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${site.status === 'active' ? 'bg-emerald-500' : site.status === 'commissioning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold">{site.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{site.code}</span>
                        <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} text-xs`}>{sc.label}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed">{site.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" />
                    <span className="text-xs">{site.timezone}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-item-label">Devices</span>
                      <span className="stat-item-value">{site.deviceCount}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Machines</span>
                      <span className="stat-item-value">{site.machineCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border/40">
          <CardContent className="pt-5 px-5 pb-5">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Site</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Code</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden md:table-cell">Address</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden lg:table-cell">Timezone</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Devices</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Machines</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSites.map((site) => {
                    const sc = siteStatusConfig[site.status]
                    return (
                      <TableRow key={site.id} className={`table-row-severity hover:bg-muted/20 transition-colors duration-150 ${site.status === 'inactive' ? 'grayscale-[30%]' : ''}`}>
                        <TableCell className="font-medium text-sm py-3">{site.name}</TableCell>
                        <TableCell className="font-mono text-xs py-3">{site.code}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate py-3">{site.address}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground py-3">{site.timezone}</TableCell>
                        <TableCell className="font-mono text-sm py-3 metric-value">{site.deviceCount}</TableCell>
                        <TableCell className="font-mono text-sm py-3 metric-value">{site.machineCount}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} text-xs`}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                              <Eye className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                              <Pencil className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// ROLES & PERMISSIONS PAGE
// ============================================================

interface RolePermission {
  id: string
  name: string
  description: string
  userCount: number
  color: string
  bg: string
  border: string
  permissions: {
    Dashboard: boolean
    Monitoring: boolean
    Analytics: boolean
    Alerts: boolean
    Devices: boolean
    Admin: boolean
  }
}

const permissionKeys = ['Dashboard', 'Monitoring', 'Analytics', 'Alerts', 'Devices', 'Admin'] as const

const initialRoles: RolePermission[] = [
  { id: 'role-admin', name: 'Admin', description: 'Full system access with all administrative privileges', userCount: 2, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: true, Admin: true } },
  { id: 'role-manager', name: 'Manager', description: 'Supervisory access with production and analytics capabilities', userCount: 3, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: true, Admin: false } },
  { id: 'role-supervisor', name: 'Supervisor', description: 'Shift oversight with monitoring and alert management', userCount: 5, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: false, Admin: false } },
  { id: 'role-engineer', name: 'Engineer', description: 'Technical access for device management and analytics', userCount: 8, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: true, Admin: false } },
  { id: 'role-operator', name: 'Operator', description: 'Basic access for monitoring and dashboard viewing', userCount: 15, color: 'text-muted-foreground', bg: 'bg-primary/10', border: 'border-primary/30', permissions: { Dashboard: true, Monitoring: true, Analytics: false, Alerts: true, Devices: false, Admin: false } },
]

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RolePermission[]>(initialRoles)
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null)
  const [tempPerms, setTempPerms] = useState<RolePermission['permissions'] | null>(null)
  const lastUpdate = useIIoTStore((s) => s.lastUpdate)
  const [lastUpdatedText, setLastUpdatedText] = useState('')

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

  const openEditDialog = (role: RolePermission) => {
    setEditingRole(role)
    setTempPerms({ ...role.permissions })
  }

  const savePermissions = () => {
    if (!editingRole || !tempPerms) return
    setRoles(roles.map((r) => r.id === editingRole.id ? { ...r, permissions: tempPerms } : r))
    setEditingRole(null)
    setTempPerms(null)
  }

  const togglePerm = (key: keyof RolePermission['permissions']) => {
    if (!tempPerms) return
    setTempPerms({ ...tempPerms, [key]: !tempPerms[key] })
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={Shield}
        title="Roles & Permissions"
        description="Configure user roles and permissions"
        lastUpdated={lastUpdatedText}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role, idx) => (
          <Card key={role.id} className="border-border/40 hover:border-border/60 transition-colors duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
                    <Badge variant="outline" className={`${role.bg} ${role.color} ${role.border} text-xs`}>{role.userCount} users</Badge>
                  </div>
                  <CardDescription className="text-xs">{role.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => openEditDialog(role)}>
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Separator className="mb-3" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {permissionKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`size-4 rounded flex items-center justify-center shrink-0 ${role.permissions[key] ? 'bg-emerald-500/20' : 'bg-muted/50'}`}>
                      {role.permissions[key] && (
                        <svg className="size-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${role.permissions[key] ? 'text-foreground' : 'text-muted-foreground/60'}`}>{key}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingRole} onOpenChange={(open) => { if (!open) { setEditingRole(null); setTempPerms(null) } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Permissions - {editingRole?.name}</DialogTitle>
            <DialogDescription>Toggle permissions for the {editingRole?.name} role</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="py-2 space-y-3">
            {permissionKeys.map((key) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="text-sm">{key}</Label>
                <Switch
                  checked={tempPerms?.[key] ?? false}
                  onCheckedChange={() => togglePerm(key)}
                />
              </div>
            ))}
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingRole(null); setTempPerms(null) }}>Cancel</Button>
            <Button onClick={savePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// SETTINGS PAGE
// ============================================================

export function SettingsPage() {
  const { toast } = useToast()
  const isConnected = useIIoTStore((s) => s.isConnected)
  const lastUpdate = useIIoTStore((s) => s.lastUpdate)
  const [settings, setSettings] = useState({
    platformName: 'IIoT Monitor Pro',
    timezone: 'Asia/Shanghai',
    language: 'en',
    emailNotif: true,
    smsNotif: false,
    inAppNotif: true,
    soundAlerts: false,
    desktopPush: false,
    theme: 'system' as 'light' | 'dark' | 'system',
    defaultPage: 'dashboard' as string,
    compactMode: false,
    showSparklines: true,
    retentionDays: 90,
    sessionTimeout: 30,
    twoFactor: false,
    rateLimit: '1000',
    webhookUrl: '',
    reconnectInterval: 5000,
    maxRetryAttempts: 10,
  })
  const [lastUpdatedText, setLastUpdatedText] = useState('')

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

  const update = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <PageHeader
        icon={Cog}
        title="Platform Settings"
        description="Configure platform-wide settings"
        lastUpdated={lastUpdatedText}
        actions={
          <Button size="sm" className="gap-2" onClick={() => toast({ title: 'Settings saved successfully' })}>
            <Cog className="size-4" />
            Save Settings
          </Button>
        }
      />

      <div className="space-y-8 max-w-3xl">
        {/* General */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">General</CardTitle>
            </div>
            <CardDescription className="text-xs">Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input value={settings.platformName} onChange={(e) => update('platformName', e.target.value)} className="border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => update('timezone', v)}>
                  <SelectTrigger className="w-full border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                    <SelectItem value="Europe/Berlin">Europe/Berlin (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={(v) => update('language', v)}>
                <SelectTrigger className="w-full max-w-xs border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Display */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Display</CardTitle>
            </div>
            <CardDescription className="text-xs">Customize appearance and layout preferences</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {([
                  { value: 'light' as const, icon: Sun, label: 'Light' },
                  { value: 'dark' as const, icon: Moon, label: 'Dark' },
                  { value: 'system' as const, icon: Monitor, label: 'System' },
                ]).map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={settings.theme === value ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => update('theme', value)}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Page on Login</Label>
              <Select value={settings.defaultPage} onValueChange={(v) => update('defaultPage', v)}>
                <SelectTrigger className="w-full max-w-xs border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="live-monitoring">Live Monitoring</SelectItem>
                  <SelectItem value="active-alarms">Active Alarms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground">Reduce spacing and element sizes</p>
              </div>
              <Switch checked={settings.compactMode} onCheckedChange={(v) => update('compactMode', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Sparklines on Dashboard</Label>
                <p className="text-xs text-muted-foreground">Display mini trend charts on dashboard cards</p>
              </div>
              <Switch checked={settings.showSparklines} onCheckedChange={(v) => update('showSparklines', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
            </div>
            <CardDescription className="text-xs">Configure notification delivery channels</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch checked={settings.emailNotif} onCheckedChange={(v) => update('emailNotif', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive critical alerts via SMS</p>
              </div>
              <Switch checked={settings.smsNotif} onCheckedChange={(v) => update('smsNotif', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>In-App Notifications</Label>
                <p className="text-xs text-muted-foreground">Show notifications in the platform</p>
              </div>
              <Switch checked={settings.inAppNotif} onCheckedChange={(v) => update('inAppNotif', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5"><Volume2 className="size-3.5" /> Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">Play audio for critical alarms</p>
              </div>
              <Switch checked={settings.soundAlerts} onCheckedChange={(v) => update('soundAlerts', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desktop Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Browser push for background alerts</p>
              </div>
              <Switch checked={settings.desktopPush} onCheckedChange={(v) => update('desktopPush', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Data Retention</CardTitle>
            </div>
            <CardDescription className="text-xs">Manage how long data is stored</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label>Retention Period (Days)</Label>
              <Input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => update('retentionDays', Number(e.target.value))}
                min={1}
                max={3650}
                className="border-border/50"
              />
              <p className="text-xs text-muted-foreground">Data older than this will be automatically purged</p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Security</CardTitle>
            </div>
            <CardDescription className="text-xs">Platform security configuration</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Session Timeout (Minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => update('sessionTimeout', Number(e.target.value))}
                  min={5}
                  max={480}
                  className="border-border/50"
                />
              </div>
              <div className="flex items-center justify-between sm:pt-6">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch checked={settings.twoFactor} onCheckedChange={(v) => update('twoFactor', v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Webhook className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">API</CardTitle>
            </div>
            <CardDescription className="text-xs">API access and webhook configuration</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rate Limit (requests/min)</Label>
                <Input
                  value={settings.rateLimit}
                  onChange={(e) => update('rateLimit', e.target.value)}
                  className="border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-webhook.com/endpoint"
                  value={settings.webhookUrl}
                  onChange={(e) => update('webhookUrl', e.target.value)}
                  className="border-border/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* WebSocket */}
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Webhook className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">WebSocket</CardTitle>
            </div>
            <CardDescription className="text-xs">Real-time connection settings</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`} />
              <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Reconnection Interval (ms)</Label>
                <Input
                  type="number"
                  value={settings.reconnectInterval}
                  onChange={(e) => update('reconnectInterval', Number(e.target.value))}
                  min={1000}
                  max={60000}
                  className="border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Retry Attempts</Label>
                <Input
                  type="number"
                  value={settings.maxRetryAttempts}
                  onChange={(e) => update('maxRetryAttempts', Number(e.target.value))}
                  min={1}
                  max={100}
                  className="border-border/50"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast({ title: 'Connection OK', description: 'WebSocket connection test passed.' })}
            >
              Test Connection
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/30 hover:border-red-500/50 transition-colors duration-300">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              <CardTitle className="text-sm font-semibold text-red-500">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-xs">Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => console.log('Reset all settings to default')}
              >
                <Trash2 className="size-4" />
                Reset All Settings to Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => console.log('Export all data')}
              >
                Export All Data
              </Button>
            </div>
            <p className="text-xs text-red-400">These actions are irreversible. Please proceed with caution.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}