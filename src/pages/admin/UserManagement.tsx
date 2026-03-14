import { useState, useEffect } from 'react';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Ban, Trash2, KeyRound, Power, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface UserProfile {
  id: string; user_id: string; full_name: string; email: string; phone: string | null;
  status: string; created_at: string; last_login: string | null;
  selected_plan: string | null; plan_price: number | null; plan_duration: string | null;
}

interface UserWithRole extends UserProfile { role: AppRole; }

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
  const { role: myRole } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSuperAdmin = myRole === 'super_admin';

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    const roleMap: Record<string, AppRole> = {};
    roles?.forEach(r => {
      const current = roleMap[r.user_id];
      if (!current || (r.role === 'super_admin') || (r.role === 'admin' && current === 'user')) {
        roleMap[r.user_id] = r.role;
      }
    });

    setUsers((profiles || []).map(p => ({ ...p, role: roleMap[p.user_id] || 'user' })) as UserWithRole[]);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (userId: string, profileId: string, newStatus: string) => {
    await supabase.from('profiles').update({ status: newStatus }).eq('id', profileId);
    toast.success(`User ${newStatus}.`);
    fetchUsers();
  };

  const handleDelete = async (u: UserWithRole) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await supabase.from('profiles').delete().eq('id', u.id);
    toast.success('User deleted.');
    fetchUsers();
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { user_id: resetUser.user_id, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Password reset for ${resetUser.full_name}`);
      setResetUser(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewPassword(pwd);
  };

  const viewUser = users.find(u => u.id === selectedUser);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">User Management</h1>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="disabled">Disabled</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell><Badge className={`text-[10px] capitalize ${roleColor[u.role]}`}>{u.role.replace('_', ' ')}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusColor[u.status]}`}>{u.status}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{(() => { try { return format(parseISO(u.created_at), 'dd MMM yy'); } catch { return 'N/A'; } })()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedUser(u.id)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
                      {isSuperAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setResetUser(u); setNewPassword(''); setCopied(false); }} title="Reset Password">
                            <KeyRound className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            if (u.status === 'disabled') handleStatusChange(u.user_id, u.id, 'approved');
                            else handleStatusChange(u.user_id, u.id, 'disabled');
                          }} title={u.status === 'disabled' ? 'Enable' : 'Disable'}>
                            {u.status === 'disabled' ? <Power className="w-3.5 h-3.5 text-income" /> : <Ban className="w-3.5 h-3.5 text-owe" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(u)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{viewUser.full_name.charAt(0)}</div>
                <div><p className="font-semibold">{viewUser.full_name}</p><Badge className={`text-[10px] capitalize ${roleColor[viewUser.role]}`}>{viewUser.role.replace('_', ' ')}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Email</p><p>{viewUser.email}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p>{viewUser.phone || 'N/A'}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><Badge variant="outline" className={`text-[10px] capitalize ${statusColor[viewUser.status]}`}>{viewUser.status}</Badge></div>
                <div><p className="text-muted-foreground text-xs">Created</p><p>{(() => { try { return format(parseISO(viewUser.created_at), 'dd MMM yyyy'); } catch { return 'N/A'; } })()}</p></div>
                <div><p className="text-muted-foreground text-xs">Last Login</p><p>{viewUser.last_login ? format(parseISO(viewUser.last_login), 'dd MMM yyyy HH:mm') : 'Never'}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={() => { setResetUser(null); setNewPassword(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          {resetUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{resetUser.full_name}</p>
                <p className="text-xs text-muted-foreground">{resetUser.email}</p>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={copyPassword} title="Copy" disabled={!newPassword}>
                    {copied ? <Check className="w-4 h-4 text-income" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={generatePassword}>
                  Generate Random Password
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setResetUser(null); setNewPassword(''); }}>Cancel</Button>
                <Button onClick={handleResetPassword} disabled={resetting || !newPassword}>
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
