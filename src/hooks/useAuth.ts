import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export interface AuthUser {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  status: "active" | "inactive";
  permissions: {
    canEditRecords: boolean;
    canDeleteRecords: boolean;
    canCreateUsers: boolean;
    canManageRoles: boolean;
    canManageWeapons: boolean;
    canManageSales: boolean;
    canManageOrgs: boolean;
  };
}

export function useAuth() {
  const utils = trpc.useUtils();

  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("shadow_token", data.token);
      utils.auth.me.invalidate();
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("shadow_token");
    utils.auth.me.invalidate();
    window.location.href = "/login";
  }, [utils]);

  const u = user as AuthUser | null;

  return {
    user: u,
    isLoading,
    isAuthenticated: !!u,
    canEdit: u?.permissions.canEditRecords ?? false,
    canDelete: u?.permissions.canDeleteRecords ?? false,
    canCreateUsers: u?.permissions.canCreateUsers ?? false,
    canManageRoles: u?.permissions.canManageRoles ?? false,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null,
    logout,
  };
}
