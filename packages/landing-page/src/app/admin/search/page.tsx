'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/AdminHeader'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

interface Organization {
  orgId: string;
  name: string;
  adminCount: number;
  isPublic?: boolean;
  userRole?: 'admin' | 'client' | 'guest';
}

// (Removed unused OrganizationSelectionScreenProps interface)

export default function AdminSearchPage() {
  const { user, token } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [isCreatingOrg, setIsCreatingOrg] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [myOrgsCurrentPage, setMyOrgsCurrentPage] = useState<number>(1);
  const [myOrgsTotalPages, setMyOrgsTotalPages] = useState<number>(1);
  const itemsPerPage = 5;

  const isGuest = user?.currentRole === 'guest';
  const [documentStats] = useState({ count: 24 })

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  // Defer rendering until auth check; ensure hooks above are always called

  // Load user's organizations from backend (multi-role)
  useEffect(() => {
    const fetchAccessibleOrgs = async () => {
      if (!token) return;
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/auth/multi-role/organizations`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!resp.ok) {
          console.error('Failed to fetch accessible orgs:', resp.status);
          return;
        }
        const data = await resp.json();
        const accessible = data.accessibleOrgs || {};
        const orgs: Organization[] = Object.entries(accessible).map(([orgId, access]: any) => ({
          orgId,
          name: access.orgName || 'Unknown Organization',
          adminCount: 0,
          isPublic: access.isPublic || false,
          userRole: access.role
        }));
        setUserOrganizations(orgs);
      } catch (e) {
        console.error('Error loading accessible orgs:', e);
      }
    };
    fetchAccessibleOrgs();
  }, [token]);

  const loadUserOrganizations = async () => {
    if (!user?.accessibleOrgs) {
      console.log('🔍 No accessibleOrgs found, returning');
      return;
    }
    
    const orgIds = Object.keys(user.accessibleOrgs);
    const userOrgs: Organization[] = [];
    
    // Fetch admin counts for all organizations at once
    let adminCounts: { [orgId: string]: number } = {};
    
    // Only make the API call if we have orgIds
    if (orgIds.length > 0) {
      try {
        // Ensure orgIds is always an array
        const orgIdsArray = Array.isArray(orgIds) ? orgIds : [orgIds];
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/user/org-admin-counts`, {
          params: {
            orgIds: orgIdsArray
          },
          paramsSerializer: {
            indexes: null
          },
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        adminCounts = response.data;
      } catch (error) {
        console.error('Error fetching admin counts:', error);
      }
    }
    
    for (const [orgId, orgAccess] of Object.entries(user.accessibleOrgs)) {
      const access = orgAccess as { orgName?: string; isPublic?: boolean; role: 'admin' | 'client' | 'guest' };
      
      userOrgs.push({
        orgId: orgId,
        name: access.orgName || 'Unknown Organization',
        adminCount: adminCounts[orgId] || 0,
        isPublic: access.isPublic || false,
        userRole: access.role
      });
    }
    setUserOrganizations(userOrgs);
  };

  // Search organizations
  const searchOrganizations = async (query: string) => {
    try {
      setIsSearching(true);
      setCurrentPage(1); // Reset to first page on new search
      
      // If no query, show all public organizations
      if (!query.trim()) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/orgs/public`);
        setSearchResults(response.data);
      } else {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/orgs/search?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate pagination
  const calculatePagination = () => {
    const totalItems = searchResults.length;
    const totalPagesCount = Math.ceil(totalItems / itemsPerPage);
    setTotalPages(totalPagesCount);
    
    // Reset to page 1 if current page is beyond total pages
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(1);
    }
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return searchResults.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Update pagination when search results change
  useEffect(() => {
    calculatePagination();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, currentPage]);

  // Calculate pagination for My Organizations
  const calculateMyOrgsPagination = () => {
    const totalItems = userOrganizations.length;
    const totalPagesCount = Math.ceil(totalItems / itemsPerPage);
    setMyOrgsTotalPages(totalPagesCount);
    
    // Reset to page 1 if current page is beyond total pages
    if (myOrgsCurrentPage > totalPagesCount && totalPagesCount > 0) {
      setMyOrgsCurrentPage(1);
    }
  };

  // Get current page items for My Organizations
  const getMyOrgsCurrentPageItems = () => {
    const startIndex = (myOrgsCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return userOrganizations.slice(startIndex, endIndex);
  };

  // Handle page change for My Organizations
  const handleMyOrgsPageChange = (page: number) => {
    setMyOrgsCurrentPage(page);
  };

  // Update pagination when user organizations change
  useEffect(() => {
    calculateMyOrgsPagination();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOrganizations, myOrgsCurrentPage]);

  // Handle organization selection
  const handleSelectOrganization = async (orgId: string) => {
    try {
      if (!token) {
        alert('You must be logged in to switch organizations.');
        return;
      }
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/auth/multi-role/switch-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orgId })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Failed to switch to organization ${orgId}`);
      }
      const data = await resp.json();
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Reload to ensure all pages pick up new org context
        window.location.reload();
      } else {
        // Fallback: just refresh organizations
        await fetchAccessibleOrgsAfterSwitch();
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      alert((error as Error).message || 'Failed to switch organization');
    }
  };

  // Helper to refresh orgs if switch returns no token/user (defensive)
  const fetchAccessibleOrgsAfterSwitch = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/auth/multi-role/organizations`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        const accessible = data.accessibleOrgs || {};
        const orgs: Organization[] = Object.entries(accessible).map(([oid, access]: any) => ({
          orgId: oid,
          name: access.orgName || 'Unknown Organization',
          adminCount: 0,
          isPublic: access.isPublic || false,
          userRole: access.role
        }));
        setUserOrganizations(orgs);
      }
    } catch (_) {}
  };

  // Handle organization click - either switch or join based on membership
  const handleOrganizationClick = async (orgId: string) => {
    // Check if user is already a member of this organization
    const isMember = user?.accessibleOrgs && user.accessibleOrgs[orgId];
    
    if (isMember) {
      // User is already a member - switch to this organization
      console.log('🔄 User is already a member, switching to organization:', orgId);
      await handleSelectOrganization(orgId);
    } else {
      // User is not a member - join the organization
      console.log('🔄 User is not a member, joining organization:', orgId);
      await handleJoinOrganization(orgId);
    }
  };

  // Handle joining an organization
  const handleJoinOrganization = async (orgId: string) => {
    const orgName = searchResults.find(org => org.orgId === orgId)?.name || 'this organization';
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/client/join-organization`, {
        orgId: orgId
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      // Update the token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Note: User context will be updated on next page refresh or we could trigger a refresh
        window.location.reload();
      }
      
      alert(`Successfully joined ${orgName}!`);
    } catch (error) {
      console.error('❌ Error joining organization:', error);
      alert('Failed to join organization. Please try again.');
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      alert('Please enter an organization name');
      return;
    }

    setIsCreatingOrg(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/org/create-new`, {
        orgName: newOrgName.trim()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Update the token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Note: User context will be updated on next page refresh or we could trigger a refresh
        window.location.reload();
      }
      
      alert(`Organization ${newOrgName} created successfully!`);
      setNewOrgName('');
    } catch (error: unknown) {
      console.error('❌ Error creating organization:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create organization';
      alert(errorMessage);
    } finally {
      setIsCreatingOrg(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white mb-2">Welcome!</h1>
          <p className="text-indigo-200 mb-6">
            {(isGuest || user?.currentRole === 'guest' || user?.role === 'guest') ? 'Guest' : (user?.email || 'No email available')}
          </p>
        </div>

        {/* Search Organizations */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-1">Search Organizations</h2>
          <p className="text-sm text-indigo-200 mb-3">(leave blank for all results)</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for organizations..."
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
            />
            <button
              onClick={() => searchOrganizations(searchQuery)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
          
          {/* Search Results */}
          {(isSearching || searchResults.length > 0) && (
            <div className="mt-3">
              {isSearching ? (
                <p className="text-center text-indigo-200 py-4">Searching...</p>
              ) : searchResults.length > 0 ? (
                <>
                  {/* Results Info */}
                  <p className="text-sm text-indigo-200 mb-3 text-center">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, searchResults.length)} of {searchResults.length} organizations
                  </p>
                  
                  {/* Paginated Results */}
                  <div className="space-y-2">
                    {getCurrentPageItems().map((org) => (
                      <div
                        key={org.orgId}
                        className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md cursor-pointer"
                        onClick={() => handleOrganizationClick(org.orgId)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                              {org.name || 'Unnamed Organization'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                            </p>
                          </div>
                          {user?.accessibleOrgs && user.accessibleOrgs[org.orgId] && (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                              user.accessibleOrgs[org.orgId].role === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                              {user.accessibleOrgs[org.orgId].role.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-4 gap-2">
                      <button
                        className={`px-3 py-2 rounded text-sm font-semibold ${
                          currentPage === 1 
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          className={`px-3 py-2 rounded text-sm font-semibold min-w-[40px] ${
                            currentPage === page 
                              ? 'bg-gray-800 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        className={`px-3 py-2 rounded text-sm font-semibold ${
                          currentPage === totalPages 
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-indigo-200 py-4">No organizations found</p>
              )}
            </div>
          )}
        </div>

        {/* My Organizations */}
        {!isGuest && userOrganizations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">My Organizations</h2>
            
            {/* Results Info */}
            <p className="text-sm text-indigo-200 mb-3 text-center">
              Showing {((myOrgsCurrentPage - 1) * itemsPerPage) + 1}-{Math.min(myOrgsCurrentPage * itemsPerPage, userOrganizations.length)} of {userOrganizations.length} organizations
            </p>
            
            {/* Paginated Results */}
            <div className="space-y-2">
              {getMyOrgsCurrentPageItems().map((org) => (
                <div
                  key={org.orgId}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md cursor-pointer"
                  onClick={() => handleSelectOrganization(org.orgId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {org.name || 'Unnamed Organization'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                      org.userRole === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {org.userRole?.toUpperCase() || 'USER'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {myOrgsTotalPages > 1 && (
              <div className="flex justify-center items-center mt-4 gap-2">
                <button
                  className={`px-3 py-2 rounded text-sm font-semibold ${
                    myOrgsCurrentPage === 1 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={() => handleMyOrgsPageChange(myOrgsCurrentPage - 1)}
                  disabled={myOrgsCurrentPage === 1}
                >
                  Previous
                </button>
                
                {Array.from({ length: myOrgsTotalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-2 rounded text-sm font-semibold min-w-[40px] ${
                      myOrgsCurrentPage === page 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleMyOrgsPageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  className={`px-3 py-2 rounded text-sm font-semibold ${
                    myOrgsCurrentPage === myOrgsTotalPages 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={() => handleMyOrgsPageChange(myOrgsCurrentPage + 1)}
                  disabled={myOrgsCurrentPage === myOrgsTotalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Organization - Only show for non-guests */}
        {!isGuest && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Create New Organization</h2>
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 mb-3"
              disabled={isCreatingOrg}
            />
            <button
              className={`w-full py-4 rounded-lg text-base font-semibold ${
                newOrgName.trim() && !isCreatingOrg
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              onClick={handleCreateOrganization}
              disabled={!newOrgName.trim() || isCreatingOrg}
            >
              {isCreatingOrg ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
