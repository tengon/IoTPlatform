'use client'

import { useState, useMemo } from 'react'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

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
  Admin: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  Manager: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  Supervisor: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' },
  Engineer: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  Operator: { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
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

function formatLastLogin(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Operator' as User['role'], active: true })

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
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage platform users and access"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="user@factory.io"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as User['role'] })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active-toggle">Active Status</Label>
                  <Switch
                    id="active-toggle"
                    checked={newUser.active}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <UserCheck className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <UserX className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => {
                    const rc = roleConfig[user.role]
                    const isInactive = user.status === 'inactive'
                    return (
                      <TableRow key={user.id} className={isInactive ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
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
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${rc.bg} ${rc.color} ${rc.border} text-xs`}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${isInactive ? 'bg-red-400/10 text-red-400 border-red-400/30' : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'}`}
                          >
                            {isInactive ? 'Inactive' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {formatLastLogin(user.lastLogin)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                              <UserX className="size-4" />
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