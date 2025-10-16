'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import { useAuth } from '@/contexts/AuthContext'
import { API_ENDPOINTS } from '@/config/api'
import axios from 'axios'

interface User {
  email?: string;
  phone?: string;
  orgName?: string;
  orgId: string; // Legacy field
  organizations?: OrganizationMembership[];
  // Multi-role fields
  currentOrgId?: string;
  currentRole?: 'admin' | 'client' | 'guest';
  accessibleOrgs?: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } };
}

interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'admin' | 'client' | 'guest';
  joinedAt: Date;
}

interface OrganizationInfo {
  name?: string;
  description?: string;
}

interface AdminTabsProps {
  currentTab: 'invites' | 'organizations';
  user: User | null;
  inviteEmail: string;
  inviteRole: 'admin' | 'client';
  isCreatingInvite: boolean;
  orgDescription: string;
  isUpdatingDescription: boolean;
  userOrganizations: OrganizationMembership[];
  isSwitchingOrg: boolean;
  isPublic: boolean;
  onInviteEmailChange: (email: string) => void;
  onInviteRoleChange: (role: 'admin' | 'client') => void;
  onCreateInvite: () => void;
  onOrgDescriptionChange: (description: string) => void;
  onUpdateOrganizationDescription: () => void;
  onSwitchOrganization: (orgId: string) => void;
  onTogglePublicPrivate: () => void;
}

export default function AdminOrganizationsPage() {
  const router = useRouter()
  const { user, token, logout } = useAuth()
  
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'client'>('client')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [orgDescription, setOrgDescription] = useState('')
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false)
  const [userOrganizations, setUserOrganizations] = useState<OrganizationMembership[]>([])
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [documentStats] = useState({ count: 24 })

  // Load organization info on component mount
  useEffect(() => {
    if (user && token) {
      loadOrganizationInfo();
    }
  }, [user, token]);

  const loadOrganizationInfo = async () => {
    try {
      // Prefer backend truth for visibility to avoid stale local state
      const resp = await fetch(API_ENDPOINTS.ORGANIZATIONS_INFO, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data.isPublic === 'boolean') {
          setIsPublic(data.isPublic);
          return;
        }
      }
      // Fallback to cached user in case backend call fails
      if (user?.accessibleOrgs && user.currentOrgId) {
        const currentOrg = user.accessibleOrgs[user.currentOrgId];
        if (currentOrg && typeof currentOrg.isPublic === 'boolean') {
          setIsPublic(currentOrg.isPublic);
        }
      }
    } catch (error) {
      console.error('Error loading organization info:', error);
    }
  };

  // Show loading while checking authentication
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleInviteEmailChange = (email: string) => {
    setInviteEmail(email)
  }

  const handleInviteRoleChange = (role: 'admin' | 'client') => {
    setInviteRole(role)
  }

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address')
      return
    }

    setIsCreatingInvite(true)
    try {
      // TODO: Implement invite creation API call
      console.log('Creating invite:', { email: inviteEmail, role: inviteRole })
      alert('Invite created successfully!')
      setInviteEmail('')
    } catch (error) {
      console.error('Create invite error:', error)
      alert('Failed to create invite. Please try again.')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleOrgDescriptionChange = (description: string) => {
    setOrgDescription(description)
  }

  const handleUpdateOrganizationDescription = async () => {
    if (!orgDescription.trim()) return

    setIsUpdatingDescription(true)
    try {
      // TODO: Implement description update API call
      console.log('Updating description:', orgDescription)
      alert('Description updated successfully!')
    } catch (error) {
      console.error('Update description error:', error)
      alert('Failed to update description. Please try again.')
    } finally {
      setIsUpdatingDescription(false)
    }
  }

  const handleSwitchOrganization = async (orgId: string) => {
    setIsSwitchingOrg(true)
    try {
      // TODO: Implement organization switching API call
      console.log('Switching to organization:', orgId)
      alert('Organization switched successfully!')
    } catch (error) {
      console.error('Switch organization error:', error)
      alert('Failed to switch organization. Please try again.')
    } finally {
      setIsSwitchingOrg(false)
    }
  }

  const handleTogglePublicPrivate = async () => {
    if (isUpdatingVisibility) return; // Prevent double-clicks
    
    setIsUpdatingVisibility(true);
    try {
      const newVisibility = !isPublic;
      
      // Make API call to update organization visibility
      const response = await fetch(API_ENDPOINTS.ORGANIZATIONS_VISIBILITY, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: newVisibility })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization visibility');
      }

      // Update local state only after successful API call
      setIsPublic(newVisibility);
      
      // Show success message
      alert(`Organization is now ${newVisibility ? 'public' : 'private'}`);
    } catch (error: any) {
      console.error('Toggle visibility error:', error);
      alert(`Failed to update visibility: ${error.message}`);
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700">
      <AdminHeader 
        user={user}
        documentStats={documentStats}
        onLogout={handleLogout}
      />
      
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-4">Organization Profile</h1>
        </div>

        {/* Organization Info */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">Name:</span>
            <p className="text-base text-gray-900">{user?.orgName || 'Not set'}</p>
          </div>
          
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-600">Your Role:</span>
            <p className="text-base text-gray-900">{user?.currentRole || 'Not set'}</p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Visibility</p>
              <p className="text-xs text-gray-600">
                {isPublic ? 'Public - Anyone can find and join' : 'Private - Invitation only'}
              </p>
            </div>
            <button
              className={`flex items-center px-4 py-2 rounded-full text-xs font-semibold ${
                isPublic ? 'bg-green-500' : 'bg-gray-500'
              } text-white ${isUpdatingVisibility ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleTogglePublicPrivate}
              disabled={isUpdatingVisibility}
            >
              {isUpdatingVisibility ? 'Updating...' : (isPublic ? 'Public' : 'Private')}
            </button>
          </div>

          {/* Organization Description */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Description:</p>
            <p className="text-xs text-gray-600 mb-3">
              Provide a description of your organization that will be visible to others.
            </p>
            
            <textarea
              value={orgDescription}
              onChange={(e) => handleOrgDescriptionChange(e.target.value)}
              placeholder="Enter organization description..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white min-h-[80px] resize-none mb-3"
              rows={3}
            />
            
            <button
              className={`w-full py-3 rounded text-sm font-semibold ${
                isUpdatingDescription 
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleUpdateOrganizationDescription}
              disabled={isUpdatingDescription}
            >
              {isUpdatingDescription ? 'Updating...' : 'Update Description'}
            </button>
          </div>
        </div>
        
        {/* Send Invites Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h3 className="text-base font-semibold text-gray-700 mb-3">Send Invite</h3>
          
          {/* Role Selection */}
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">User Role</p>
            <div className="flex bg-gray-200 rounded p-1">
              <button
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold ${
                  inviteRole === 'client' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600'
                }`}
                onClick={() => handleInviteRoleChange('client')}
              >
                Client
              </button>
            </div>
          </div>
          
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => handleInviteEmailChange(e.target.value)}
            placeholder="Enter email address"
            className="w-full px-3 py-2 border border-gray-300 rounded text-base bg-white mb-3"
          />
          
          <button
            className={`w-full py-3 rounded text-sm font-semibold ${
              isCreatingInvite 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleCreateInvite}
            disabled={isCreatingInvite}
          >
            {isCreatingInvite ? 'Creating Invite...' : 'Create Client Invite'}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">How it works:</h4>
          <div className="text-sm text-blue-800 leading-5">
            1. Enter the email address of the person you want to invite as a client<br/>
            2. Click &quot;Create Client Invite&quot; to generate an invite code<br/>
            3. Share the invite code with the person<br/>
            4. They can use the &quot;By Invitation&quot; tab to enter the code and register<br/>
            5. Once registered, they&apos;ll have client access to your organization
          </div>
        </div>
      </div>
    </div>
  )
}
