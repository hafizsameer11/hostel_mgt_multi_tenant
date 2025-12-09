/**
 * PeopleHub page
 * Sidebar navigation with Tenants, Employees, Vendors, and Prospects sections
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as alertService from '../../services/alert.service';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import * as hostelService from '../../services/hostel.service';
import * as tenantService from '../../services/tenant.service';
import * as employeeService from '../../services/employee.service';
import * as roleService from '../../services/role.service';
import * as prospectService from '../../services/prospect.service';
import { API_BASE_URL } from '../../../services/api.config';
import { 
  BriefcaseIcon, 
  HomeIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

// Import components
import TenantForm, { type TenantFormData } from './components/TenantForm';
import EmployeeForm, { type EmployeeFormData } from './components/EmployeeForm';
import ProspectForm, { type ProspectFormData } from './components/ProspectForm';
import TenantTable from './components/TenantTable';
import EmployeeTable from './components/EmployeeTable';
import ProspectTable from './components/ProspectTable';
import ViewModal from './components/ViewModal';
import ScoreModal from './components/ScoreModal';
import EditForm from './components/EditForm';

// Lazy load VendorList
const VendorListLazy = React.lazy(() => import('../Vendor/VendorList'));

// Wrapper component to pass props to lazy-loaded VendorList
const VendorListWrapper: React.FC<{ selectedHostelId: string; onHostelChange: (id: string) => void }> = ({ selectedHostelId, onHostelChange }) => {
  return <VendorListLazy selectedHostelId={selectedHostelId} onHostelChange={onHostelChange} />;
};

type PeopleSection = 'Tenants' | 'Employees' | 'Vendors' | 'Prospects';
type VendorSubSection = 'Vendor List' | 'Vendor Management';

const PeopleHub: React.FC = () => {
  const location = useLocation();
  
  // Get active section from URL
  const getActiveSection = (): PeopleSection | null => {
    if (location.pathname.includes('/tenants')) return 'Tenants';
    if (location.pathname.includes('/employees')) return 'Employees';
    if (location.pathname.includes('/vendors')) return 'Vendors';
    if (location.pathname.includes('/prospects')) return 'Prospects';
    return null; // On base route
  };
  
  // Get active vendor sub-section from URL
  const getActiveVendorSubSection = (): VendorSubSection | null => {
    if (location.pathname.includes('/people/vendors/management')) return 'Vendor Management';
    if (location.pathname.includes('/people/vendors/list')) return 'Vendor List';
    return null;
  };
  
  const activeSection = getActiveSection();
  const activeVendorSubSection = getActiveVendorSubSection();
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [hostels, setHostels] = useState<Array<{ id: string | number; name: string; city: string }>>([]);
  const [hostelsLoading, setHostelsLoading] = useState<boolean>(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState<boolean>(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState<boolean>(false);
  const [roles, setRoles] = useState<Array<{ value: string; label: string; id: number }>>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<{ mode: 'view' | 'edit'; type: 'Tenant' | 'Employee' | 'Prospect'; data: any } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'details' | 'scorecard'>('details');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    behavior: 5,
    punctuality: 5,
    cleanliness: 5,
    remarks: '',
  });
  const [currentScoreEntity, setCurrentScoreEntity] = useState<{ type: 'Tenant' | 'Employee'; id: number; name: string } | null>(null);
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });
  // Form state for Tenant, Employee, and Prospect (for editing/pre-filling)
  const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editingProspectId, setEditingProspectId] = useState<number | null>(null);
  const [tenantFormData, setTenantFormData] = useState<Partial<TenantFormData>>({});
  const [employeeFormData, setEmployeeFormData] = useState<Partial<EmployeeFormData>>({});
  const [prospectFormData, setProspectFormData] = useState<Partial<ProspectFormData>>({});


  // Fetch hostels from API on component mount
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setHostelsLoading(true);
        const hostelsData = await hostelService.getAllHostelsFromAPI();
        // Map hostels to expected format - handle both string and number IDs
        const mappedHostels = hostelsData.map(h => ({
          id: typeof h.id === 'string' ? Number(h.id) : h.id,
          name: h.name,
          city: h.city,
        }));
        setHostels(mappedHostels);
      } catch (err: any) {
        console.error('Error fetching hostels:', err);
        // Set empty array on error to prevent crashes
        setHostels([]);
      } finally {
        setHostelsLoading(false);
      }
    };

    fetchHostels();
  }, []);

  // Fetch roles from API on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const rolesData = await roleService.getAllRoles();
        // Map roles to Select options format using role ID as value and roleName as label
        const roleOptions = rolesData.map(role => ({
          value: String(role.id), // Use role ID as value
          label: role.roleName, // Use roleName as display label
          id: role.id, // Store ID for reference
        }));
        setRoles(roleOptions);
      } catch (err: any) {
        console.error('Error fetching roles:', err);
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const hostelOptions = useMemo(
    () => {
      if (hostelsLoading) {
        return [
          { value: '', label: 'Loading hostels...' },
        ];
      }
      return [
        { value: '', label: 'All Hostels' },
        ...hostels.map((h) => ({ value: String(h.id), label: `${h.name} - ${h.city}` })),
      ];
    },
    [hostels, hostelsLoading]
  );

  // Fetch tenants when hostel is selected (only for Tenants section)
  useEffect(() => {
    const fetchTenants = async () => {
      if (activeSection === 'Tenants' && selectedHostelId) {
        try {
          setTenantsLoading(true);
          const tenantsData = await tenantService.getTenantsByHostel(Number(selectedHostelId));
          setTenants(tenantsData);
        } catch (error) {
          console.error('Error fetching tenants:', error);
          setTenants([]);
        } finally {
          setTenantsLoading(false);
        }
      } else if (activeSection === 'Tenants' && !selectedHostelId) {
        // Clear tenants when no hostel is selected
        setTenants([]);
      }
    };

    fetchTenants();
  }, [selectedHostelId, activeSection]);

  // Fetch employees when hostel is selected (only for Employees section)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (activeSection === 'Employees' && selectedHostelId) {
        try {
          setEmployeesLoading(true);
          const employeesData = await employeeService.getEmployeesByHostel(Number(selectedHostelId));
          setEmployees(employeesData);
        } catch (error) {
          console.error('Error fetching employees:', error);
          setEmployees([]);
        } finally {
          setEmployeesLoading(false);
        }
      } else if (activeSection === 'Employees' && !selectedHostelId) {
        // Clear employees when no hostel is selected
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, [selectedHostelId, activeSection]);

  // Fetch prospects when Prospects section is active (no hostel filter needed)
  useEffect(() => {
    const fetchProspects = async () => {
      if (activeSection === 'Prospects') {
        try {
          setProspectsLoading(true);
          const prospectsData = await prospectService.getAllProspects();
          setProspects(prospectsData);
        } catch (error) {
          console.error('Error fetching prospects:', error);
          setProspects([]);
        } finally {
          setProspectsLoading(false);
        }
      } else {
        // Clear prospects when not on Prospects section
        setProspects([]);
      }
    };

    fetchProspects();
  }, [activeSection]);

  // Use fetched tenants for Tenants section, otherwise use mock data filtering
  const filteredTenants = useMemo(() => {
    if (activeSection !== 'Tenants') {
      return [];
    }
    return tenants;
  }, [tenants, activeSection]);

  const filteredEmployees = useMemo(() => {
    if (activeSection !== 'Employees') {
      return [];
    }
    return employees;
  }, [employees, activeSection]);

  const filteredProspects = useMemo(() => {
    if (activeSection !== 'Prospects') {
      return [];
    }
    return prospects;
  }, [prospects, activeSection]);



  // Floors, rooms, and beds are now managed inside TenantForm component

  // Score management functions
  const getScoreKey = (type: 'Tenant' | 'Employee', id: number) => `score_${type.toLowerCase()}_${id}`;
  
  const getScore = (type: 'Tenant' | 'Employee', id: number) => {
    const key = getScoreKey(type, id);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  };

  const getScoreHistory = (type: 'Tenant' | 'Employee', id: number) => {
    const key = `score_history_${type.toLowerCase()}_${id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  const saveScore = (type: 'Tenant' | 'Employee', id: number, scoreData: any) => {
    const key = getScoreKey(type, id);
    const historyKey = `score_history_${type.toLowerCase()}_${id}`;
    
    // Calculate average
    const average = (scoreData.behavior + scoreData.punctuality + scoreData.cleanliness) / 3;
    const scoreRecord = {
      ...scoreData,
      average,
      date: new Date().toISOString(),
    };
    
    // Save current score
    localStorage.setItem(key, JSON.stringify(scoreRecord));
    
    // Add to history
    const history = getScoreHistory(type, id);
    history.unshift(scoreRecord);
    // Keep only last 10 records
    if (history.length > 10) history.pop();
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    return scoreRecord;
  };


  // Action handlers
  const handleView = async (id: number, type: 'Tenant' | 'Employee' | 'Prospect') => {
    if (type === 'Tenant') {
      // Fetch full tenant details from API
      try {
        setTenantsLoading(true);
        const tenantData = await tenantService.getTenantById(id);
        if (tenantData) {
          // Map API response to display format
          const mappedData = {
            id: tenantData.id,
            name: tenantData.name,
            firstName: tenantData.firstName,
            lastName: tenantData.lastName,
            email: tenantData.email,
            phone: tenantData.phone,
            alternatePhone: tenantData.alternatePhone,
            gender: tenantData.gender,
            dateOfBirth: tenantData.dateOfBirth,
            status: tenantData.status,
            profilePhoto: tenantData.profilePhoto,
            cnicNumber: tenantData.cnicNumber,
            monthlyRent: tenantData.monthlyRent,
            securityDeposit: tenantData.securityDeposit,
            leaseStartDate: tenantData.leaseStartDate,
            leaseEndDate: tenantData.leaseEndDate,
            notes: tenantData.notes,
            rating: tenantData.rating,
            documents: tenantData.documents,
            room: tenantData.activeAllocation?.room?.roomNumber || tenantData.activeAllocation?.room?.number || 'N/A',
            bed: tenantData.activeAllocation?.bed?.bedNumber || tenantData.activeAllocation?.bed?.number || 'N/A',
            floor: tenantData.activeAllocation?.floor?.floorName || tenantData.activeAllocation?.floor?.name || 'N/A',
            hostel: tenantData.activeAllocation?.hostel?.name || 'N/A',
            checkInDate: tenantData.activeAllocation?.checkInDate,
            expectedCheckOutDate: tenantData.activeAllocation?.expectedCheckOutDate,
            allocations: tenantData.allocations,
            recentPayments: tenantData.recentPayments || [],
            recentAlerts: tenantData.recentAlerts || [],
          };
          setModal({ mode: 'view', type, data: mappedData });
          setDetailTab('details');
        }
      } catch (error) {
        console.error('Error fetching tenant details:', error);
        setToast({
          open: true,
          type: 'error',
          message: 'Failed to load tenant details. Please try again.',
        });
      } finally {
        setTenantsLoading(false);
      }
    } else if (type === 'Employee') {
      // Fetch full employee details from API
      try {
        setEmployeesLoading(true);
        const employeeData = await employeeService.getEmployeeById(id);
        if (employeeData) {
          // Map API response to display format
          const mappedData = {
            id: employeeData.id,
            name: employeeData.user?.username || 'Unknown',
            email: employeeData.user?.email || '',
            phone: employeeData.user?.phone || null,
            username: employeeData.user?.username || '',
            status: employeeData.status,
            profilePhoto: employeeData.profilePhoto,
            employeeCode: employeeData.employeeCode,
            role: employeeData.role,
            department: employeeData.department,
            designation: employeeData.designation,
            salary: employeeData.salary,
            salaryType: employeeData.salaryType,
            joinDate: employeeData.joinDate,
            workingHours: employeeData.workingHours,
            hostelId: employeeData.hostelId,
            hostel: employeeData.hostel?.name || 'N/A',
            address: employeeData.address,
            documents: employeeData.documents,
            notes: employeeData.notes,
            emergencyContact: employeeData.emergencyContact,
            qualifications: employeeData.qualifications,
            bankDetails: employeeData.bankDetails,
            createdAt: employeeData.createdAt,
            updatedAt: employeeData.updatedAt,
            user: employeeData.user,
          };
          setModal({ mode: 'view', type, data: mappedData });
          setDetailTab('details');
        }
      } catch (error) {
        console.error('Error fetching employee details:', error);
        setToast({
          open: true,
          type: 'error',
          message: 'Failed to load employee details. Please try again.',
        });
      } finally {
        setEmployeesLoading(false);
      }
    } else if (type === 'Prospect') {
      // Fetch full prospect details from API
      try {
        setProspectsLoading(true);
        const prospectData = await prospectService.getProspectById(id);
        if (prospectData && prospectData.prospect) {
          // Map API response to display format
          const mappedData = {
            id: prospectData.prospect.id,
            firstName: prospectData.prospect.firstName || '',
            lastName: prospectData.prospect.lastName || '',
            name: prospectData.prospect.name || `${prospectData.prospect.firstName} ${prospectData.prospect.lastName}`,
            email: prospectData.prospect.email || '',
            phone: prospectData.prospect.phone || '',
            gender: prospectData.prospect.gender || '',
            dateOfBirth: prospectData.prospect.dateOfBirth || '',
            cnicNumber: prospectData.prospect.cnicNumber || '',
            status: prospectData.prospect.status || 'pending',
            profilePhoto: prospectData.prospect.profilePhoto,
            documents: prospectData.prospect.documents || [],
            profession: prospectData.prospect.profession || '',
            professionDetails: prospectData.prospect.professionDetails || '',
            professionDocuments: prospectData.prospect.professionDocuments || [],
            createdAt: prospectData.prospect.createdAt,
            updatedAt: prospectData.prospect.updatedAt,
          };
          setModal({ mode: 'view', type, data: mappedData });
          setDetailTab('details');
        }
      } catch (error) {
        console.error('Error fetching prospect details:', error);
        setToast({
          open: true,
          type: 'error',
          message: 'Failed to load prospect details. Please try again.',
        });
      } finally {
        setProspectsLoading(false);
      }
    }
  };

  const handleEdit = async (id: number, type: 'Tenant' | 'Employee' | 'Prospect') => {
    if (type === 'Tenant') {
      // Fetch tenant data from API and populate form
      try {
        setTenantsLoading(true);
        const tenantData = await tenantService.getTenantById(id);
        if (tenantData) {
          // Set editing tenant ID
          setEditingTenantId(id);
          
          // Populate form with tenant data
          setTenantFormData({
            firstName: tenantData.firstName || '',
            lastName: tenantData.lastName || '',
            email: tenantData.email || '',
            phone: tenantData.phone || '',
            gender: tenantData.gender || '',
            dateOfBirth: tenantData.dateOfBirth ? new Date(tenantData.dateOfBirth).toISOString().split('T')[0] : '',
            cnicNumber: tenantData.cnicNumber || '',
            profilePhoto: null, // Keep as null, user can upload new one if needed
            previousProfilePhoto: tenantData.profilePhoto || null,
            previousDocuments: tenantData.documents || null,
            profession: tenantData.profession || '',
            professionDetails: tenantData.professionDetails || '',
            professionDocuments: null,
            previousProfessionDocuments: tenantData.professionDocuments || null,
            emergencyContactName: tenantData.emergencyContactName || '',
            emergencyContactNumber: tenantData.emergencyContactNumber || '',
            emergencyContactRelation: tenantData.emergencyContactRelation || '',
            hostelId: tenantData.activeAllocation?.hostel?.id?.toString() || '',
            floorId: tenantData.activeAllocation?.floor?.id?.toString() || '',
            roomId: tenantData.activeAllocation?.room?.id?.toString() || '',
            bedId: tenantData.activeAllocation?.bed?.id?.toString() || '',
            leaseStartDate: tenantData.leaseStartDate ? new Date(tenantData.leaseStartDate).toISOString().split('T')[0] : '',
            leaseEndDate: tenantData.leaseEndDate ? new Date(tenantData.leaseEndDate).toISOString().split('T')[0] : '',
            monthlyRent: tenantData.monthlyRent?.toString() || '',
            securityDeposit: tenantData.securityDeposit?.toString() || '',
            documents: null, // Keep as null, user can upload new one if needed
          });
          
          // Floors, rooms, and beds will be loaded automatically by TenantForm component
          // when it opens with the hostelId from initialData
          
          // Open the add modal in edit mode - form will load data from initialData prop
          setIsAddModalOpen(true);
        }
      } catch (error) {
        console.error('Error fetching tenant for edit:', error);
        setToast({
          open: true,
          type: 'error',
          message: 'Failed to load tenant data for editing. Please try again.',
        });
      } finally {
        setTenantsLoading(false);
      }
    } else if (type === 'Employee') {
      // Set editing employee ID and open modal first - form will reset itself
      setEditingEmployeeId(id);
      setIsAddModalOpen(true);
      
      // Then fetch employee data from API and populate form
      try {
        setEmployeesLoading(true);
        console.log('Fetching employee data for edit, ID:', id);
        const employeeData = await employeeService.getEmployeeForEdit(id);
        console.log('Employee data received:', employeeData);
        
        // The service should return { user: {...}, employee: {...} }
        if (employeeData && employeeData.employee && employeeData.user) {
          // Find the role ID from the roles list based on role name
          // The employee.role might be a role name string, we need to find matching role ID
          const roleName = employeeData.employee.role;
          console.log('Looking for role:', roleName, 'in roles:', roles);
          const roleOption = roles.find(r => r.label.toLowerCase() === roleName?.toLowerCase());
          const roleId = roleOption ? roleOption.value : '';
          console.log('Found role ID:', roleId);
          
          // Populate form with employee data
          setEmployeeFormData({
            name: employeeData.user.username || '',
            email: employeeData.user.email || '',
            phone: employeeData.user.phone || '',
            username: employeeData.user.username || '',
            password: '', // Don't pre-fill password
            profilePhoto: null, // Keep as null, user can upload new one if needed
            previousProfilePhoto: employeeData.employee.profilePhoto || null,
            previousDocuments: employeeData.employee.documents || null,
            address: {
              street: employeeData.employee.address?.street || '',
              city: employeeData.employee.address?.city || '',
              country: employeeData.employee.address?.country || '',
            },
            roleId: roleId,
            hostelId: employeeData.employee.hostelId?.toString() || '',
            joinDate: employeeData.employee.joinDate ? new Date(employeeData.employee.joinDate).toISOString().split('T')[0] : '',
            salary: employeeData.employee.salary?.toString() || '',
            salaryType: employeeData.employee.salaryType || 'monthly',
            workingHours: employeeData.employee.workingHours || '',
            document: null, // Keep as null, user can upload new one if needed
            notes: employeeData.employee.notes || '',
          });
          
          console.log('Form data populated successfully');
        } else {
          console.error('Invalid employee data structure:', employeeData);
          console.error('Full response object:', JSON.stringify(employeeData, null, 2));
          
          setToast({
            open: true,
            type: 'error',
            message: 'Failed to load employee data. The response structure is invalid. Please check the console for details.',
          });
        }
      } catch (error: any) {
        console.error('Error fetching employee for edit:', error);
        console.error('Error details:', error?.response?.data || error?.message);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load employee data for editing. Please try again.';
        setToast({
          open: true,
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setEmployeesLoading(false);
      }
    } else if (type === 'Prospect') {
      // Fetch prospect data from API and populate form
      try {
        setProspectsLoading(true);
        const prospectData = await prospectService.getProspectForEdit(id);
        if (prospectData && prospectData.prospect) {
          // Set editing prospect ID
          setEditingProspectId(id);
          
          // Populate form with prospect data
          setProspectFormData({
            firstName: prospectData.prospect.firstName || '',
            lastName: prospectData.prospect.lastName || '',
            email: prospectData.prospect.email || '',
            phone: prospectData.prospect.phone || '',
            gender: prospectData.prospect.gender || '',
            dateOfBirth: prospectData.prospect.dateOfBirth ? new Date(prospectData.prospect.dateOfBirth).toISOString().split('T')[0] : '',
            cnicNumber: prospectData.prospect.cnicNumber || '',
            profilePhoto: null, // Keep as null, user can upload new one if needed
            previousProfilePhoto: prospectData.prospect.profilePhoto || null,
            previousDocuments: prospectData.prospect.documents || null,
            profession: prospectData.prospect.profession || '',
            professionDetails: prospectData.prospect.professionDetails || '',
            professionDocuments: null,
            previousProfessionDocuments: prospectData.prospect.professionDocuments || null,
            documents: null, // Keep as null, user can upload new one if needed
          });
          
          // Open the add modal in edit mode - form will load data from initialData prop
          setIsAddModalOpen(true);
        }
      } catch (error) {
        console.error('Error fetching prospect for edit:', error);
        setToast({
          open: true,
          type: 'error',
          message: 'Failed to load prospect data for editing. Please try again.',
        });
      } finally {
        setProspectsLoading(false);
      }
    }
  };

  const handleDelete = async (id: number, type: 'Tenant' | 'Employee' | 'Prospect', name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    if (type === 'Tenant') {
      try {
        setTenantsLoading(true);
        await tenantService.deleteTenant(id);
        
        setToast({
          open: true,
          type: 'success',
          message: `Tenant "${name}" deleted successfully!`,
        });

        // Refresh tenant list if a hostel is selected
        if (selectedHostelId && activeSection === 'Tenants') {
          try {
            const tenantsData = await tenantService.getTenantsByHostel(Number(selectedHostelId));
            setTenants(tenantsData);
          } catch (error) {
            console.error('Error refreshing tenant list:', error);
          }
        }
      } catch (error: any) {
        console.error('Error deleting tenant:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete tenant. Please try again.';
        setToast({
          open: true,
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setTenantsLoading(false);
      }
    } else if (type === 'Employee') {
      try {
        setEmployeesLoading(true);
        await employeeService.deleteEmployee(id);
        
        setToast({
          open: true,
          type: 'success',
          message: `Employee "${name}" deleted successfully!`,
        });

        // Refresh employee list if a hostel is selected
        if (selectedHostelId && activeSection === 'Employees') {
          try {
            const employeesData = await employeeService.getEmployeesByHostel(Number(selectedHostelId));
            setEmployees(employeesData);
          } catch (error) {
            console.error('Error refreshing employee list:', error);
          }
        }
      } catch (error: any) {
        console.error('Error deleting employee:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete employee. Please try again.';
        setToast({
          open: true,
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setEmployeesLoading(false);
      }
    } else if (type === 'Prospect') {
      try {
        setProspectsLoading(true);
        await prospectService.deleteProspect(id);
        
        setToast({
          open: true,
          type: 'success',
          message: `Prospect "${name}" deleted successfully!`,
        });

        // Refresh prospects list
        if (activeSection === 'Prospects') {
          try {
            const prospectsData = await prospectService.getAllProspects();
            setProspects(prospectsData);
          } catch (error) {
            console.error('Error refreshing prospects list:', error);
          }
        }
      } catch (error: any) {
        console.error('Error deleting prospect:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete prospect. Please try again.';
        setToast({
          open: true,
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setProspectsLoading(false);
      }
    }
  };

  const handleAddClick = () => {
    // Reset editing IDs - forms will reset themselves when opened
    setEditingTenantId(null);
    setEditingEmployeeId(null);
    setEditingProspectId(null);
    setTenantFormData({});
    setEmployeeFormData({});
    setProspectFormData({});
    setIsAddModalOpen(true);
  };

  // Wrapper function for TenantForm onSubmit - receives formData from TenantForm component
  const handleTenantSubmit = async (formDataFromComponent: TenantFormData): Promise<void> => {
    const tenantName = `${formDataFromComponent.firstName} ${formDataFromComponent.lastName}`;
    const isEditing = editingTenantId !== null;
    
    // Create FormData for file uploads
    const formData = new FormData();
    formData.append('firstName', formDataFromComponent.firstName);
    formData.append('lastName', formDataFromComponent.lastName);
    formData.append('email', formDataFromComponent.email);
    formData.append('phone', formDataFromComponent.phone);
    formData.append('gender', formDataFromComponent.gender);
    if (formDataFromComponent.dateOfBirth) {
      formData.append('dateOfBirth', formDataFromComponent.dateOfBirth);
    }
    if (formDataFromComponent.cnicNumber) {
      formData.append('cnicNumber', formDataFromComponent.cnicNumber);
    }
    if (formDataFromComponent.hostelId) {
      formData.append('hostelId', formDataFromComponent.hostelId);
    }
    if (formDataFromComponent.floorId) {
      formData.append('floorId', formDataFromComponent.floorId);
    }
    if (formDataFromComponent.roomId) {
      formData.append('roomId', formDataFromComponent.roomId);
    }
    if (formDataFromComponent.bedId) {
      formData.append('bedId', formDataFromComponent.bedId);
    }
    if (formDataFromComponent.leaseStartDate) {
      formData.append('leaseStartDate', formDataFromComponent.leaseStartDate);
    }
    if (formDataFromComponent.leaseEndDate) {
      formData.append('leaseEndDate', formDataFromComponent.leaseEndDate);
    }
    formData.append('monthlyRent', formDataFromComponent.monthlyRent || '0');
    formData.append('securityDeposit', formDataFromComponent.securityDeposit || '0');
    
    // Professional fields
    if (formDataFromComponent.profession) {
      formData.append('profession', formDataFromComponent.profession);
    }
    if (formDataFromComponent.professionDetails) {
      formData.append('professionDetails', formDataFromComponent.professionDetails);
    }
    if (formDataFromComponent.professionDocuments) {
      formData.append('professionDocuments', formDataFromComponent.professionDocuments);
    }
    
    // Emergency contact fields
    if (formDataFromComponent.emergencyContactName) {
      formData.append('emergencyContactName', formDataFromComponent.emergencyContactName);
    }
    if (formDataFromComponent.emergencyContactNumber) {
      formData.append('emergencyContactNumber', formDataFromComponent.emergencyContactNumber);
    }
    if (formDataFromComponent.emergencyContactRelation) {
      formData.append('emergencyContactRelation', formDataFromComponent.emergencyContactRelation);
    }
    
    if (formDataFromComponent.profilePhoto) {
      formData.append('profilePhoto', formDataFromComponent.profilePhoto);
    }
    
    if (formDataFromComponent.documents) {
      formData.append('documents', formDataFromComponent.documents);
    }

    try {
      setToast({
        open: true,
        type: 'info',
        message: isEditing ? 'Updating tenant...' : 'Creating tenant...',
      });

      let response;
      if (isEditing && editingTenantId) {
        response = await tenantService.updateTenant(editingTenantId, formData);
      } else {
        response = await tenantService.createTenant(formData);
        
        // Create check-in alert in maintenance tab (only for new tenants)
        try {
          alertService.createCheckInAlert(
            tenantName,
            `Room ${formDataFromComponent.roomId}`,
            `Bed ${formDataFromComponent.bedId}`
          );
        } catch (error) {
          console.error('Failed to create check-in alert:', error);
        }
      }

      setToast({
        open: true,
        type: 'success',
        message: response.message || (isEditing ? `Tenant "${tenantName}" updated successfully!` : `Tenant "${tenantName}" added successfully!`),
      });

      setIsAddModalOpen(false);
      setEditingTenantId(null);
      setTenantFormData({});

      // Refresh tenant list if a hostel is selected
      if (selectedHostelId && activeSection === 'Tenants') {
        try {
          const tenantsData = await tenantService.getTenantsByHostel(Number(selectedHostelId));
          setTenants(tenantsData);
        } catch (error) {
          console.error('Error refreshing tenants:', error);
        }
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} tenant:`, error);
      setToast({
        open: true,
        type: 'error',
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} tenant. Please try again.`,
      });
      throw error; // Re-throw so TenantForm can handle it
    }
  };

  // Wrapper function for EmployeeForm onSubmit - receives formData from EmployeeForm component
  const handleEmployeeSubmit = async (formDataFromComponent: EmployeeFormData): Promise<void> => {
    const employeeName = formDataFromComponent.name;
    const isEditing = editingEmployeeId !== null;
    
    try {
      setEmployeesLoading(true);
      setToast({
        open: true,
        type: 'info',
        message: isEditing ? 'Updating employee...' : 'Creating employee...',
      });

      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // User fields
      formData.append('username', formDataFromComponent.username);
      formData.append('email', formDataFromComponent.email);
      formData.append('phone', formDataFromComponent.phone);
      if (formDataFromComponent.password) {
        formData.append('password', formDataFromComponent.password);
      }
      
      // Employee fields
      formData.append('name', formDataFromComponent.name);
      if (formDataFromComponent.roleId) {
        formData.append('roleId', formDataFromComponent.roleId);
      }
      if (formDataFromComponent.hostelId) {
        formData.append('hostelId', formDataFromComponent.hostelId);
      }
      if (formDataFromComponent.joinDate) {
        formData.append('joinDate', formDataFromComponent.joinDate);
      }
      if (formDataFromComponent.salary) {
        formData.append('salary', formDataFromComponent.salary);
      }
      if (formDataFromComponent.workingHours) {
        formData.append('workingHours', formDataFromComponent.workingHours);
      }
      if (formDataFromComponent.notes) {
        formData.append('notes', formDataFromComponent.notes);
      }
      
      // Address fields
      if (formDataFromComponent.address.street) {
        formData.append('address[street]', formDataFromComponent.address.street);
      }
      if (formDataFromComponent.address.city) {
        formData.append('address[city]', formDataFromComponent.address.city);
      }
      if (formDataFromComponent.address.country) {
        formData.append('address[country]', formDataFromComponent.address.country);
      }
      
      // Files
      if (formDataFromComponent.profilePhoto) {
        formData.append('profilePhoto', formDataFromComponent.profilePhoto);
      }
      if (formDataFromComponent.document) {
        formData.append('documents', formDataFromComponent.document);
      }

      let response;
      if (isEditing && editingEmployeeId) {
        response = await employeeService.updateEmployee(editingEmployeeId, formData);
      } else {
        response = await employeeService.createEmployee(formData);
      }
      
      if (response && response.success) {
        setToast({
          open: true,
          type: 'success',
          message: response.message || (isEditing ? `Employee "${employeeName}" updated successfully!` : `Employee "${employeeName}" added successfully!`),
        });
        setIsAddModalOpen(false);
        setEditingEmployeeId(null);
        setEmployeeFormData({});
        
        // Refresh employees list if hostel is selected
        if (selectedHostelId && activeSection === 'Employees') {
          const employeesData = await employeeService.getEmployeesByHostel(Number(selectedHostelId));
          setEmployees(employeesData);
        }
      } else {
        throw new Error(response?.message || `Failed to ${isEditing ? 'update' : 'create'} employee`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} employee:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEditing ? 'update' : 'create'} employee. Please try again.`;
      setToast({
        open: true,
        type: 'error',
        message: errorMessage,
      });
      throw error; // Re-throw so EmployeeForm can handle it
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Wrapper function for ProspectForm onSubmit - receives formData from ProspectForm component
  const handleProspectSubmit = async (formDataFromComponent: ProspectFormData): Promise<void> => {
    const prospectName = `${formDataFromComponent.firstName} ${formDataFromComponent.lastName}`;
    const isEditing = editingProspectId !== null;
    
    try {
      setProspectsLoading(true);
      setToast({
        open: true,
        type: 'info',
        message: isEditing ? 'Updating prospect...' : 'Creating prospect...',
      });

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('firstName', formDataFromComponent.firstName);
      formData.append('lastName', formDataFromComponent.lastName);
      formData.append('email', formDataFromComponent.email);
      formData.append('phone', formDataFromComponent.phone);
      formData.append('gender', formDataFromComponent.gender);
      if (formDataFromComponent.dateOfBirth) {
        formData.append('dateOfBirth', formDataFromComponent.dateOfBirth);
      }
      if (formDataFromComponent.cnicNumber) {
        formData.append('cnicNumber', formDataFromComponent.cnicNumber);
      }
      
      // Professional fields
      if (formDataFromComponent.profession) {
        formData.append('profession', formDataFromComponent.profession);
      }
      if (formDataFromComponent.professionDetails) {
        formData.append('professionDetails', formDataFromComponent.professionDetails);
      }
      
      // Files
      if (formDataFromComponent.profilePhoto) {
        formData.append('profilePhoto', formDataFromComponent.profilePhoto);
      }
      if (formDataFromComponent.documents) {
        formData.append('documents', formDataFromComponent.documents);
      }
      if (formDataFromComponent.professionDocuments) {
        formData.append('professionDocuments', formDataFromComponent.professionDocuments);
      }

      let response;
      if (isEditing && editingProspectId) {
        response = await prospectService.updateProspect(editingProspectId, formData);
      } else {
        response = await prospectService.createProspect(formData);
      }
      
      if (response && response.success) {
        setToast({
          open: true,
          type: 'success',
          message: response.message || (isEditing ? `Prospect "${prospectName}" updated successfully!` : `Prospect "${prospectName}" added successfully!`),
        });
        setIsAddModalOpen(false);
        setEditingProspectId(null);
        setProspectFormData({});
        
        // Refresh prospects list
        if (activeSection === 'Prospects') {
          const prospectsData = await prospectService.getAllProspects();
          setProspects(prospectsData);
        }
      } else {
        throw new Error(response?.message || `Failed to ${isEditing ? 'update' : 'create'} prospect`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} prospect:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEditing ? 'update' : 'create'} prospect. Please try again.`;
      setToast({
        open: true,
        type: 'error',
        message: errorMessage,
      });
      throw error; // Re-throw so ProspectForm can handle it
    } finally {
      setProspectsLoading(false);
    }
  };

  const handleAddClose = () => {
    setIsAddModalOpen(false);
    setEditingTenantId(null);
    setEditingEmployeeId(null);
    setEditingProspectId(null);
    setTenantFormData({});
    setEmployeeFormData({});
    setProspectFormData({});
  };

  const handleScoreClick = (type: 'Tenant' | 'Employee', id: number, name: string) => {
    setCurrentScoreEntity({ type, id, name });
    const existingScore = getScore(type, id);
    if (existingScore) {
      setScoreForm({
        behavior: existingScore.behavior,
        punctuality: existingScore.punctuality,
        cleanliness: existingScore.cleanliness,
        remarks: existingScore.remarks || '',
      });
    } else {
      setScoreForm({
        behavior: 5,
        punctuality: 5,
        cleanliness: 5,
        remarks: '',
      });
    }
    setIsScoreModalOpen(true);
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScoreEntity) return;

    const scoreRecord = saveScore(
      currentScoreEntity.type,
      currentScoreEntity.id,
      scoreForm
    );

    setToast({
      open: true,
      type: 'success',
      message: `Score updated successfully! Overall: ${scoreRecord.average.toFixed(1)}/5`,
    });

    setIsScoreModalOpen(false);
    
    // Refresh modal data if open
    if (modal && modal.data.id === currentScoreEntity.id) {
      setModal({ ...modal });
    }
  };

  const handleScoreClose = () => {
    setIsScoreModalOpen(false);
    setCurrentScoreEntity(null);
    setScoreForm({
      behavior: 5,
      punctuality: 5,
      cleanliness: 5,
      remarks: '',
    });
  };

  const calculateAverage = () => {
    return ((scoreForm.behavior + scoreForm.punctuality + scoreForm.cleanliness) / 3).toFixed(1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSection ? (
          <>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {activeSection === 'Vendors' 
                ? (activeVendorSubSection === 'Vendor Management' ? 'Vendor Management' : 'Vendor List')
                : activeSection}
            </h1>
            <p className="text-slate-600 mt-1">
              {activeSection === 'Tenants' && 'Manage tenant information and room allocations.'}
              {activeSection === 'Employees' && 'Manage employee information and roles.'}
              {activeSection === 'Vendors' && activeVendorSubSection === 'Vendor List' && 'View and manage all vendors.'}
              {activeSection === 'Vendors' && activeVendorSubSection === 'Vendor Management' && 'Manage vendor services and assignments.'}
              {activeSection === 'Prospects' && 'Manage potential tenants and applications.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {(activeSection === 'Tenants' || activeSection === 'Employees' || activeSection === 'Vendors' || activeSection === 'Prospects') && (
              <>
                {(activeSection !== 'Prospects') && (
                  <div className="w-full sm:w-80">
                    <Select
                      value={selectedHostelId}
                      onChange={setSelectedHostelId}
                      options={hostelOptions}
                      disabled={hostelsLoading}
                    />
                  </div>
                )}
                {(activeSection === 'Tenants' || activeSection === 'Employees' || activeSection === 'Prospects') && (
                  <Button
                    variant="primary"
                    onClick={handleAddClick}
                    icon={UserPlusIcon}
                  >
                    {activeSection === 'Tenants' ? 'Add Tenant' : activeSection === 'Employees' ? 'Add Employee' : 'Add Prospect'}
                  </Button>
                )}
                {activeSection === 'Vendors' && activeVendorSubSection === 'Vendor List' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Dispatch event to open vendor modal
                      window.dispatchEvent(new CustomEvent('openAddVendorModal'));
                    }}
                    icon={UserPlusIcon}
                  >
                    Add Vendor
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {activeSection === 'Vendors' ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[calc(100vh-300px)]">
              <React.Suspense fallback={
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading vendor management...</p>
                </div>
              }>
                <VendorListWrapper 
                  selectedHostelId={selectedHostelId}
                  onHostelChange={setSelectedHostelId}
                />
              </React.Suspense>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-white/20 shadow-xl p-6">
          {activeSection === 'Prospects' ? (
            prospectsLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">Loading Prospects...</h3>
                <p className="text-gray-600">Please wait while we fetch the prospects.</p>
              </div>
            ) : filteredProspects.length === 0 ? (
              <div className="text-center py-16">
                <UserPlusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Prospects Found</h3>
                <p className="text-gray-600 mb-6">No prospects found. Start by adding your first prospect.</p>
                <Button variant="primary" onClick={handleAddClick} icon={UserPlusIcon}>
                  Add Prospect
                </Button>
              </div>
            ) : (
              <ProspectTable
                prospects={filteredProspects}
                onView={(id) => handleView(id, 'Prospect')}
                onEdit={(id) => handleEdit(id, 'Prospect')}
                onDelete={(id, name) => handleDelete(id, 'Prospect', name)}
              />
            )
          ) : !selectedHostelId ? (
            <div className="text-center py-16">
              <HomeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Hostel</h3>
              <p className="text-gray-600 mb-6">Please select a hostel from the dropdown above to view {activeSection?.toLowerCase()}.</p>
            </div>
          ) : activeSection === 'Tenants' ? (
            tenantsLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2176FF]"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">Loading Tenants...</h3>
                <p className="text-gray-600">Please wait while we fetch the tenants.</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-16">
                <UserPlusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tenants Found</h3>
                <p className="text-gray-600 mb-6">No tenants found for the selected hostel.</p>
                <Button variant="primary" onClick={handleAddClick} icon={UserPlusIcon}>
                  Add Tenant
                </Button>
              </div>
            ) : (
              <TenantTable
                tenants={filteredTenants}
                onView={(id) => handleView(id, 'Tenant')}
                onEdit={(id) => handleEdit(id, 'Tenant')}
                onDelete={(id, name) => handleDelete(id, 'Tenant', name)}
              />
            )
          ) : activeSection === 'Employees' ? (
            employeesLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-16">
                <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Employees Found</h3>
                <p className="text-gray-600 mb-6">No employees found for the selected hostel.</p>
                <Button variant="primary" onClick={handleAddClick} icon={UserPlusIcon}>
                  Add Employee
                </Button>
              </div>
            ) : (
              <EmployeeTable
                employees={filteredEmployees}
                onView={(id) => handleView(id, 'Employee')}
                onEdit={(id) => handleEdit(id, 'Employee')}
                onDelete={(id, name) => handleDelete(id, 'Employee', name)}
              />
            )
          ) : null}
            </div>
          )}
          </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Select a Section</h2>
              <p className="text-slate-600">Choose a section from the directory to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* View/Edit Modal */}
      {modal && (
        <ViewModal
          modal={modal}
          onClose={() => setModal(null)}
          detailTab={detailTab}
          onDetailTabChange={setDetailTab}
          onScoreClick={(type, id, name) => handleScoreClick(type, id, name)}
          getScore={getScore}
          getScoreHistory={getScoreHistory}
        />
      )}

      {/* Add Tenant Modal */}
      {isAddModalOpen && activeSection === 'Tenants' && (
        <TenantForm
          isOpen={isAddModalOpen}
          onClose={handleAddClose}
          onSubmit={handleTenantSubmit}
          editingId={editingTenantId}
          initialData={editingTenantId ? tenantFormData : undefined}
          hostelOptions={hostelOptions}
          hostelsLoading={hostelsLoading}
        />
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && activeSection === 'Employees' && (
        <EmployeeForm
          isOpen={isAddModalOpen}
          onClose={handleAddClose}
          onSubmit={handleEmployeeSubmit}
          editingId={editingEmployeeId}
          initialData={editingEmployeeId ? employeeFormData : undefined}
          hostelOptions={hostelOptions}
          hostelsLoading={hostelsLoading}
          roleOptions={roles}
          rolesLoading={rolesLoading}
        />
      )}

      {/* Add Prospect Modal */}
      {isAddModalOpen && activeSection === 'Prospects' && (
        <ProspectForm
          isOpen={isAddModalOpen}
          onClose={handleAddClose}
          onSubmit={handleProspectSubmit}
          editingId={editingProspectId}
          initialData={editingProspectId ? prospectFormData : undefined}
        />
      )}

      {/* Old modal code removed - using ViewModal component instead */}
      {false && false && modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 flex-shrink-0 ${modal.mode === 'view' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {modal.mode === 'view' ? 'View Details' : 'Edit Details'} — {modal.type}
                </h3>
                <p className="text-white/80 text-sm">{modal.data?.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-white/90 hover:text-white text-lg">×</button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {modal.mode === 'view' ? (
                <>
                  {/* Tabs - Only show for Tenant and Employee, not for Owner */}
                  {(modal.type === 'Tenant' || modal.type === 'Employee') && (
                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                      <button
                        onClick={() => setDetailTab('details')}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                          detailTab === 'details'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setDetailTab('scorecard')}
                        className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                          detailTab === 'scorecard'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <TrophyIcon className="w-4 h-4" />
                        Score Card 🏆
                      </button>
                    </div>
                  )}

                  {/* Tab Content */}
                  {((modal.type === 'Tenant' || modal.type === 'Employee') ? detailTab === 'details' : true) ? (
                    <div className="space-y-4">
                      {modal.type === 'Tenant' ? (
                        <>
                          {/* Profile Photo */}
                          <div className="flex justify-center mb-6">
                            {modal.data.profilePhoto ? (
                              <img 
                                src={`${API_BASE_URL.replace('/api', '')}${modal.data.profilePhoto}`} 
                                alt={modal.data.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-2xl';
                                    fallback.textContent = `${modal.data.firstName?.charAt(0) || ''}${modal.data.lastName?.charAt(0) || ''}`.toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                                {`${modal.data.firstName?.charAt(0) || ''}${modal.data.lastName?.charAt(0) || ''}`.toUpperCase() || modal.data.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Info label="First Name" value={modal.data.firstName || modal.data.name?.split(' ')[0]} />
                            <Info label="Last Name" value={modal.data.lastName || modal.data.name?.split(' ')[1] || ''} />
                            <Info label="Full Name" value={modal.data.name} />
                            <Info label="Status" value={modal.data.status} />
                            <Info label="Email" value={modal.data.email} />
                            <Info label="Phone" value={modal.data.phone} />
                            {modal.data.alternatePhone && <Info label="Alternate Phone" value={modal.data.alternatePhone} />}
                            <Info label="Gender" value={modal.data.gender} />
                            <Info label="Date of Birth" value={modal.data.dateOfBirth ? new Date(modal.data.dateOfBirth).toLocaleDateString() : 'N/A'} />
                            <Info label="CNIC Number" value={modal.data.cnicNumber || 'N/A'} />
                            <Info label="Hostel" value={modal.data.hostel} />
                            <Info label="Floor" value={modal.data.floor} />
                            <Info label="Room" value={modal.data.room} />
                            <Info label="Bed" value={modal.data.bed} />
                            <Info label="Lease Start Date" value={modal.data.leaseStartDate ? new Date(modal.data.leaseStartDate).toLocaleDateString() : 'N/A'} />
                            <Info label="Lease End Date" value={modal.data.leaseEndDate ? new Date(modal.data.leaseEndDate).toLocaleDateString() : 'N/A'} />
                            <Info label="Monthly Rent" value={modal.data.monthlyRent ? `$${modal.data.monthlyRent.toLocaleString()}` : 'N/A'} />
                            <Info label="Security Deposit" value={modal.data.securityDeposit ? `$${modal.data.securityDeposit.toLocaleString()}` : 'N/A'} />
                            {modal.data.checkInDate && <Info label="Check-In Date" value={new Date(modal.data.checkInDate).toLocaleDateString()} />}
                            {modal.data.expectedCheckOutDate && <Info label="Expected Check-Out Date" value={new Date(modal.data.expectedCheckOutDate).toLocaleDateString()} />}
                            {modal.data.rating !== undefined && <Info label="Rating" value={modal.data.rating.toString()} />}
                            {modal.data.notes && <Info label="Notes" value={modal.data.notes} />}
                          </div>
                          
                          {/* Documents */}
                          {modal.data.documents && modal.data.documents.length > 0 && (() => {
                            const imageDocs = modal.data.documents.filter((doc: any) => 
                              doc.mimetype?.startsWith('image/') || 
                              /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '')
                            );
                            const otherDocs = modal.data.documents.filter((doc: any) => 
                              !doc.mimetype?.startsWith('image/') && 
                              !/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '')
                            );

                            return (
                              <div className="mt-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Documents</h4>
                                
                                {/* Images Grid */}
                                {imageDocs.length > 0 && (
                                  <div className="mb-6">
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">Images</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                      {imageDocs.map((doc: any, idx: number) => {
                                        const imageUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                                        const imageName = doc.originalName || doc.filename || 'Image';
                                        
                                        return (
                                          <div
                                            key={doc.id || doc.url || `doc-${idx}`}
                                            className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md"
                                          >
                                            <a
                                              href={imageUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                                <img
                                                  src={imageUrl}
                                                  alt={imageName}
                                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                      parent.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                                          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                          </svg>
                                                        </div>
                                                      `;
                                                    }
                                                  }}
                                                />
                                              </div>
                                              <div className="p-2 bg-white border-t border-gray-200">
                                                <p className="text-xs text-gray-700 font-medium truncate" title={imageName}>
                                                  {imageName}
                                                </p>
                                              </div>
                                            </a>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Other Documents */}
                                {otherDocs.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                                      {imageDocs.length > 0 ? 'Other Documents' : 'Documents'}
                                    </h5>
                                    <div className="space-y-2">
                                      {otherDocs.map((doc: any, idx: number) => (
                                        <a
                                          key={doc.id || doc.url || `doc-${idx}`}
                                          href={`${API_BASE_URL.replace('/api', '')}${doc.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300"
                                        >
                                          <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                          <span className="text-sm text-gray-700 flex-1 truncate" title={doc.originalName || doc.filename}>
                                            {doc.originalName || doc.filename}
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      ) : modal.type === 'Employee' ? (
                        <>
                          {/* Profile Photo */}
                          <div className="flex justify-center mb-6">
                            {modal.data.profilePhoto ? (
                              <img 
                                src={`${API_BASE_URL.replace('/api', '')}${modal.data.profilePhoto}`} 
                                alt={modal.data.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-green-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-bold text-2xl';
                                    const nameParts = modal.data.name?.split(' ') || [];
                                    const firstName = nameParts[0] || '';
                                    const lastName = nameParts[1] || '';
                                    fallback.textContent = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || modal.data.name.charAt(0).toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-bold text-2xl">
                                {(() => {
                                  const nameParts = modal.data.name?.split(' ') || [];
                                  const firstName = nameParts[0] || '';
                                  const lastName = nameParts[1] || '';
                                  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || modal.data.name.charAt(0).toUpperCase();
                                })()}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Info label="Name" value={modal.data.name} />
                            <Info label="Username" value={modal.data.username || 'N/A'} />
                            <Info label="Status" value={modal.data.status} />
                            <Info label="Email" value={modal.data.email} />
                            <Info label="Phone" value={modal.data.phone || 'N/A'} />
                            <Info label="Employee Code" value={modal.data.employeeCode || 'N/A'} />
                            <Info label="Role" value={modal.data.role || 'N/A'} />
                            {modal.data.department && <Info label="Department" value={modal.data.department} />}
                            {modal.data.designation && <Info label="Designation" value={modal.data.designation} />}
                            <Info label="Join Date" value={modal.data.joinDate ? new Date(modal.data.joinDate).toLocaleDateString() : 'N/A'} />
                            {modal.data.salary && <Info label="Salary" value={`${modal.data.salary} (${modal.data.salaryType || 'monthly'})`} />}
                            {modal.data.workingHours && <Info label="Working Hours" value={modal.data.workingHours} />}
                            {modal.data.hostel && <Info label="Hostel" value={modal.data.hostel} />}
                            {modal.data.address && (
                              <>
                                {modal.data.address.street && <Info label="Street" value={modal.data.address.street} />}
                                {modal.data.address.city && <Info label="City" value={modal.data.address.city} />}
                                {modal.data.address.country && <Info label="Country" value={modal.data.address.country} />}
                              </>
                            )}
                            {modal.data.notes && <Info label="Notes" value={modal.data.notes} />}
                            {modal.data.createdAt && <Info label="Created At" value={new Date(modal.data.createdAt).toLocaleDateString()} />}
                            {modal.data.updatedAt && <Info label="Updated At" value={new Date(modal.data.updatedAt).toLocaleDateString()} />}
                          </div>
                          
                          {/* Documents */}
                          {modal.data.documents && modal.data.documents.length > 0 && (() => {
                            const imageDocs = modal.data.documents.filter((doc: any) => 
                              doc.mimetype?.startsWith('image/') || 
                              /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '')
                            );
                            const otherDocs = modal.data.documents.filter((doc: any) => 
                              !doc.mimetype?.startsWith('image/') && 
                              !/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '')
                            );

                            return (
                              <div className="mt-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Documents</h4>
                                
                                {/* Images Grid */}
                                {imageDocs.length > 0 && (
                                  <div className="mb-6">
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">Images</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                      {imageDocs.map((doc: any, idx: number) => {
                                        const imageUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                                        const imageName = doc.originalName || doc.filename || 'Image';
                                        
                                        return (
                                          <div
                                            key={doc.id || doc.url || `doc-${idx}`}
                                            className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-green-300 transition-all hover:shadow-md"
                                          >
                                            <a
                                              href={imageUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                                <img
                                                  src={imageUrl}
                                                  alt={imageName}
                                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                      parent.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                                          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                          </svg>
                                                        </div>
                                                      `;
                                                    }
                                                  }}
                                                />
                                              </div>
                                              <div className="p-2 bg-white border-t border-gray-200">
                                                <p className="text-xs text-gray-700 font-medium truncate" title={imageName}>
                                                  {imageName}
                                                </p>
                                              </div>
                                            </a>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Other Documents */}
                                {otherDocs.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                                      {imageDocs.length > 0 ? 'Other Documents' : 'Documents'}
                                    </h5>
                                    <div className="space-y-2">
                                      {otherDocs.map((doc: any, idx: number) => (
                                        <a
                                          key={doc.id || doc.url || `doc-${idx}`}
                                          href={`${API_BASE_URL.replace('/api', '')}${doc.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-green-300"
                                        >
                                          <DocumentTextIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                          <span className="text-sm text-gray-700 flex-1 truncate" title={doc.originalName || doc.filename}>
                                            {doc.originalName || doc.filename}
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Info label="Name" value={modal.data.name} />
                            <Info label="Status" value={modal.data.status} />
                            <Info label="Email" value={modal.data.email} />
                            <Info label="Phone" value={modal.data.phone} />
                            <Info label="Role" value={modal.data.role} />
                            <Info label="Joined" value={modal.data.joinedAt} />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (modal.type === 'Tenant' || modal.type === 'Employee') ? (
                    <ScoreCardView
                      type={modal.type as 'Tenant' | 'Employee'}
                      id={modal.data.id}
                      name={modal.data.name}
                      onUpdateClick={() => {
                        const type = modal.type as 'Tenant' | 'Employee';
                        handleScoreClick(type, modal.data.id, modal.data.name);
                      }}
                      getScore={getScore}
                      getScoreHistory={getScoreHistory}
                    />
                  ) : null}
                </>
              ) : (modal.type === 'Tenant' || modal.type === 'Employee') ? (
                <EditForm modal={modal as { mode: 'view' | 'edit'; type: 'Tenant' | 'Employee'; data: any }} onClose={() => setModal(null)} />
              ) : null}
            </div>
          </motion.div>
        </div>
      )}

      {/* Score Update Modal */}
      <ScoreModal
        isOpen={isScoreModalOpen}
        onClose={handleScoreClose}
        onSubmit={handleScoreSubmit}
        scoreForm={scoreForm}
        onScoreFormChange={(updates) => setScoreForm({ ...scoreForm, ...updates })}
        currentScoreEntity={currentScoreEntity}
        calculateAverage={calculateAverage}
      />

      {/* Toast Notification */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default PeopleHub;