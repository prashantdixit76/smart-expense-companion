import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { UserRole } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Pencil, Ban, Trash2, UserCog, KeyRound, Power } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const statusColor: Record<string, string> = {
  approved: 'bg-income/10 text-income border-income/20',
  pending: 'bg-owe/10 text-owe border-owe/20',
  rejected: 'bg-expense/10 text-expense border-expense/20',
  disabled: 'bg-muted text-muted-foreground border-muted',
};

const roleColor: Record<string, string> = {
  user: 'bg-secondary text-secondary-foreground',
  admin: 'bg-primary/10 text-primary',
  super_admin: 'bg-primary text-primary-foreground',
};

const UserManagement = () => {
  const { users, expenses, incomes, adminUser, deleteUser, disableUser, enableUser, changeUserRole, updateUser, createUser, resetUserPassword } = useAppStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<string | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'user' as UserRole });
  // Edit form
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '' });
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  const isSuperAdmin = adminUser?.role === 'super_admin';

  const filtered = users.filter((u) => {
    if (search && !u.fullName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const handleCreate = () => {
    if (!createForm.fullName || !createForm.email || !createForm.password) { toast.error('Fill all required fields.'); return; }
    const result = createUser({ fullName: createForm.fullName, email: createForm.email, phone: createForm.phone, status: 'approved', role: createForm.role }, createForm.password);
    if (result.success) { toast.success(result.message); setShowCreate(false); setCreateForm({ fullName: '', email: '', phone: '', password: '', role: 'user' }); }
    else toast.error(result.message);
  };

  const viewUser = users.find(u => u.id === selectedUser);
  const editingUser = users.find(u => u.id === editUser);

  const startEdit = (u: typeof users[0]) => {
    setEditUser(u.id);
    setEditForm({ fullName: u.fullName, email: u.email, phone: u.phone });
    setNewRole(u.role);
    setNewPassword('');
  };

  const saveEdit = () => {
    if (!editUser) return;
    updateUser(editUser, editForm);
    if (newRole !== editingUser?.role) changeUserRole(editUser, newRole);
    if (newPassword) resetUserPassword(editUser, newPassword);
    toast.success('User updated!');
    setEditUser(null);
  };

  const getUserExpenses = (userId: string) => expenses.filter(e => e.paidBy === userId).reduce((s, e) => s + e.amount, 0);
  const getUserIncome = (userId: string) => incomes.filter(i => i.date).reduce((s, i) => s + i.amount, 0); // simplified
  const getUserGroups = (userId: string) => new Set(expenses.filter(e => e.type === 'group' && (e.paidBy === userId || e.splitWith.includes(userId))).map(e => e.splitWith.sort().join(','))).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        {isSuperAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" />Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full Name</Label><Input value={createForm.fullName} onChange={e => setCreateForm({...createForm, fullName: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} /></div>
                <div><Label>Phone</Label><Input value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} /></div>
                <div><Label>Password</Label><Input type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={createForm.role} onValueChange={v => setCreateForm({...createForm, role: v as UserRole})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate}>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{u.phone}</TableCell>
                  <TableCell><Badge className={`text-[10px] capitalize ${roleColor[u.role]}`}>{u.role.replace('_', ' ')}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusColor[u.status]}`}>{u.status}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {(() => { try { return format(parseISO(u.createdAt), 'dd MMM yy'); } catch { return 'N/A'; } })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedUser(u.id)} title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {isSuperAdmin && u.id !== adminUser?.id && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(u)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            if (u.status === 'disabled') { enableUser(u.id); toast.success('User enabled.'); }
                            else { disableUser(u.id); toast.info('User disabled.'); }
                          }} title={u.status === 'disabled' ? 'Enable' : 'Disable'}>
                            {u.status === 'disabled' ? <Power className="w-3.5 h-3.5 text-income" /> : <Ban className="w-3.5 h-3.5 text-owe" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteUser(u.id); toast.success('User deleted.'); }} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
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
      </Card>

      {/* View User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {viewUser.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{viewUser.fullName}</p>
                  <Badge className={`text-[10px] capitalize ${roleColor[viewUser.role]}`}>{viewUser.role.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Email</p><p>{viewUser.email}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p>{viewUser.phone || 'N/A'}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><Badge variant="outline" className={`text-[10px] capitalize ${statusColor[viewUser.status]}`}>{viewUser.status}</Badge></div>
                <div><p className="text-muted-foreground text-xs">Created</p><p>{(() => { try { return format(parseISO(viewUser.createdAt), 'dd MMM yyyy'); } catch { return 'N/A'; } })()}</p></div>
                <div><p className="text-muted-foreground text-xs">Total Expenses</p><p className="font-medium">₹{getUserExpenses(viewUser.id).toLocaleString('en-IN')}</p></div>
                <div><p className="text-muted-foreground text-xs">Groups Joined</p><p className="font-medium">{getUserGroups(viewUser.id)}</p></div>
                <div><p className="text-muted-foreground text-xs">Last Login</p><p>{viewUser.lastLogin ? format(parseISO(viewUser.lastLogin), 'dd MMM yyyy HH:mm') : 'Never'}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editingUser && (
            <div className="space-y-3">
              <div><Label>Full Name</Label><Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={v => setNewRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1"><KeyRound className="w-3 h-3" /> Reset Password (optional)</Label>
                <Input type="password" placeholder="Leave empty to keep current" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <Button className="w-full" onClick={saveEdit}>Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
