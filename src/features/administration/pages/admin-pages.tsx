'use client'

import { useState } from 'react'
import {
  Building2, Shield, Cog, Plus, MapPin, Clock, Monitor, Cpu,
  LayoutGrid, List, Pencil, Eye,
} from 'lucide-react'
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'

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
  active: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'Active' },
  inactive: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'Inactive' },
  commissioning: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'Commissioning' },
}

export function SitesPage() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Sites"
        description="Manage factory sites and locations"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-r-none ${viewMode === 'cards' ? 'bg-muted' : ''}`} onClick={() => setViewMode('cards')}>
                <LayoutGrid className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-l-none ${viewMode === 'table' ? 'bg-muted' : ''}`} onClick={() => setViewMode('table')}>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Site</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input placeholder="e.g., Main Factory - Location" />
                  </div>
                  <div className="space-y-2">
                    <Label>Site Code</Label>
                    <Input placeholder="e.g., SH-02" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea placeholder="Full address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="Asia/Shanghai">
                      <SelectTrigger className="w-full">
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
          {mockSites.map((site) => {
            const sc = siteStatusConfig[site.status]
            return (
              <Card key={site.id} className={`border-border/50 relative overflow-hidden ${site.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${site.status === 'active' ? 'bg-emerald-500' : site.status === 'commissioning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <CardHeader className="pb-3 pt-5">
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
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed">{site.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" />
                    <span className="text-xs">{site.timezone}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="size-3.5 text-emerald-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Devices</p>
                        <p className="text-sm font-semibold">{site.deviceCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="size-3.5 text-cyan-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Machines</p>
                        <p className="text-sm font-semibold">{site.machineCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Site</TableHead>
                    <TableHead className="text-xs">Code</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Address</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Timezone</TableHead>
                    <TableHead className="text-xs">Devices</TableHead>
                    <TableHead className="text-xs">Machines</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSites.map((site) => {
                    const sc = siteStatusConfig[site.status]
                    return (
                      <TableRow key={site.id} className={site.status === 'inactive' ? 'opacity-60' : ''}>
                        <TableCell className="font-medium text-sm">{site.name}</TableCell>
                        <TableCell className="font-mono text-xs">{site.code}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{site.address}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{site.timezone}</TableCell>
                        <TableCell className="font-mono text-sm">{site.deviceCount}</TableCell>
                        <TableCell className="font-mono text-sm">{site.machineCount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} text-xs`}>{sc.label}</Badge>
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
  { id: 'role-admin', name: 'Admin', description: 'Full system access with all administrative privileges', userCount: 2, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: true, Admin: true } },
  { id: 'role-manager', name: 'Manager', description: 'Supervisory access with production and analytics capabilities', userCount: 3, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: true, Admin: false } },
  { id: 'role-supervisor', name: 'Supervisor', description: 'Shift oversight with monitoring and alert management', userCount: 5, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: false, Admin: false } },
  { id: 'role-engineer', name: 'Engineer', description: 'Technical access for device management and analytics', userCount: 8, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', permissions: { Dashboard: true, Monitoring: true, Analytics: true, Alerts: true, Devices: true, Admin: false } },
  { id: 'role-operator', name: 'Operator', description: 'Basic access for monitoring and dashboard viewing', userCount: 15, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', permissions: { Dashboard: true, Monitoring: true, Analytics: false, Alerts: true, Devices: false, Admin: false } },
]

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RolePermission[]>(initialRoles)
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null)
  const [tempPerms, setTempPerms] = useState<RolePermission['permissions'] | null>(null)

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
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="Roles & Permissions"
        description="Configure user roles and permissions"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
                    <Badge variant="outline" className={`${role.bg} ${role.color} ${role.border} text-xs`}>{role.userCount} users</Badge>
                  </div>
                  <CardDescription className="text-xs">{role.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(role)}>
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-3" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {permissionKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`size-4 rounded flex items-center justify-center ${role.permissions[key] ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                      {role.permissions[key] && (
                        <svg className="size-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${role.permissions[key] ? 'text-foreground' : 'text-muted-foreground'}`}>{key}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingRole} onOpenChange={(open) => { if (!open) { setEditingRole(null); setTempPerms(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions - {editingRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {permissionKeys.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{key}</Label>
                <Switch
                  checked={tempPerms?.[key] ?? false}
                  onCheckedChange={() => togglePerm(key)}
                />
              </div>
            ))}
          </div>
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
  const [settings, setSettings] = useState({
    platformName: 'IIoT Monitor Pro',
    timezone: 'Asia/Shanghai',
    language: 'en',
    emailNotif: true,
    smsNotif: false,
    inAppNotif: true,
    retentionDays: 90,
    sessionTimeout: 30,
    twoFactor: false,
    rateLimit: '1000',
    webhookUrl: '',
  })

  const update = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Cog}
        title="Platform Settings"
        description="Configure platform-wide settings"
        actions={
          <Button size="sm" className="gap-2">
            <Cog className="size-4" />
            Save Settings
          </Button>
        }
      />

      <div className="space-y-6 max-w-3xl">
        {/* General */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription className="text-xs">Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input value={settings.platformName} onChange={(e) => update('platformName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => update('timezone', v)}>
                  <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full max-w-xs">
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

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription className="text-xs">Configure notification delivery channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Data Retention</CardTitle>
            <CardDescription className="text-xs">Manage how long data is stored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label>Retention Period (Days)</Label>
              <Input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => update('retentionDays', Number(e.target.value))}
                min={1}
                max={3650}
              />
              <p className="text-xs text-muted-foreground">Data older than this will be automatically purged</p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription className="text-xs">Platform security configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Session Timeout (Minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => update('sessionTimeout', Number(e.target.value))}
                  min={5}
                  max={480}
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
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">API</CardTitle>
            <CardDescription className="text-xs">API access and webhook configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rate Limit (requests/min)</Label>
                <Input
                  value={settings.rateLimit}
                  onChange={(e) => update('rateLimit', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-webhook.com/endpoint"
                  value={settings.webhookUrl}
                  onChange={(e) => update('webhookUrl', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}