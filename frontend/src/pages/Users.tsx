import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, UserCog, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const DUMMY_USERS = [
  { id: '1', name: 'Qaiser Abbas', email: 'admin@pos.com', role: 'ADMIN', lastLogin: '2 mins ago', status: 'ACTIVE' },
  { id: '2', name: 'Ansir Mehmood', email: 'manager@pos.com', role: 'MANAGER', lastLogin: '1 hour ago', status: 'ACTIVE' },
  { id: '3', name: 'Mughees Abas', email: 'cashier@pos.io', role: 'CASHIER', lastLogin: 'Today, 8:00 AM', status: 'ACTIVE' },
  { id: '4', name: 'Junaid Haseeb', email: 'cashier2@pos.io', role: 'CASHIER', lastLogin: 'Yesterday', status: 'inactive' },
];

export default function Users() {
  const [users] = useState(DUMMY_USERS);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge variant="danger" className="w-20 justify-center">Admin</Badge>;
      case 'MANAGER': return <Badge variant="warning" className="w-20 justify-center">Manager</Badge>;
      case 'CASHIER': return <Badge variant="info" className="w-20 justify-center">Cashier</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage staff access and roles</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      {user.role === 'ADMIN' ? <Shield className="w-5 h-5" /> : 
                       user.role === 'MANAGER' ? <UserCog className="w-5 h-5" /> : 
                       <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell>
                  {user.status === 'ACTIVE' ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {user.lastLogin}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm" disabled={user.role === 'ADMIN'}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
