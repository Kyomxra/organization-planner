import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../theme/colors';
import { showMessage, showToast } from '../../auth/utils/feedback';
import { CreateOrgFormData, OrganizationItem, OrgStatus } from '../types';

type OrganizationRole = OrganizationItem['role'];

const roleDisplay: Record<string, { role: OrganizationRole; title: string }> = {
  executive: { role: 'Executive', title: 'Executive Committee' },
  coordinator: { role: 'Coordinator', title: 'Coordinator' },
  member: { role: 'Participant', title: 'Member' },
};

const colorsByRole: Record<OrganizationRole, { avatar: string; text: string; badge: string }> = {
  Executive: { avatar: colors.primarySoft, text: colors.primary, badge: colors.primarySoft },
  Coordinator: { avatar: colors.secondarySoft, text: colors.primaryDark, badge: colors.secondarySoft },
  Participant: { avatar: colors.primarySoft, text: colors.primary, badge: colors.primarySoft },
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected database error occurred.';
}

export function useOrganizationFlow() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [organizationLoadError, setOrganizationLoadError] = useState<string | null>(null);
  const [showJoinedToast, setShowJoinedToast] = useState(false);
  const [statusModalOrg, setStatusModalOrg] = useState<OrganizationItem | null>(null);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isCreatedModalVisible, setIsCreatedModalVisible] = useState(false);
  const [createdOrgName, setCreatedOrgName] = useState('');

  const refreshOrganizations = useCallback(async (userId: string | null) => {
    if (!userId) {
      setOrganizations([]);
      setSelectedOrg(null);
      setOrganizationLoadError(null);
      setIsLoadingOrganizations(false);
      return [];
    }

    setIsLoadingOrganizations(true);
    setOrganizationLoadError(null);

    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_members')
        .select('organization_id, role, status, division_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      const organizationIds = [...new Set((memberships ?? []).map((item) => item.organization_id))];
      if (organizationIds.length === 0) {
        setOrganizations([]);
        setSelectedOrg(null);
        return [];
      }

      const [organizationResult, memberResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name')
          .in('id', organizationIds)
          .is('archived_at', null),
        supabase
          .from('organization_members')
          .select('organization_id')
          .in('organization_id', organizationIds)
          .eq('status', 'active'),
      ]);

      if (organizationResult.error) throw organizationResult.error;
      if (memberResult.error) throw memberResult.error;

      const organizationsById = new Map(
        (organizationResult.data ?? []).map((item) => [item.id, item]),
      );
      const memberCounts = new Map<string, number>();
      for (const member of memberResult.data ?? []) {
        memberCounts.set(
          member.organization_id,
          (memberCounts.get(member.organization_id) ?? 0) + 1,
        );
      }

      const loadedOrganizations = (memberships ?? []).flatMap((membership) => {
        const organization = organizationsById.get(membership.organization_id);
        const role = roleDisplay[membership.role];
        if (!organization || !role) return [];

        const palette = colorsByRole[role.role];
        return [{
          id: organization.id,
          name: organization.name,
          divisionId: membership.division_id,
          roleTitle: role.title,
          role: role.role,
          memberCount: memberCounts.get(organization.id) ?? 0,
          status: 'Active' as OrgStatus,
          letter: organization.name.charAt(0).toUpperCase() || 'O',
          avatarBg: palette.avatar,
          avatarTextColor: palette.text,
          badgeBg: palette.badge,
          badgeTextColor: palette.text,
        }];
      });

      setOrganizations(loadedOrganizations);
      setSelectedOrg((current) =>
        loadedOrganizations.find((item) => item.id === current?.id)
        ?? loadedOrganizations[0]
        ?? null
      );
      return loadedOrganizations;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setOrganizationLoadError(message);
      showMessage('Could not load organizations', message);
      return [];
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, []);

  const reloadOrganizations = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      const message = error.message;
      setOrganizationLoadError(message);
      setIsLoadingOrganizations(false);
      showMessage('Could not load organizations', message);
      return;
    }
    await refreshOrganizations(user?.id ?? null);
  }, [refreshOrganizations]);

  useEffect(() => {
    let active = true;

    const loadForSession = (userId: string | null) => {
      if (active) void refreshOrganizations(userId);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadForSession(session?.user.id ?? null);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        const message = error.message;
        setOrganizationLoadError(message);
        setIsLoadingOrganizations(false);
        showMessage('Could not load organizations', message);
        return;
      }
      loadForSession(data.session?.user.id ?? null);
    }).catch((error: unknown) => {
      if (!active) return;
      const message = getErrorMessage(error);
      setOrganizationLoadError(message);
      setIsLoadingOrganizations(false);
      showMessage('Could not load organizations', message);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshOrganizations]);

  const handleSaveStatus = async (orgId: string, nextStatus: OrgStatus) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showToast('error', 'Could not update organization', userError?.message ?? 'Sign in again and retry.');
      return;
    }

    const { data, error } = await supabase
      .from('organization_members')
      .update({ status: nextStatus.toLowerCase() })
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      showToast('error', 'Could not update organization', error?.message ?? 'You may not have permission to change this organization.');
      return;
    }

    await refreshOrganizations(user.id);
    showToast('success', 'Organization updated', 'Your organization status has been updated.');
  };

  const handleJoinOrganization = async (code: string): Promise<boolean> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showToast('error', 'Could not join organization', userError?.message ?? 'Sign in again and retry.');
      return false;
    }

    const { data: organizationId, error } = await supabase.rpc('redeem_organization_invite', {
      p_code: code,
    });
    if (error) {
      showToast('error', 'Could not join organization', error.message);
      return false;
    }

    const loadedOrganizations = await refreshOrganizations(user.id);
    const joinedOrganization = loadedOrganizations.find((item) => item.id === organizationId);
    if (!joinedOrganization) {
      showToast(
        'error',
        'Organization joined, but could not load it',
        'Retry loading your organizations before continuing.',
      );
      return false;
    }

    setSelectedOrg(joinedOrganization);
    setShowJoinedToast(true);
    return true;
  };

  const handleCreateOrganization = async (data: CreateOrgFormData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showToast('error', 'Could not create organization', userError?.message ?? 'Sign in again and retry.');
      return;
    }

    try {
      const { data: createdOrganization, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      const divisionNames = [...new Set(data.divisions.map((name) => name.trim()).filter(Boolean))];
      if (divisionNames.length > 0) {
        const { error: divisionError } = await supabase
          .from('divisions')
          .insert(divisionNames.map((name) => ({
            organization_id: createdOrganization.id,
            name,
          })));

        if (divisionError) {
          await refreshOrganizations(user.id);
          showToast(
            'error',
            'Organization created, divisions not saved',
            divisionError.message,
          );
          return;
        }
      }

      const loadedOrganizations = await refreshOrganizations(user.id);
      const created = loadedOrganizations.find((item) => item.id === createdOrganization.id);
      if (created) setSelectedOrg(created);
      setCreatedOrgName(data.name);
      setIsCreatedModalVisible(true);
      showToast('success', 'Organization created', `${data.name} is ready.`);
    } catch (error: unknown) {
      showToast('error', 'Could not create organization', getErrorMessage(error));
    }
  };

  return {
    organizations,
    selectedOrg,
    setSelectedOrg,
    isLoadingOrganizations,
    organizationLoadError,
    refreshOrganizations,
    reloadOrganizations,
    showJoinedToast,
    setShowJoinedToast,
    statusModalOrg,
    setStatusModalOrg,
    isJoinModalVisible,
    setIsJoinModalVisible,
    isCreatedModalVisible,
    setIsCreatedModalVisible,
    createdOrgName,
    handleSaveStatus,
    handleJoinOrganization,
    handleCreateOrganization,
  };
}
