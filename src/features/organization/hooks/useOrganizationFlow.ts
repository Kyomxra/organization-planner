import { useState } from 'react';
import { initialOrganizations } from '../data/mockOrganizations';
import { CreateOrgFormData, OrganizationItem, OrgStatus } from '../types';

export function useOrganizationFlow() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>(initialOrganizations);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem>(initialOrganizations[0]);
  const [showJoinedToast, setShowJoinedToast] = useState(false);
  const [statusModalOrg, setStatusModalOrg] = useState<OrganizationItem | null>(null);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isCreatedModalVisible, setIsCreatedModalVisible] = useState(false);
  const [createdOrgName, setCreatedOrgName] = useState('Organisasi A');

  // Handle changing status (Active / Inactive)
  const handleSaveStatus = (orgId: string, nextStatus: OrgStatus) => {
    setOrganizations((prev) =>
      prev.map((org) => (org.id === orgId ? { ...org, status: nextStatus } : org))
    );
  };

  // Handle joining via invite code
  const handleJoinOrganization = (code: string) => {
    const newOrg: OrganizationItem = {
      id: `org-${Date.now()}`,
      name: `Joined Org (${code})`,
      roleTitle: 'General Member',
      role: 'Participant',
      memberCount: 15,
      status: 'Active',
      letter: code.slice(0, 1) || 'J',
      avatarBg: '#E8F5E9',
      avatarTextColor: '#2E7D32',
      badgeBg: '#F1F8E9',
      badgeTextColor: '#2E7D32',
    };

    setOrganizations((prev) => [newOrg, ...prev]);
    setShowJoinedToast(true);
  };

  // Handle creating a new organization
  const handleCreateOrganization = (data: CreateOrgFormData) => {
    setCreatedOrgName(data.name);
    const newOrg: OrganizationItem = {
      id: `org-${Date.now()}`,
      name: data.name,
      roleTitle: 'Executive Committee',
      role: 'Executive',
      memberCount: 1,
      status: 'Active',
      letter: data.name.charAt(0).toUpperCase() || 'O',
      avatarBg: '#EEECFF',
      avatarTextColor: '#5145E8',
      badgeBg: '#F3F2FF',
      badgeTextColor: '#5145E8',
    };

    setOrganizations((prev) => [newOrg, ...prev]);
    setSelectedOrg(newOrg);
    setIsCreatedModalVisible(true);
  };

  return {
    organizations,
    selectedOrg,
    setSelectedOrg,
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
