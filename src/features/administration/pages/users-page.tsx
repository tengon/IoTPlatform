'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  Eye,
  Trash2,
  Mail,
  Shield,
  Clock,
  Fingerprint,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import { SortableTableHeader, useSort } from '@/shared/components/sortable-table-header'
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { useIIoTStore } from '@/store/iiot'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow, format } from 'date-fns'

export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'Supervisor' | 'Engineer' | 'Operator'
  status: 'active' | 'inactive'
  lastLogin?: string | null
  createdAt?: string | null
}

const initialMockUsers: User[] = [
  { id: 'USR-001', name: 'James Wilson', email: 'james.wilson@factory.io', role: 'Admin', status: 'active', lastLogin: '2024-01-15T10:30:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'USR-002', name: 'Sarah Chen', email: 'sarah.chen@factory.io', role: 'Manager', status: 'active', lastLogin: '2024-01-15T09:15:00Z', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'USR-003', name: 'Michael Park', email: 'michael.park@factory.io', role: 'Supervisor', status: 'active', lastLogin: '2024-01-15T08:45:00Z', createdAt: '2024-01-03T00:00:00Z' },
  { id: 'USR-004', name: 'Emily Rodriguez', email: 'emily.rodriguez@factory.io', role: 'Engineer', status: 'active', lastLogin: '2024-01-15T07:00:00Z', createdAt: '2024-01-04T00:00:00Z' },
  { id: 'USR-005', name: 'David Kim', email: 'david.kim@factory.io', role: 'Engineer', status: 'active', lastLogin: '2024-01-14T16:30:00Z', createdAt: '2024-01-05T00:00:00Z' },
  { id: 'USR-006', name: 'Lisa Thompson', email: 'lisa.thompson@factory.io', role: 'Operator', status: 'active', lastLogin: '2024-01-15T06:00:00Z', createdAt: '2024-01-06T00:00:00Z' },
  { id: 'USR-007', name: 'Robert Zhang', email: 'robert.zhang@factory.io', role: 'Operator', status: 'inactive', lastLogin: '2024-01-10T14:20:00Z', createdAt: '2024-01-07T00:00:00Z' },
  { id: 'USR-008', name: 'Anna Müller', email: 'anna.muller@factory.io', role: 'Supervisor', status: 'active', lastLogin: '2024-01-15T09:50:00Z', createdAt: '2024-01-08T00:00:00Z' },
  { id: 'USR-009', name: 'Carlos Silva', email: 'carlos.silva@factory.io', role: 'Manager', status: 'inactive', lastLogin: '2024-01-05T11:30:00Z', createdAt: '2024-01-09T00:00:00Z' },
]

const roleConfig: Record<string, { color: string; bg: string; border: string }> = {
  Admin: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  Manager: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Supervisor: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  Engineer: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Operator: { color: 'text-muted-foreground', bg: 'bg-primary/10', border: 'border-primary/30' },
}

const roles = ['Admin', 'Manager', 'Supervisor', 'Engineer', 'Operator'] as const

function normalizeRole(role: string): User['role'] {
  const r = (role || '').toLowerCase()
  if (r === 'admin') return 'Admin'
  if (r === 'manager') return 'Manager'
  if (r === 'supervisor') return 'Supervisor'
  if (r === 'engineer') return 'Engineer'
  return 'Operator'
}

function getInitials(name: string): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'Never'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Never'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Never'
  }
}

function formatFullDate(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '-'
    return format(d, 'PPpp')
  } catch {
    return '-'
  }
}

export function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>(initialMockUsers)
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Operator' as User['role'], active: true })
  const [isCreating, setIsCreating] = useState(false)

  const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null)
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

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

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.data) && json.data.length > 0) {
          const mapped: User[] = json.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: normalizeRole(u.role),
            status: u.status === 'inactive' ? 'inactive' : 'active',
            lastLogin: u.lastLogin || null,
            createdAt: u.createdAt || null,
          }))
          setUsers(mapped)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch users from API, using fallback:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'active').length
    const inactive = users.filter((u) => u.status === 'inactive').length
    return { total, active, inactive }
  }, [users])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, undefined, undefined)

  // Handle Create User
  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both name and email.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsCreating(true)
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          role: newUser.role,
          status: newUser.active ? 'active' : 'inactive',
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create user')
      }

      const created: User = {
        id: json.data?.id || `USR-${Date.now().toString().slice(-4)}`,
        name: json.data?.name || newUser.name,
        email: json.data?.email || newUser.email,
        role: normalizeRole(json.data?.role || newUser.role),
        status: newUser.active ? 'active' : 'inactive',
        lastLogin: null,
        createdAt: new Date().toISOString(),
      }

      setUsers((prev) => [created, ...prev])
      setAddDialogOpen(false)
      setNewUser({ name: '', email: '', role: 'Operator', active: true })

      toast({
        title: 'User Created',
        description: `User "${created.name}" has been added successfully.`,
      })
    } catch (err: any) {
      toast({
        title: 'Error Creating User',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Edit User
  const handleSaveEdit = async () => {
    if (!selectedUserForEdit) return
    try {
      setIsSavingEdit(true)
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserForEdit.id,
          name: selectedUserForEdit.name,
          email: selectedUserForEdit.email,
          role: selectedUserForEdit.role,
          status: selectedUserForEdit.status,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to update user')
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForEdit.id ? selectedUserForEdit : u))
      )

      if (selectedUserForView?.id === selectedUserForEdit.id) {
        setSelectedUserForView(selectedUserForEdit)
      }

      toast({
        title: 'User Updated',
        description: `Changes for "${selectedUserForEdit.name}" have been saved.`,
      })
      setSelectedUserForEdit(null)
    } catch (err: any) {
      toast({
        title: 'Error Updating User',
        description: err.message || 'Failed to update user.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return
    const userToDelete = selectedUserForDelete

    try {
      setIsDeleting(true)
      const res = await fetch(`/api/users?id=${encodeURIComponent(userToDelete.id)}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete user')
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))

      if (selectedUserForView?.id === userToDelete.id) {
        setSelectedUserForView(null)
      }

      toast({
        title: 'User Deleted',
        description: `User "${userToDelete.name}" (${userToDelete.email}) has been permanently deleted.`,
      })
      setSelectedUserForDelete(null)
    } catch (err: any) {
      toast({
        title: 'Error Deleting User',
        description: err.message || 'Failed to delete user.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage platform users, roles, and access credentials"
        lastUpdated={lastUpdatedText}
        actions={
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shadow-sm font-medium">
                <Plus className="size-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account for the platform</DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="new-user-name">Full Name</Label>
                  <Input
                    id="new-user-name"
                    placeholder="e.g. John Doe"
                    className="border-border/50"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-email">Email Address</Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    placeholder="user@factory.io"
                    className="border-border/50"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser({ ...newUser, role: v as User['role'] })}
                  >
                    <SelectTrigger id="new-user-role" className="w-full border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="active-toggle" className="text-sm font-medium">Active Status</Label>
                    <p className="text-xs text-muted-foreground">Allow user to log in and access system</p>
                  </div>
                  <Switch
                    id="active-toggle"
                    checked={newUser.active}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, active: checked })}
                  />
                </div>
              </div>
              <Separator />
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating} className="gap-2">
                  {isCreating && <Loader2 className="size-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-1">
        <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
          <CardContent className="pt-5 px-5 pb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
              <p className="text-xs text-muted-foreground">Active Users</p>
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
              <p className="text-xs text-muted-foreground">Inactive Users</p>
              <p className="text-2xl font-bold text-red-400 metric-value">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/40 stagger-2">
        <CardContent className="pt-5 px-5 pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                className="pl-9 border-border/50 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs px-3 h-7">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="text-xs px-3 h-7">
                    Inactive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30 bg-muted/20">
                  <SortableTableHeader
                    label="User"
                    sortDirection={sortKey === 'name' ? sortDir : null}
                    onSort={() => toggleSort('name')}
                  />
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-3 hidden md:table-cell">
                    Email
                  </TableHead>
                  <SortableTableHeader
                    label="Role"
                    sortDirection={sortKey === 'role' ? sortDir : null}
                    onSort={() => toggleSort('role')}
                  />
                  <SortableTableHeader
                    label="Status"
                    sortDirection={sortKey === 'status' ? sortDir : null}
                    onSort={() => toggleSort('status')}
                  />
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-3 hidden lg:table-cell">
                    Last Login
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-3 text-right w-[140px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 text-primary animate-spin" />
                        <p className="text-sm">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-xs text-muted-foreground/60">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((user) => {
                    const rc = roleConfig[user.role] || roleConfig.Operator
                    const isInactive = user.status === 'inactive'
                    return (
                      <TableRow
                        key={user.id}
                        className={`hover:bg-muted/30 transition-colors duration-150 ${
                          isInactive ? 'opacity-70 bg-muted/10' : ''
                        }`}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 ring-1 ring-border/50 shadow-sm">
                              <AvatarFallback
                                className={`text-xs font-semibold ${
                                  isInactive
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                {user.name}
                              </div>
                              <div className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-0.5">
                                <Mail className="size-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3">
                          {user.email}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`${rc.bg} ${rc.color} ${rc.border} text-xs font-medium`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs gap-1.5 font-medium ${
                              isInactive
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isInactive ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'
                              }`}
                            />
                            {isInactive ? 'Inactive' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground py-3">
                          {formatRelativeTime(user.lastLogin)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* VIEW BUTTON */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                              title="View user details"
                              aria-label={`View user ${user.name}`}
                              onClick={() => setSelectedUserForView(user)}
                            >
                              <Eye className="size-4" />
                            </Button>

                            {/* EDIT BUTTON */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Edit user"
                              aria-label={`Edit user ${user.name}`}
                              onClick={() => setSelectedUserForEdit({ ...user })}
                            >
                              <Pencil className="size-3.5" />
                            </Button>

                            {/* DELETE BUTTON */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete user"
                              aria-label={`Delete user ${user.name}`}
                              onClick={() => setSelectedUserForDelete(user)}
                            >
                              <Trash2 className="size-3.5" />
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

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              Showing {sorted.length} of {users.length} users
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW USER DETAILS DIALOG                                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={!!selectedUserForView}
        onOpenChange={(open) => !open && setSelectedUserForView(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="size-4 text-cyan-400" />
              User Profile Details
            </DialogTitle>
            <DialogDescription>
              Detailed account information and platform access privileges
            </DialogDescription>
          </DialogHeader>

          {selectedUserForView && (
            <div className="space-y-5 py-1">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-muted/30 to-background border border-border/50">
                <Avatar className="size-14 ring-2 ring-primary/30 shadow-md">
                  <AvatarFallback className="text-base font-bold bg-primary/20 text-primary">
                    {getInitials(selectedUserForView.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg leading-none text-foreground">
                    {selectedUserForView.name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {selectedUserForView.email}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className={`${
                        roleConfig[selectedUserForView.role]?.bg || 'bg-muted'
                      } ${
                        roleConfig[selectedUserForView.role]?.color || 'text-foreground'
                      } ${
                        roleConfig[selectedUserForView.role]?.border || 'border-border'
                      } text-xs font-medium`}
                    >
                      <Shield className="size-3 mr-1" />
                      {selectedUserForView.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs gap-1 font-medium ${
                        selectedUserForView.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {selectedUserForView.status === 'active' ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-red-400" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Detail Items Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Fingerprint className="size-3.5 text-muted-foreground/70" />
                    User ID
                  </div>
                  <div className="font-mono text-xs text-foreground font-medium truncate" title={selectedUserForView.id}>
                    {selectedUserForView.id}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="size-3.5 text-muted-foreground/70" />
                    Access Role
                  </div>
                  <div className="font-medium text-foreground text-xs">
                    {selectedUserForView.role} Permissions
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground/70" />
                    Last Login
                  </div>
                  <div className="font-medium text-foreground text-xs">
                    {formatRelativeTime(selectedUserForView.lastLogin)}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70">
                    {formatFullDate(selectedUserForView.lastLogin)}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground/70" />
                    Account Created
                  </div>
                  <div className="font-medium text-foreground text-xs">
                    {formatFullDate(selectedUserForView.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />
          <DialogFooter className="flex sm:justify-between items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 gap-1.5 mr-auto"
              onClick={() => {
                const user = selectedUserForView
                setSelectedUserForView(null)
                if (user) setSelectedUserForDelete(user)
              }}
            >
              <Trash2 className="size-3.5" />
              Delete User
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const user = selectedUserForView
                  setSelectedUserForView(null)
                  if (user) setSelectedUserForEdit({ ...user })
                }}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button size="sm" onClick={() => setSelectedUserForView(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* EDIT USER DIALOG                                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={!!selectedUserForEdit}
        onOpenChange={(open) => !open && setSelectedUserForEdit(null)}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-amber-400" />
              Edit User Profile
            </DialogTitle>
            <DialogDescription>Modify user account information and role access</DialogDescription>
          </DialogHeader>
          <Separator />

          {selectedUserForEdit && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={selectedUserForEdit.name}
                  onChange={(e) =>
                    setSelectedUserForEdit({ ...selectedUserForEdit, name: e.target.value })
                  }
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUserForEdit.email}
                  onChange={(e) =>
                    setSelectedUserForEdit({ ...selectedUserForEdit, email: e.target.value })
                  }
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={selectedUserForEdit.role}
                  onValueChange={(v) =>
                    setSelectedUserForEdit({
                      ...selectedUserForEdit,
                      role: v as User['role'],
                    })
                  }
                >
                  <SelectTrigger id="edit-role" className="w-full border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-status-toggle" className="text-sm font-medium">Active Account</Label>
                  <p className="text-xs text-muted-foreground">
                    {selectedUserForEdit.status === 'active'
                      ? 'Account is active and able to sign in'
                      : 'Account is deactivated'}
                  </p>
                </div>
                <Switch
                  id="edit-status-toggle"
                  checked={selectedUserForEdit.status === 'active'}
                  onCheckedChange={(checked) =>
                    setSelectedUserForEdit({
                      ...selectedUserForEdit,
                      status: checked ? 'active' : 'inactive',
                    })
                  }
                />
              </div>
            </div>
          )}

          <Separator />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedUserForEdit(null)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="gap-2">
              {isSavingEdit && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION ALERT DIALOG                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!selectedUserForDelete}
        onOpenChange={(open) => !open && setSelectedUserForDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                Delete User Account?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-2 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-foreground font-semibold">
                {selectedUserForDelete?.name}
              </strong>{' '}
              (<span className="font-mono text-xs">{selectedUserForDelete?.email}</span>)?
              <br />
              <span className="text-xs text-red-400/90 font-medium block mt-2">
                This action is permanent and cannot be undone. All associated session tokens will be invalidated.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setSelectedUserForDelete(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}