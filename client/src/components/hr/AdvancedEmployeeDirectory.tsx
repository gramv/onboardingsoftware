import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

// Enhanced Employee interface with additional fields for comprehensive management
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  location: string;
  status: 'active' | 'inactive' | 'onboarding' | 'terminated';
  hireDate: string;
  phone: string;
  emergencyContact: string;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  hourlyRate: number;
  employeeId: string;
  avatar?: string;
  manager: string;
  lastLogin?: string;
  performanceRating?: number;
}

// Filter preset interface for saved searches
interface FilterPreset {
  id: string;
  name: string;
  filters: {
    status?: string;
    location?: string;
    department?: string;
    complianceStatus?: string;
    dateRange?: string;
    performanceRange?: string;
    search?: string;
  };
  isDefault?: boolean;
}

// Sort configuration interface
interface SortConfig {
  key: keyof Employee;
  direction: 'asc' | 'desc';
}

// View preferences interface for customization
interface ViewPreferences {
  viewMode: 'table' | 'cards';
  itemsPerPage: number;
  visibleColumns: string[];
  density: 'compact' | 'comfortable' | 'spacious';
}

// Bulk action modal interface
interface BulkActionModal {
  isOpen: boolean;
  action: 'message' | 'export' | 'status' | 'delete' | null;
  selectedCount: number;
}

// Constants
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];
const VIRTUAL_ITEM_HEIGHT = 60; // Height of each row for virtual scrolling
const AVAILABLE_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'employeeId', label: 'Employee ID', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'location', label: 'Location', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'compliance', label: 'Compliance', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'manager', label: 'Manager', sortable: true },
  { key: 'lastLogin', label: 'Last Login', sortable: true },
  { key: 'performanceRating', label: 'Performance', sortable: true },
  { key: 'hourlyRate', label: 'Hourly Rate', sortable: true },
];

export const AdvancedEmployeeDirectory: React.FC = () => {
  // Core state management
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    department: 'all',
    complianceStatus: 'all',
    dateRange: 'all',
    performanceRange: 'all',
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastName', direction: 'asc' });
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // View preferences with persistence
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(() => {
    const saved = localStorage.getItem('employeeDirectory_viewPreferences');
    return saved ? JSON.parse(saved) : {
      viewMode: 'table',
      itemsPerPage: 25,
      visibleColumns: ['name', 'employeeId', 'position', 'department', 'location', 'status', 'compliance'],
      density: 'comfortable',
    };
  });

  // Filter presets with persistence
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(() => {
    const saved = localStorage.getItem('employeeDirectory_filterPresets');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Active Employees', filters: { status: 'active' }, isDefault: true },
      { id: '2', name: 'Onboarding', filters: { status: 'onboarding' }, isDefault: false },
      { id: '3', name: 'Compliance Issues', filters: { complianceStatus: 'non-compliant' }, isDefault: false },
      { id: '4', name: 'Recent Hires', filters: { dateRange: 'last-30-days' }, isDefault: false },
    ];
  });

  // UI state
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showFilterPresets, setShowFilterPresets] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState<BulkActionModal>({
    isOpen: false,
    action: null,
    selectedCount: 0,
  });
  const [jumpToPage, setJumpToPage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for virtual scrolling and search
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // Mock employee data - in a real app, this would come from an API
  const employees: Employee[] = useMemo(() => [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@motel.com',
      position: 'Front Desk Manager',
      department: 'Front Office',
      location: 'Downtown Motel',
      status: 'active',
      hireDate: '2023-03-15',
      phone: '(555) 123-4567',
      emergencyContact: 'John Johnson - (555) 987-6543',
      complianceStatus: 'compliant',
      hourlyRate: 18.50,
      employeeId: 'EMP001',
      manager: 'David Wilson',
      lastLogin: '2023-05-01T09:30:00',
      performanceRating: 4.5
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@motel.com',
      position: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      location: 'Airport Motel',
      status: 'active',
      hireDate: '2022-11-05',
      phone: '(555) 234-5678',
      emergencyContact: 'Lisa Chen - (555) 876-5432',
      complianceStatus: 'warning',
      hourlyRate: 16.75,
      employeeId: 'EMP002',
      manager: 'Jennifer Smith',
      lastLogin: '2023-05-02T08:15:00',
      performanceRating: 3.8
    },
    // Generate more comprehensive mock data
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 3}`,
      firstName: `First${i + 3}`,
      lastName: `Last${i + 3}`,
      email: `employee${i + 3}@motel.com`,
      position: ['Front Desk Agent', 'Housekeeper', 'Maintenance Technician', 'Night Auditor', 'Manager'][i % 5],
      department: ['Front Office', 'Housekeeping', 'Maintenance', 'Administration', 'Food & Beverage'][i % 5],
      location: ['Downtown Motel', 'Airport Motel', 'Highway Motel', 'Seaside Motel', 'Mountain View Motel'][i % 5],
      status: (['active', 'inactive', 'onboarding', 'terminated'] as const)[i % 4],
      hireDate: new Date(2020 + (i % 4), (i % 12), (i % 28) + 1).toISOString().split('T')[0],
      phone: `(555) ${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
      emergencyContact: `Emergency${i + 3} - (555) ${String(i + 200).padStart(3, '0')}-${String(i + 2000).padStart(4, '0')}`,
      complianceStatus: (['compliant', 'warning', 'non-compliant'] as const)[i % 3],
      hourlyRate: 15 + (i % 10),
      employeeId: `EMP${String(i + 3).padStart(3, '0')}`,
      manager: ['David Wilson', 'Jennifer Smith', 'Robert Brown', 'Lisa Davis'][i % 4],
      lastLogin: new Date(Date.now() - (i * 86400000)).toISOString(),
      performanceRating: Math.round((2 + Math.random() * 3) * 10) / 10
    })),
  ], []);  
  
  // Derived state for locations and departments
  const locations = useMemo(() => [...new Set(employees.map(e => e.location))].sort(), [employees]);
  const departments = useMemo(() => [...new Set(employees.map(e => e.department))].sort(), [employees]);

  // Advanced filtering and searching with performance optimization
  const filteredAndSortedEmployees = useMemo(() => {
    // First filter
    let filtered = employees.filter(employee => {
      // Enhanced text search across multiple fields
      const searchFields = [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.position,
        employee.department,
        employee.employeeId,
        employee.phone,
        employee.location,
      ].join(' ').toLowerCase();

      const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());

      // Filter conditions
      const matchesStatus = filters.status === 'all' || employee.status === filters.status;
      const matchesLocation = filters.location === 'all' || employee.location === filters.location;
      const matchesDepartment = filters.department === 'all' || employee.department === filters.department;
      const matchesCompliance = filters.complianceStatus === 'all' || employee.complianceStatus === filters.complianceStatus;

      // Date range filtering
      let matchesDateRange = true;
      if (filters.dateRange !== 'all') {
        const hireDate = new Date(employee.hireDate);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'last-30-days':
            matchesDateRange = daysDiff <= 30;
            break;
          case 'last-90-days':
            matchesDateRange = daysDiff <= 90;
            break;
          case 'last-year':
            matchesDateRange = daysDiff <= 365;
            break;
        }
      }

      // Performance rating filtering
      let matchesPerformance = true;
      if (filters.performanceRange !== 'all' && employee.performanceRating) {
        switch (filters.performanceRange) {
          case 'excellent':
            matchesPerformance = employee.performanceRating >= 4.5;
            break;
          case 'good':
            matchesPerformance = employee.performanceRating >= 3.5 && employee.performanceRating < 4.5;
            break;
          case 'needs-improvement':
            matchesPerformance = employee.performanceRating < 3.5;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesLocation && matchesDepartment &&
        matchesCompliance && matchesDateRange && matchesPerformance;
    });

    // Then sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Date comparison
      if (sortConfig.key === 'hireDate' || sortConfig.key === 'lastLogin') {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        const comparison = aDate.getTime() - bDate.getTime();
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Default string comparison
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      const comparison = aStr.localeCompare(bStr);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [employees, searchTerm, filters, sortConfig]);

  // Pagination with virtual scrolling
  const totalPages = useMemo(() => Math.ceil(filteredAndSortedEmployees.length / viewPreferences.itemsPerPage), [filteredAndSortedEmployees, viewPreferences.itemsPerPage]);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * viewPreferences.itemsPerPage;
    return filteredAndSortedEmployees.slice(startIndex, startIndex + viewPreferences.itemsPerPage);
  }, [filteredAndSortedEmployees, currentPage, viewPreferences.itemsPerPage]);

  // Enhanced auto-complete suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const suggestions = new Set<string>();
    const searchLower = searchTerm.toLowerCase();

    employees.forEach(employee => {
      // Fields to generate suggestions from
      const fields = [
        { value: employee.firstName, type: 'Name' },
        { value: employee.lastName, type: 'Name' },
        { value: employee.position, type: 'Position' },
        { value: employee.department, type: 'Department' },
        { value: employee.employeeId, type: 'ID' },
        { value: employee.location, type: 'Location' },
      ];

      fields.forEach(field => {
        if (field.value.toLowerCase().includes(searchLower)) {
          suggestions.add(JSON.stringify({ value: field.value, type: field.type }));
        }
      });
    });

    return Array.from(suggestions)
      .map(s => JSON.parse(s))
      .slice(0, 8);
  }, [searchTerm, employees]);  
  
  // Event handlers with performance optimization
  const handleSort = useCallback((key: keyof Employee) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  const handleSelectEmployee = useCallback((employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedEmployees.size === paginatedEmployees.length && paginatedEmployees.length > 0) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(paginatedEmployees.map(e => e.id)));
    }
  }, [selectedEmployees, paginatedEmployees]);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedEmployees(new Set(filteredAndSortedEmployees.map(e => e.id)));
  }, [filteredAndSortedEmployees]);

  // Filter preset management
  const applyFilterPreset = useCallback((preset: FilterPreset) => {
    setFilters(prev => ({ ...prev, ...(preset.filters || {}) }));
    if (preset.filters.search) {
      setSearchTerm(preset.filters.search);
    }
    setCurrentPage(1);
    setShowFilterPresets(false);
  }, []);

  const saveCurrentFiltersAsPreset = useCallback(() => {
    const name = prompt('Enter preset name:');
    if (name && name.trim()) {
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name: name.trim(),
        filters: { ...filters, search: searchTerm || undefined },
        isDefault: false,
      };

      const updatedPresets = [...filterPresets, newPreset];
      setFilterPresets(updatedPresets);
      localStorage.setItem('employeeDirectory_filterPresets', JSON.stringify(updatedPresets));
    }
  }, [filters, searchTerm, filterPresets]);

  const deleteFilterPreset = useCallback((presetId: string) => {
    const updatedPresets = filterPresets.filter(preset => preset.id !== presetId);
    setFilterPresets(updatedPresets);
    localStorage.setItem('employeeDirectory_filterPresets', JSON.stringify(updatedPresets));
  }, [filterPresets]);

  // Pagination handlers
  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage('');
    }
  }, [jumpToPage, totalPages]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    const newPreferences = { ...viewPreferences, itemsPerPage: newSize };
    setViewPreferences(newPreferences);
    localStorage.setItem('employeeDirectory_viewPreferences', JSON.stringify(newPreferences));
    setCurrentPage(1);
  }, [viewPreferences]);

  // Bulk actions
  const handleBulkAction = useCallback((action: BulkActionModal['action']) => {
    setBulkActionModal({
      isOpen: true,
      action,
      selectedCount: selectedEmployees.size,
    });
  }, [selectedEmployees.size]);

  const executeBulkAction = useCallback(() => {
    const { action } = bulkActionModal;
    const selectedIds = Array.from(selectedEmployees);

    setIsLoading(true);

    try {
      switch (action) {
        case 'message':
          console.log('Sending message to employees:', selectedIds);
          // Implementation would go here
          break;
        case 'export':
          console.log('Exporting employees:', selectedIds);
          exportSelectedEmployees();
          break;
        case 'status':
          console.log('Changing status for employees:', selectedIds);
          // Implementation would go here
          break;
        case 'delete':
          console.log('Deleting employees:', selectedIds);
          // Implementation would go here
          break;
      }

      setBulkActionModal({ isOpen: false, action: null, selectedCount: 0 });
      setSelectedEmployees(new Set());
    } catch (error) {
      console.error('Error executing bulk action:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bulkActionModal, selectedEmployees]);

  // Export functionality
  const exportEmployees = useCallback((format: 'csv' | 'excel' | 'pdf') => {
    const dataToExport = filteredAndSortedEmployees;
    console.log(`Exporting ${dataToExport.length} employees as ${format}`);

    if (format === 'csv') {
      const csvContent = generateCSV(dataToExport);
      downloadFile(csvContent, `employees_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }
    // Implement Excel and PDF export
  }, [filteredAndSortedEmployees]);

  const exportSelectedEmployees = useCallback(() => {
    const selectedData = employees.filter(emp => selectedEmployees.has(emp.id));
    const csvContent = generateCSV(selectedData);
    downloadFile(csvContent, `selected_employees_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }, [employees, selectedEmployees]);
  // Utility functions
  const generateCSV = (data: Employee[]) => {
    const headers = viewPreferences.visibleColumns.map(col =>
      AVAILABLE_COLUMNS.find(c => c.key === col)?.label || col
    ).join(',');

    const rows = data.map(emp =>
      viewPreferences.visibleColumns.map(col => {
        const value = col === 'name' ? `${emp.firstName} ${emp.lastName}` : emp[col as keyof Employee];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'onboarding': return 'primary';
      case 'inactive': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'gray';
    }
  };

  const getComplianceColor = (status: Employee['complianceStatus']) => {
    switch (status) {
      case 'compliant': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'non-compliant': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Effects
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'a':
            if (e.shiftKey) {
              e.preventDefault();
              handleSelectAllFiltered();
            }
            break;
        }
      }

      if (e.key === 'Escape') {
        setShowSearchSuggestions(false);
        setSelectedEmployees(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAllFiltered]); return (

    <div className="space-y-4">
      {/* Enhanced Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="Users" size={20} />
              Advanced Employee Directory
              <Badge variant="secondary" className="ml-2">
                {filteredAndSortedEmployees.length} employees
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterPresets(!showFilterPresets)}
              >
                <Icon name="Filter" size={16} className="mr-2" />
                Presets
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
              >
                <Icon name="Columns" size={16} className="mr-2" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveCurrentFiltersAsPreset}
              >
                <Icon name="Save" size={16} className="mr-2" />
                Save Preset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Search with Faceted Auto-complete */}
          <div className="relative mb-4">
            <Input
              ref={searchInputRef}
              placeholder="Search employees by name, ID, position, department..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchSuggestions(e.target.value.length >= 2);
              }}
              onFocus={() => setShowSearchSuggestions(searchTerm.length >= 2)}
              leftIcon={<Icon name="Search" size={16} />}
              className="w-full"
            />
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                    onClick={() => {
                      setSearchTerm(suggestion.value);
                      setShowSearchSuggestions(false);
                    }}
                  >
                    <span>{suggestion.value}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Presets Panel */}
          {showFilterPresets && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Saved Filter Presets</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilterPresets(false)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterPresets.map(preset => (
                  <div key={preset.id} className="flex items-center space-x-1">
                    <Button
                      variant={preset.isDefault ? "primary" : "outline"}
                      size="sm"
                      onClick={() => applyFilterPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                    {!preset.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFilterPreset(preset.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icon name="X" size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>

            <select
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="all">All Departments</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>

            <select
              value={filters.complianceStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, complianceStatus: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="all">All Compliance</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="non-compliant">Non-Compliant</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="all">All Hire Dates</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-year">Last Year</option>
            </select>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewPreferences(prev => ({
                  ...prev,
                  viewMode: prev.viewMode === 'table' ? 'cards' : 'table'
                }))}
              >
                <Icon name={viewPreferences.viewMode === 'table' ? 'Grid' : 'List'} size={16} className="mr-2" />
                {viewPreferences.viewMode === 'table' ? 'Card View' : 'Table View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    status: 'all',
                    location: 'all',
                    department: 'all',
                    complianceStatus: 'all',
                    dateRange: 'all',
                    performanceRange: 'all',
                  });
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <Icon name="RotateCcw" size={16} className="mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Column Customizer */}
      {showColumnCustomizer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customize View</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColumnCustomizer(false)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Visible Columns</h4>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_COLUMNS.map(column => (
                    <label key={column.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={viewPreferences.visibleColumns.includes(column.key)}
                        onChange={(e) => {
                          const newPreferences = {
                            ...viewPreferences,
                            visibleColumns: e.target.checked
                              ? [...viewPreferences.visibleColumns, column.key]
                              : viewPreferences.visibleColumns.filter(c => c !== column.key)
                          };
                          setViewPreferences(newPreferences);
                          localStorage.setItem('employeeDirectory_viewPreferences', JSON.stringify(newPreferences));
                        }}
                        className="rounded"
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Display Options</h4>
                  <label className="flex items-center space-x-2 mb-2">
                    <span>Items per page:</span>
                    <select
                      value={viewPreferences.itemsPerPage}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center space-x-2">
                    <span>Density:</span>
                    <select
                      value={viewPreferences.density}
                      onChange={(e) => {
                        const newPreferences = {
                          ...viewPreferences,
                          density: e.target.value as ViewPreferences['density']
                        };
                        setViewPreferences(newPreferences);
                        localStorage.setItem('employeeDirectory_viewPreferences', JSON.stringify(newPreferences));
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedEmployees.length} of {filteredAndSortedEmployees.length} employees
            {filteredAndSortedEmployees.length !== employees.length && (
              <span className="text-gray-500"> (filtered from {employees.length} total)</span>
            )}
          </span>
          {selectedEmployees.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="primary">
                {selectedEmployees.size} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('message')}
              >
                <Icon name="MessageSquare" size={16} className="mr-2" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Icon name="Download" size={16} className="mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEmployees(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportEmployees('csv')}
          >
            <Icon name="Download" size={16} className="mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportEmployees('excel')}
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
          >
            <Icon name="UserPlus" size={16} className="mr-2" />
            Add Employee
          </Button>
        </div>
      </div>
      {/* Employee Directory - Table View */}
      {viewPreferences.viewMode === 'table' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className={`w-full ${viewPreferences.density === 'compact' ? 'text-sm' : viewPreferences.density === 'spacious' ? 'text-base' : ''}`}>
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className={`px-4 text-left ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.size === paginatedEmployees.length && paginatedEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  {viewPreferences.visibleColumns.map(columnKey => {
                    const column = AVAILABLE_COLUMNS.find(c => c.key === columnKey);
                    if (!column) return null;

                    return (
                      <th
                        key={column.key}
                        className={`px-4 text-left ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                          }`}
                        onClick={column.sortable ? () => handleSort(column.key as keyof Employee) : undefined}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable && sortConfig.key === column.key && (
                            <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={16} />
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className={`px-4 text-left ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700" ref={containerRef}>
                {paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedEmployees.has(employee.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                  >
                    <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.id)}
                        onChange={() => handleSelectEmployee(employee.id)}
                        className="rounded"
                      />
                    </td>

                    {viewPreferences.visibleColumns.includes('name') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`${viewPreferences.density === 'compact' ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center`}>
                            {employee.avatar ? (
                              <img
                                src={employee.avatar}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <Icon name="User" size={viewPreferences.density === 'compact' ? 12 : 16} className="text-gray-600 dark:text-gray-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('employeeId') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-sm font-mono text-gray-900 dark:text-white`}>
                        {employee.employeeId}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('position') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        {employee.position}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('department') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        {employee.department}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('location') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        {employee.location}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('status') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                        <Badge variant={getStatusColor(employee.status)}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </Badge>
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('compliance') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                        <div className={`flex items-center ${getComplianceColor(employee.complianceStatus)}`}>
                          <Icon
                            name={
                              employee.complianceStatus === 'compliant' ? 'CheckCircle' :
                                employee.complianceStatus === 'warning' ? 'AlertTriangle' : 'AlertCircle'
                            }
                            size={16}
                            className="mr-1"
                          />
                          <span>
                            {employee.complianceStatus.charAt(0).toUpperCase() + employee.complianceStatus.slice(1)}
                          </span>
                        </div>
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('hireDate') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        {formatDate(employee.hireDate)}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('phone') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        {employee.phone}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('manager') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        {employee.manager}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('lastLogin') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-500 dark:text-gray-400`}>
                        {formatLastLogin(employee.lastLogin)}
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('performanceRating') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                        <div className="flex items-center">
                          {employee.performanceRating ? (
                            <>
                              <span className="mr-1">{employee.performanceRating.toFixed(1)}</span>
                              <Icon
                                name="Star"
                                size={16}
                                className={
                                  employee.performanceRating >= 4.5 ? "text-yellow-500" :
                                    employee.performanceRating >= 3.5 ? "text-green-500" :
                                      "text-gray-400"
                                }
                              />
                            </>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                    )}

                    {viewPreferences.visibleColumns.includes('hourlyRate') && (
                      <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'} text-gray-900 dark:text-white`}>
                        ${employee.hourlyRate.toFixed(2)}
                      </td>
                    )}

                    <td className={`px-4 ${viewPreferences.density === 'compact' ? 'py-2' : viewPreferences.density === 'spacious' ? 'py-4' : 'py-3'}`}>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Icon name="Eye" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Icon name="MoreHorizontal" size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* Employee Directory - Card View */}
      {viewPreferences.viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedEmployees.map((employee) => (
            <Card key={employee.id} className={`${selectedEmployees.has(employee.id) ? 'ring-2 ring-primary-500' : ''
              }`}>
              <CardContent className="p-0">
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {employee.avatar ? (
                        <img
                          src={employee.avatar}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Icon name="User" size={20} className="text-gray-600 dark:text-gray-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {employee.position}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedEmployees.has(employee.id)}
                    onChange={() => handleSelectEmployee(employee.id)}
                    className="rounded"
                  />
                </div>

                <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">ID</div>
                    <div className="font-mono">{employee.employeeId}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Department</div>
                    <div>{employee.department}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Location</div>
                    <div>{employee.location}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Status</div>
                    <Badge variant={getStatusColor(employee.status)}>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between">
                  <Button variant="ghost" size="sm">
                    <Icon name="Eye" size={16} className="mr-1" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="Edit" size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="MessageSquare" size={16} className="mr-1" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <Icon name="ChevronsLeft" size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }

              return (
                <Button
                  key={i}
                  variant={currentPage === pageToShow ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageToShow)}
                  className="w-8 h-8 p-0"
                >
                  {pageToShow}
                </Button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="mx-1">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <Icon name="ChevronsRight" size={16} />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
              className="w-12 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="#"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              disabled={!jumpToPage}
            >
              Go
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Action Modal */}
      {bulkActionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {bulkActionModal.action === 'message' && 'Send Message'}
                {bulkActionModal.action === 'export' && 'Export Employees'}
                {bulkActionModal.action === 'status' && 'Change Status'}
                {bulkActionModal.action === 'delete' && 'Delete Employees'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You are about to perform this action on {bulkActionModal.selectedCount} employees.
                Are you sure you want to continue?
              </p>

              {bulkActionModal.action === 'message' && (
                <textarea
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  rows={4}
                  placeholder="Type your message here..."
                />
              )}

              {bulkActionModal.action === 'status' && (
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setBulkActionModal({ isOpen: false, action: null, selectedCount: 0 })}
              >
                Cancel
              </Button>
              <Button
                variant={bulkActionModal.action === 'delete' ? 'error' : 'primary'}
                onClick={executeBulkAction}
                loading={isLoading}
              >
                Confirm
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedEmployeeDirectory;