'use client'

import { useState, useMemo, useEffect } from 'react'
import { Users, Plus, Search, Pencil, UserX, UserCheck } from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useIIoTStore } from '@/store/iiot'
import { formatDistanceToNow } from 'date-fns'

interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'Supervisor' | 'Engineer' | 'Operator'
  status: 'active' | 'inactive'
  lastLogin: string
}

const mockUsers: User[] = [
  { id: 'USR-001', name: 'James Wilson', email: 'james.wilson@factory.io', role: 'Admin', status: 'active', lastLogin: '2024-01-15T10:30:00Z' },
  { id: 'USR-002', name: 'Sarah Chen', email: 'sarah.chen@factory.io', role: 'Manager', status: 'active', lastLogin: '2024-01-15T09:15:00Z' },
  { id: 'USR-003', name: 'Michael Park', email: 'michael.park@factory.io', role: 'Supervisor', status: 'active', lastLogin: '2024-01-15T08:45:00Z' },
  { id: 'USR-004', name: 'Emily Rodriguez', email: 'emily.rodriguez@factory.io', role: 'Engineer', status: 'active', lastLogin: '2024-01-15T07:00:00Z' },
  { id: 'USR-005', name: 'David Kim', email: 'david.kim@factory.io', role: 'Engineer', status: 'active', lastLogin: '2024-01-14T16:30:00Z' },
  { id: 'USR-006', name: 'Lisa Thompson', email: 'lisa.thompson@factory.io', role: 'Operator', status: 'active', lastLogin: '2024-01-15T06:00:00Z' },
  { id: 'USR-007', name: 'Robert Zhang', email: 'robert.zhang@factory.io', role: 'Operator', status: 'inactive', lastLogin: '2024-01-10T14:20:00Z' },
  { id: 'USR-008', name: 'Anna Müller', email: 'anna.muller@factory.io', role: 'Supervisor', status: 'active', lastLogin: '2024-01-15T09:50:00Z' },
  { id: 'USR-009', name: 'Carlos Silva', email: 'carlos.silva@factory.io', role: 'Manager', status: 'inactive', lastLogin: '2024-01-05T11:30:00Z' },
]

const roleConfig: Record<string, { color: string; bg: string; border: string }> = {
  Admin: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  Manager: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Supervisor: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  Engineer: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Operator: { color: 'text-muted-foreground', bg: 'bg-primary/10', border: 'border-primary/30' },
}

const roles = ['Admin', 'Manager', 'Supervisor', 'Engineer', 'Operator'] as const

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Operator' as User['role'], active: true })
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

  const stats = useMemo(() => {
    const total = mockUsers.length
    const active = mockUsers.filter((u) => u.status === 'active').length
    const inactive = mockUsers.filter((u) => u.status === 'inactive').length
    return { total, active, inactive }
  }, [])

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [search, roleFilter, statusFilter])

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage platform users and access"
        lastUpdated={lastUpdatedText}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account for the platform</DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Enter full name"
                    className="border-border/50"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="user@factory.io"
                    className="border-border/50"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as User['role'] })}>
                    <SelectTrigger className="w-full border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="active-toggle">Active Status</Label>
                  <Switch
                    id="active-toggle"
                    checked={newUser.active}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, active: checked })}
                  />
                </div>
              </div>
              <Separator />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-3 gap-4 stagger-1">
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold metric-value">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 hover:border-emerald-500/40 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <UserCheck className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-emerald-400 metric-value">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 hover:border-red-500/40 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <UserX className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold text-red-400 metric-value">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 stagger-2">
        <CardContent className="pt-5 px-5 pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs px-3 h-7">Active</TabsTrigger>
                  <TabsTrigger value="inactive" className="text-xs px-3 h-7">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">User</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Role</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-xs text-muted-foreground/60">Try adjusting your search or filter criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => {
                    const rc = roleConfig[user.role]
                    const isInactive = user.status === 'inactive'
                    return (
                      <TableRow key={user.id} className={`hover:bg-muted/20 transition-colors duration-150 ${isInactive ? 'opacity-60' : ''}`}>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 ring-1 ring-primary/20">
                              <AvatarFallback className={`text-xs font-medium ${isInactive ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.name}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3">{user.email}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`${rc.bg} ${rc.color} ${rc.border} text-xs`}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${isInactive ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}
                          >
                            {isInactive ? 'Inactive' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground py-3">
                          {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                              <UserX className="size-3.5" />
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
            <span>Showing {filtered.length} of {mockUsers.length} users</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}