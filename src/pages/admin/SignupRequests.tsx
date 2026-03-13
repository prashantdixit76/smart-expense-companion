import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mail, Phone, Calendar, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const SignupRequests = () => {
  const { users, approveUser, rejectUser } = useAppStore();
  const pendingUsers = users.filter((u) => u.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Signup Requests</h1>
        <Badge variant={pendingUsers.length > 0 ? 'destructive' : 'secondary'}>
          {pendingUsers.length} pending
        </Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-income mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending signup requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((u) => (
            <Card key={u.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{u.fullName}</p>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {(() => { try { return format(parseISO(u.createdAt), 'dd MMM yyyy'); } catch { return 'N/A'; } })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1" onClick={() => { approveUser(u.id); toast.success(`${u.fullName} approved!`); }}>
                      <CheckCircle className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => { rejectUser(u.id); toast.info(`${u.fullName} rejected.`); }}>
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignupRequests;
