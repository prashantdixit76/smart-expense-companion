import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Shield, User } from 'lucide-react';

const roleInfo = [
  {
    role: 'User',
    icon: User,
    color: 'text-muted-foreground',
    permissions: ['Login to main system', 'Add expenses', 'Add income', 'View reports', 'View expense history'],
  },
  {
    role: 'Admin',
    icon: Shield,
    color: 'text-primary',
    permissions: ['All User permissions', 'Manage users', 'View user activity', 'Approve signup requests'],
  },
  {
    role: 'Super Admin',
    icon: ShieldCheck,
    color: 'text-income',
    permissions: ['Full system access', 'Create users', 'Assign roles', 'Edit or delete users', 'View all data', 'Manage admins', 'Change user roles', 'System management'],
  },
];

const RolesPermissions = () => {
  const { users } = useAppStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {roleInfo.map((r) => {
          const count = users.filter(u => u.role === r.role.toLowerCase().replace(' ', '_')).length;
          return (
            <Card key={r.role} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <r.icon className={`w-5 h-5 ${r.color}`} />
                  {r.role}
                  <Badge variant="secondary" className="ml-auto text-xs">{count} users</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {r.permissions.map((p) => (
                    <li key={p} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RolesPermissions;
