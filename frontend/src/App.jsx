import React, { useState, useEffect, useCallback } from 'react';
import { api, authStorage } from './api';
import AuthForm from './components/AuthForm';
import StatsBar from './components/StatsBar';
import SearchFilterBar from './components/SearchFilterBar';
import LeadTable from './components/LeadTable';
import LeadForm from './components/LeadForm';
import ConfirmModal from './components/ConfirmModal';
import ErrorBanner from './components/ErrorBanner';
import './App.css';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(authStorage.getToken()));

  // Leads state
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { New: 0, Contacted: 0, Qualified: 0, Lost: 0 },
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formServerError, setFormServerError] = useState(null);
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load leads from API
  const loadLeads = useCallback(
    async (currentPage = pagination.page, currentLimit = pagination.limit) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setGlobalError(null);

      try {
        const response = await api.leads.list({
          search,
          status: statusFilter,
          page: currentPage,
          limit: currentLimit,
          sortBy,
          order,
        });

        setLeads(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        setGlobalError(err.message || 'Failed to fetch leads');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, search, statusFilter, sortBy, order, pagination.page, pagination.limit]
  );

  // Load stats from API
  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.leads.getStats();
      if (data) {
        setStats(data);
      }
    } catch {
      // Don't crash main UI if stats call fails
    }
  }, [isAuthenticated]);

  // Initial load and filter trigger
  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
      loadStats();
    }
  }, [isAuthenticated, search, statusFilter, sortBy, order]);

  // Handle Authentication (Login / Signup)
  async function handleAuthSuccess(credentials, isSignup) {
    let res;
    if (isSignup) {
      res = await api.auth.signup(credentials);
    } else {
      res = await api.auth.login(credentials);
    }
    setCurrentUser(res.user);
    setIsAuthenticated(true);
    setGlobalError(null);
  }

  function handleLogout() {
    api.auth.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLeads([]);
  }

  // Filter handlers
  function handleSearchChange(newSearch) {
    setSearch(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handleStatusChange(newStatus) {
    setStatusFilter(newStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handleClearFilters() {
    setSearch('');
    setStatusFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handleSort(column, newOrder) {
    setSortBy(column);
    setOrder(newOrder);
  }

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
    loadLeads(newPage, pagination.limit);
  }

  function handleLimitChange(newLimit) {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    loadLeads(1, newLimit);
  }

  // Create / Edit Lead Handlers
  function handleOpenCreateModal() {
    setEditingLead(null);
    setFormServerError(null);
    setFormFieldErrors({});
    setIsFormOpen(true);
  }

  function handleOpenEditModal(lead) {
    setEditingLead(lead);
    setFormServerError(null);
    setFormFieldErrors({});
    setIsFormOpen(true);
  }

  async function handleFormSubmit(formData) {
    setIsFormSubmitting(true);
    setFormServerError(null);
    setFormFieldErrors({});

    try {
      if (editingLead) {
        await api.leads.update(editingLead.id, formData);
      } else {
        await api.leads.create(formData);
      }
      setIsFormOpen(false);
      setEditingLead(null);
      await Promise.all([loadLeads(), loadStats()]);
    } catch (err) {
      setFormServerError(err.message || 'Operation failed');
      if (Array.isArray(err.details)) {
        const fieldMap = {};
        err.details.forEach((d) => {
          if (d.field) fieldMap[d.field] = d.message;
        });
        setFormFieldErrors(fieldMap);
      }
    } finally {
      setIsFormSubmitting(false);
    }
  }

  // Delete Lead Handlers
  function handleOpenDeleteModal(lead) {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!leadToDelete) return;
    setIsDeleting(true);

    try {
      await api.leads.delete(leadToDelete.id);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);

      // If we deleted the only item on the current page, navigate back
      const remainingOnPage = leads.length - 1;
      const targetPage = remainingOnPage === 0 && pagination.page > 1 ? pagination.page - 1 : pagination.page;

      await Promise.all([loadLeads(targetPage, pagination.limit), loadStats()]);
    } catch (err) {
      setGlobalError(err.message || 'Failed to delete lead');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">LM</div>
          <span className="brand-title">Lead Manager</span>
        </div>

        <div className="header-user">
          {currentUser?.email && (
            <span className="user-email" title={`Logged in as ${currentUser.email}`}>
              👤 {currentUser.email}
            </span>
          )}
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <ErrorBanner
          error={globalError}
          onRetry={() => {
            loadLeads();
            loadStats();
          }}
          onDismiss={() => setGlobalError(null)}
        />

        {/* Status Dashboard / Stats Bar */}
        <StatsBar
          stats={stats}
          activeStatus={statusFilter}
          onSelectStatus={handleStatusChange}
        />

        {/* Controls: Search, Filter by Status, and Add CTA */}
        <SearchFilterBar
          search={search}
          status={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onClearFilters={handleClearFilters}
          onAddLead={handleOpenCreateModal}
        />

        {/* Leads Table */}
        <LeadTable
          leads={leads}
          pagination={pagination}
          sortBy={sortBy}
          order={order}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onEditLead={handleOpenEditModal}
          onDeleteLead={handleOpenDeleteModal}
          isLoading={isLoading}
          hasFilters={Boolean(search || statusFilter)}
          onClearFilters={handleClearFilters}
        />
      </main>

      {/* Shared Lead Form Modal (Add / Edit) */}
      <LeadForm
        isOpen={isFormOpen}
        initialData={editingLead}
        onSubmit={handleFormSubmit}
        onClose={() => setIsFormOpen(false)}
        isSubmitting={isFormSubmitting}
        serverError={formServerError}
        serverFieldErrors={formFieldErrors}
      />

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Lead"
        message="Are you sure you want to permanently delete this lead? All associated records will be removed."
        leadDetails={leadToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isConfirming={isDeleting}
      />
    </div>
  );
}
