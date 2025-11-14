import React from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  fallback 
}) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || (
      <Alert variant="destructive" className="m-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this feature. Contact your administrator for access.
        </AlertDescription>
      </Alert>
    );
  }
  
  return <>{children}</>;
};

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

interface CashierOrAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const CashierOrAdmin: React.FC<CashierOrAdminProps> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin', 'cashier']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Utility functions for role checking
export const hasRole = (userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  return userRole ? allowedRoles.includes(userRole) : false;
};

export const isAdmin = (userRole: UserRole | undefined): boolean => {
  return userRole === 'admin';
};

export const isCashier = (userRole: UserRole | undefined): boolean => {
  return userRole === 'cashier';
};

export const canEditSensitiveData = (userRole: UserRole | undefined): boolean => {
  return isAdmin(userRole);
};

export const canViewReports = (userRole: UserRole | undefined): boolean => {
  return isAdmin(userRole);
};

export const canManageUsers = (userRole: UserRole | undefined): boolean => {
  return isAdmin(userRole);
};

export const canProcessOrders = (userRole: UserRole | undefined): boolean => {
  return userRole === 'admin' || userRole === 'cashier';
};