import React, { useState, useEffect, useCallback } from 'react';
import { api, authStorage } from './api';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import OverviewHeader from './components/OverviewHeader';
import StatCards from './components/StatCards';
import ChartsGrid from './components/ChartsGrid';
import RecentLeadsCard from './components/RecentLeadsCard';
import RecentActivity from './components/RecentActivity';
import Footer from './components/Footer';
import PipelineView from './components/PipelineView';
import ReportsView from './components/ReportsView';
import LeadForm from './components/LeadForm';
import ConfirmModal from './components/ConfirmModal';
import ResetDemoModal from './components/ResetDemoModal';
import ErrorBanner from './components/ErrorBanner';
import './App.css';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(authStorage.getToken()));

  // Active view in sidebar: 'overview' | 'leads' | 'pipeline' | 'reports'
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { New: 0, Contacted: 0, Qualified: 0, Lost: 0 },
    qualifiedValue: 0,
    pipelineValue: 0,
    bySource: [],
  });

  // Activity feed state
  const [activities, setActivities] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formServerError, setFormServerError] = useState(null);
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isResetDemoModalOpen, setIsResetDemoModalOpen] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Load leads
  const loadLeads = useCallback(
    async (currentPage = pagination.page, currentLimit = pagination.limit) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setGlobalError(null);

      try {
        const response = await api.leads.list({
          search,
          status: statusFilter,
          source: sourceFilter,
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
    [isAuthenticated, search, statusFilter, sourceFilter, sortBy, order, pagination.page, pagination.limit]
  );

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.leads.getStats();
      if (data) {
        setStats(data);
      }
    } catch {
      // Non-fatal if stats call fails
    }
  }, [isAuthenticated]);

  // Load activities
  const loadActivities = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.leads.getActivity();
      if (res && res.data) {
        setActivities(res.data);
      }
    } catch {
      // Non-fatal
    }
  }, [isAuthenticated]);

  // Initial load and filter trigger
  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
      loadStats();
      loadActivities();
    }
  }, [isAuthenticated, search, statusFilter, sourceFilter, sortBy, order, loadLeads, loadStats, loadActivities]);

  // Auth actions
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
    setActivities([]);
  }

  // Filter actions
  function handleSearchChange(newSearch) {
    setSearch(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handleStatusChange(newStatus) {
    setStatusFilter(newStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handleSourceChange(newSource) {
    setSourceFilter(newSource);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handleSort(column) {
    const newOrder = sortBy === column && order === 'asc' ? 'desc' : 'asc';
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

  // Quick status change
  async function handleQuickStatusChange(lead, newStatus) {
    try {
      await api.leads.update(lead.id, { status: newStatus });
      await Promise.all([loadLeads(), loadStats(), loadActivities()]);
    } catch (err) {
      setGlobalError(err.message || 'Failed to update lead status');
    }
  }

  // Create / Edit lead
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
      await Promise.all([loadLeads(), loadStats(), loadActivities()]);
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

  // Delete lead
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

      const remainingOnPage = leads.length - 1;
      const targetPage = remainingOnPage === 0 && pagination.page > 1 ? pagination.page - 1 : pagination.page;

      await Promise.all([loadLeads(targetPage, pagination.limit), loadStats(), loadActivities()]);
    } catch (err) {
      setGlobalError(err.message || 'Failed to delete lead');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  // Reset Demo Data
  async function handleConfirmResetDemo() {
    setIsResettingDemo(true);
    try {
      await api.leads.resetDemoData();
      setIsResetDemoModalOpen(false);
      await Promise.all([loadLeads(1, pagination.limit), loadStats(), loadActivities()]);
    } catch (err) {
      setGlobalError(err.message || 'Failed to reset demo data');
      setIsResetDemoModalOpen(false);
    } finally {
      setIsResettingDemo(false);
    }
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="crm-layout">
      {/* Left Sidebar (ref-4) */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Page Area */}
      <div className={`crm-main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile Header Bar (<768px) */}
        <header className="mobile-header">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="mobile-header-brand">
            <span className="mobile-logo-badge">LM</span>
            <span className="mobile-brand-title">Lead Manager</span>
          </div>
          <button
            type="button"
            className="mobile-logout-btn"
            onClick={handleLogout}
            aria-label="Log out"
          >
            Logout
          </button>
        </header>

        {/* Global Error Banner */}
        <div className="crm-content-container">
          <ErrorBanner
            error={globalError}
            onRetry={() => {
              loadLeads();
              loadStats();
              loadActivities();
            }}
            onDismiss={() => setGlobalError(null)}
          />

          {/* Desktop Top Strip (User email and sign out) */}
          <div className="desktop-user-strip">
            {currentUser?.email && (
              <span className="user-email-text" title={`Signed in as ${currentUser.email}`}>
                Signed in as <strong>{currentUser.email}</strong>
              </span>
            )}
            <button
              type="button"
              className="btn-signout"
              onClick={handleLogout}
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>

          {/* View Routing */}
          {activeView === 'overview' && (
            <>
              {/* Overview Header (ref-1) */}
              <OverviewHeader onAddLead={handleOpenCreateModal} />

              {/* 4 Stat Cards Row (ref-1) */}
              <StatCards stats={stats} />

              {/* 2 Recharts Cards Grid (ref-1) */}
              <ChartsGrid stats={stats} />

              {/* Recent Leads Card (ref-2) */}
              <RecentLeadsCard
                leads={leads}
                pagination={pagination}
                search={search}
                status={statusFilter}
                source={sourceFilter}
                sortBy={sortBy}
                order={order}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                onSourceChange={handleSourceChange}
                onSort={handleSort}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onEditLead={handleOpenEditModal}
                onDeleteLead={handleOpenDeleteModal}
                onQuickStatusChange={handleQuickStatusChange}
                isLoading={isLoading}
              />

              {/* Recent Activity Card (ref-3) */}
              <RecentActivity activities={activities} />
            </>
          )}

          {activeView === 'leads' && (
            <>
              <div className="overview-header-block">
                <div className="overview-header-text">
                  <span className="page-label">SALES DASHBOARD</span>
                  <h1 className="page-title">Leads</h1>
                  <p className="page-description">
                    Manage all your business opportunities, pipeline stages, and contact records.
                  </p>
                </div>
                <div className="overview-header-action">
                  <button
                    type="button"
                    className="btn-add-lead"
                    onClick={handleOpenCreateModal}
                    aria-label="Add lead"
                  >
                    Add lead
                  </button>
                </div>
              </div>

              <RecentLeadsCard
                leads={leads}
                pagination={pagination}
                search={search}
                status={statusFilter}
                source={sourceFilter}
                sortBy={sortBy}
                order={order}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                onSourceChange={handleSourceChange}
                onSort={handleSort}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onEditLead={handleOpenEditModal}
                onDeleteLead={handleOpenDeleteModal}
                onQuickStatusChange={handleQuickStatusChange}
                isLoading={isLoading}
              />
            </>
          )}

          {activeView === 'pipeline' && (
            <PipelineView leads={leads} />
          )}

          {activeView === 'reports' && (
            <ReportsView stats={stats} leads={leads} />
          )}
        </div>

        {/* Dark Footer (ref-3) */}
        <Footer onResetDemo={() => setIsResetDemoModalOpen(true)} />
      </div>

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

      {/* Confirmation Modal for Resetting Demo Data */}
      <ResetDemoModal
        isOpen={isResetDemoModalOpen}
        onConfirm={handleConfirmResetDemo}
        onCancel={() => setIsResetDemoModalOpen(false)}
        isResetting={isResettingDemo}
      />
    </div>
  );
}
