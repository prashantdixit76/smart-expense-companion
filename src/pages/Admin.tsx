import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Admin = () => {
  const { users, approveUser, currentUser } = useAppStore();

  if (currentUser?.email !== 'admin@expense.com') {
    return <div className="text-center py-12 text-muted-foreground">Access denied.</div>;
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>

      {pendingUsers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-owe" /> Pending Approvals ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.phone}</p>
                </div>
                <Button size="sm" className="gap-1" onClick={() => { approveUser(u.id); toast.success(`${u.fullName} approved!`); }}>
                  <CheckCircle className="w-3 h-3" /> Approve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Users ({approvedUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approvedUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium">{u.fullName}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant="secondary" className="text-xs">Approved</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
