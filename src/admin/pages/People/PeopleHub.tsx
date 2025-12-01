/**
 * PeopleHub page
 * Sidebar navigation with Tenants, Employees, Vendors, and Prospects sections
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as alertService from '../../services/alert.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import tenantsData from '../../mock/tenants.json';
import employeesData from '../../mock/employees.json';
import ownersData from '../../mock/owners.json';
import * as hostelService from '../../services/hostel.service';
import * as tenantService from '../../services/tenant.service';
import * as ownerService from '../../services/owner.service';
import * as employeeService from '../../services/employee.service';
import * as roleService from '../../services/role.service';
import { API_BASE_URL } from '../../../services/api.config';
import { TenantCard } from './components/TenantCard';
import { EmployeeCard } from './components/EmployeeCard';
import { OwnerCard } from './components/OwnerCard';
import { 
  BriefcaseIcon, 
  HomeIcon,
  UserPlusIcon,
  TrophyIcon,
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

type PeopleSection = 'Tenants' | 'Employees' | 'Owners' | 'Vendors' | 'Prospects';

const PeopleHub: React.FC = () => {
  const location = useLocation();
  
  // Get active section from URL
  const getActiveSection = (): PeopleSection | null => {
    if (location.pathname.includes('/tenants')) return 'Tenants';
    if (location.pathname.includes('/employees')) return 'Employees';
    if (location.pathname.includes('/owners')) return 'Owners';
    if (location.pathname.includes('/vendors')) return 'Vendors';
    if (location.pathname.includes('/prospects')) return 'Prospects';
    return null; // On base route
  };
  
  const activeSection = getActiveSection();
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [hostels, setHostels] = useState<Array<{ id: number; name: string; city: string }>>([]);
  const [hostelsLoading, setHostelsLoading] = useState<boolean>(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState<boolean>(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [ownersLoading, setOwnersLoading] = useState<boolean>(false);
  const [roles, setRoles] = useState<Array<{ value: string; label: string; id: number }>>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<{ mode: 'view' | 'edit'; type: 'Tenant' | 'Employee' | 'Owner'; data: any } | null>(null);
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
  // Multi-step form state for Tenant
  const [currentStep, setCurrentStep] = useState(1);
  const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
  const [tenantFormData, setTenantFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    cnicNumber: '',
    profilePhoto: null as File | null,
    previousProfilePhoto: null as string | null,
    previousDocuments: null as any[] | null,
    // Step 2: Room Allocation
    hostelId: '',
    floorId: '',
    roomId: '',
    bedId: '',
    // Step 3: Lease Information
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    documents: null as File | null,
  });

  // Multi-step form state for Employee
  const [employeeCurrentStep, setEmployeeCurrentStep] = useState(1);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    // Step 1: Personal Information
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    profilePhoto: null as File | null,
    previousProfilePhoto: null as string | null,
    previousDocuments: null as any[] | null,
    address: {
      street: '',
      city: '',
      country: '',
    },
    // Step 2: Employment Details
    roleId: '', // Store role ID instead of role name
    hostelId: '',
    joinDate: '',
    salary: '',
    salaryType: 'monthly',
    workingHours: '',
    document: null as File | null,
    notes: '',
  });

  // Architecture data for selected hostel
  const [availableFloors, setAvailableFloors] = useState<{ value: string; label: string }[]>([]);
  const [availableRooms, setAvailableRooms] = useState<{ value: string; label: string }[]>([]);
  const [availableBeds, setAvailableBeds] = useState<{ value: string; label: string }[]>([]);
  const [floorsLoading, setFloorsLoading] = useState<boolean>(false);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [bedsLoading, setBedsLoading] = useState<boolean>(false);


  // Fetch hostels from API on component mount
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setHostelsLoading(true);
        const hostelsData = await hostelService.getAllHostelsFromAPI();
        setHostels(hostelsData);
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

  // Fetch owners when hostel is selected (only for Owners section)
  useEffect(() => {
    const fetchOwners = async () => {
      if (activeSection === 'Owners' && selectedHostelId) {
        try {
          setOwnersLoading(true);
          const ownersData = await ownerService.getOwnersByHostel(Number(selectedHostelId));
          setOwners(ownersData);
        } catch (error) {
          console.error('Error fetching owners:', error);
          setOwners([]);
        } finally {
          setOwnersLoading(false);
        }
      } else if (activeSection === 'Owners' && !selectedHostelId) {
        // Clear owners when no hostel is selected
        setOwners([]);
      }
    };

    fetchOwners();
  }, [selectedHostelId, activeSection]);

  // Use fetched tenants for Tenants section, otherwise use mock data filtering
  const filteredTenants = useMemo(() => {
    if (activeSection === 'Tenants') {
      return tenants;
    }
    // For other sections, use mock data filtering (if needed)
    let data = tenantsData as any[];
    if (selectedHostelId) {
      data = data.filter((t) => String(t.hostelId) === selectedHostelId);
    }
    return data;
  }, [tenants, selectedHostelId, activeSection]);

  const filteredEmployees = useMemo(() => {
    if (activeSection === 'Employees') {
      return employees;
    }
    // For other sections, use mock data filtering (if needed)
    let data = employeesData as any[];
    if (selectedHostelId) {
      data = data.filter((e) => String(e.hostelId) === selectedHostelId);
    }
    return data;
  }, [employees, selectedHostelId, activeSection]);

  const filteredOwners = useMemo(() => {
    if (activeSection === 'Owners') {
      return owners;
    }
    // For other sections, use mock data filtering (if needed)
    let data = ownersData as any[];
    if (selectedHostelId) {
      data = data.filter((o) => String(o.hostelId) === selectedHostelId);
    }
    return data;
  }, [owners, selectedHostelId, activeSection]);


  // Load floors when hostel is selected
  useEffect(() => {
    const fetchFloors = async () => {
      if (tenantFormData.hostelId) {
        try {
          setFloorsLoading(true);
          const floors = await tenantService.getFloors();
          // Filter floors by hostel if needed, or use all floors
          const floorOptions = floors.map(floor => ({
            value: String(floor.id),
            label: floor.floorName || `Floor ${floor.number}`,
          }));
          setAvailableFloors(floorOptions);
        } catch (error) {
          console.error('Error loading floors:', error);
          setAvailableFloors([]);
        } finally {
          setFloorsLoading(false);
        }
      } else {
        setAvailableFloors([]);
        setAvailableRooms([]);
        setAvailableBeds([]);
      }
    };

    fetchFloors();
  }, [tenantFormData.hostelId]);

  // Update rooms when floor is selected
  useEffect(() => {
    const fetchRooms = async () => {
      if (tenantFormData.floorId) {
        try {
          setRoomsLoading(true);
          const rooms = await tenantService.getRoomsByFloor(Number(tenantFormData.floorId));
          const roomOptions = rooms.map(room => ({
            value: String(room.id),
            label: `Room ${room.roomNumber}`,
          }));
          setAvailableRooms(roomOptions);
        } catch (error) {
          console.error('Error loading rooms:', error);
          setAvailableRooms([]);
        } finally {
          setRoomsLoading(false);
        }
      } else {
        setAvailableRooms([]);
        setAvailableBeds([]);
      }
      setTenantFormData(prev => ({ ...prev, roomId: '', bedId: '' }));
    };

    fetchRooms();
  }, [tenantFormData.floorId]);

  // Update beds when room is selected
  useEffect(() => {
    const fetchBeds = async () => {
      if (tenantFormData.roomId) {
        try {
          setBedsLoading(true);
          const beds = await tenantService.getBedsByRoom(Number(tenantFormData.roomId));
          // Only show unoccupied beds
          const unoccupiedBeds = beds
            .filter(bed => !bed.isOccupied)
            .map(bed => ({
              value: String(bed.id),
              label: `Bed ${bed.bedNumber} (Available)`,
            }));
          setAvailableBeds(unoccupiedBeds);
        } catch (error) {
          console.error('Error loading beds:', error);
          setAvailableBeds([]);
        } finally {
          setBedsLoading(false);
        }
      } else {
        setAvailableBeds([]);
      }
      setTenantFormData(prev => ({ ...prev, bedId: '' }));
    };

    fetchBeds();
  }, [tenantFormData.roomId]);

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
  const handleView = async (id: number, type: 'Tenant' | 'Employee' | 'Owner') => {
    if (type === 'Owner') {
      // Fetch full owner details from API
      try {
        setOwnersLoading(true);
        console.log('Fetching owner details for ID:', id);
        const ownerData = await ownerService.getOwnerById(id);
        console.log('Owner data received:', ownerData);
        if (ownerData) {
          // Map API response to display format
          const mappedData = {
            id: ownerData.id,
            name: ownerData.name,
            email: ownerData.user?.email || '',
            phone: ownerData.user?.phone || ownerData.alternatePhone || null,
            alternatePhone: ownerData.alternatePhone,
            status: ownerData.status,
            profilePhoto: ownerData.profilePhoto,
            ownerCode: ownerData.ownerCode,
            HostelName: ownerData.HostelName,
            taxId: ownerData.taxId,
            registrationNumber: ownerData.registrationNumber,
            address: ownerData.address,
            bankDetails: ownerData.bankDetails,
            documents: ownerData.documents,
            emergencyContact: ownerData.emergencyContact,
            notes: ownerData.notes,
            createdAt: ownerData.createdAt,
            updatedAt: ownerData.updatedAt,
            hostelCount: ownerData.hostelCount || ownerData._count?.hostels || 0,
            userId: ownerData.userId,
            user: ownerData.user,
          };
          console.log('Setting modal with data:', mappedData);
          setModal({ mode: 'view', type, data: mappedData });
          setDetailTab('details');
        } else {
          console.error('No owner data received');
          setToast({
            open: true,
            type: 'error',
            message: 'Owner data not found. Please try again.',
          });
        }
      } catch (error: any) {
        console.error('Error fetching owner details:', error);
        console.error('Error response data:', error?.response?.data);
        console.error('Error status:', error?.response?.status);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load owner details. Please try again.';
        setToast({
          open: true,
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setOwnersLoading(false);
      }
    } else if (type === 'Tenant') {
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
    }
  };

  const handleEdit = async (id: number, type: 'Tenant' | 'Employee') => {
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
          
          // Fetch floors, rooms, and beds if hostel is selected
          if (tenantData.activeAllocation?.hostel?.id) {
            try {
              const floors = await tenantService.getFloors();
              // Filter floors by hostel if hostelId is available
              const filteredFloors = tenantData.activeAllocation.hostel.id 
                ? floors.filter(f => f.hostelId === tenantData.activeAllocation.hostel.id)
                : floors;
              setAvailableFloors(filteredFloors.map(f => ({ value: f.id.toString(), label: f.floorName })));
              
              if (tenantData.activeAllocation?.floor?.id) {
                const rooms = await tenantService.getRoomsByFloor(tenantData.activeAllocation.floor.id);
                setAvailableRooms(rooms.map(r => ({ value: r.id.toString(), label: r.roomNumber })));
                
                if (tenantData.activeAllocation?.room?.id) {
                  const beds = await tenantService.getBedsByRoom(tenantData.activeAllocation.room.id);
                  setAvailableBeds(beds.map(b => ({ value: b.id.toString(), label: b.bedNumber })));
                }
              }
            } catch (error) {
              console.error('Error fetching allocation data:', error);
            }
          }
          
          // Open the add modal in edit mode
          setCurrentStep(1);
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
      // Set editing employee ID and open modal first
      setEditingEmployeeId(id);
      setEmployeeCurrentStep(1);
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
    }
  };

  const handleDelete = async (id: number, type: 'Tenant' | 'Employee', name: string) => {
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
    }
  };

  const handleAddClick = () => {
    if (activeSection === 'Tenants') {
      // Reset tenant form for multi-step wizard
      setEditingTenantId(null);
      setCurrentStep(1);
      setTenantFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        cnicNumber: '',
        profilePhoto: null,
        previousProfilePhoto: null,
        previousDocuments: null,
        hostelId: '',
        floorId: '',
        roomId: '',
        bedId: '',
        leaseStartDate: '',
        leaseEndDate: '',
        monthlyRent: '',
        securityDeposit: '',
        documents: null,
      });
      setAvailableFloors([]);
      setAvailableRooms([]);
      setAvailableBeds([]);
    } else if (activeSection === 'Employees') {
      // Reset employee form for multi-step wizard
      setEditingEmployeeId(null);
      setEmployeeCurrentStep(1);
      setEmployeeFormData({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        profilePhoto: null,
        previousProfilePhoto: null,
        previousDocuments: null,
        address: {
          street: '',
          city: '',
          country: '',
        },
        roleId: '',
        hostelId: '',
        joinDate: '',
        salary: '',
        salaryType: 'monthly',
        workingHours: '',
        document: null,
        notes: '',
      });
    }
    setIsAddModalOpen(true);
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(
        tenantFormData.firstName &&
        tenantFormData.lastName &&
        tenantFormData.email &&
        tenantFormData.phone &&
        tenantFormData.gender &&
        tenantFormData.dateOfBirth &&
        tenantFormData.cnicNumber
      );
    } else if (step === 2) {
      return !!(
        tenantFormData.hostelId &&
        tenantFormData.floorId &&
        tenantFormData.roomId &&
        tenantFormData.bedId
      );
    } else if (step === 3) {
      return !!(
        tenantFormData.leaseStartDate &&
        tenantFormData.leaseEndDate
      );
    }
    return false;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please fill in all required fields before proceeding.',
      });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    const tenantName = `${tenantFormData.firstName} ${tenantFormData.lastName}`;
    const isEditing = editingTenantId !== null;
    
    // Create FormData for file uploads
    const formData = new FormData();
    formData.append('firstName', tenantFormData.firstName);
    formData.append('lastName', tenantFormData.lastName);
    formData.append('email', tenantFormData.email);
    formData.append('phone', tenantFormData.phone);
    formData.append('gender', tenantFormData.gender);
    if (tenantFormData.dateOfBirth) {
      formData.append('dateOfBirth', tenantFormData.dateOfBirth);
    }
    if (tenantFormData.cnicNumber) {
      formData.append('cnicNumber', tenantFormData.cnicNumber);
    }
    if (tenantFormData.hostelId) {
      formData.append('hostelId', tenantFormData.hostelId);
    }
    if (tenantFormData.floorId) {
      formData.append('floorId', tenantFormData.floorId);
    }
    if (tenantFormData.roomId) {
      formData.append('roomId', tenantFormData.roomId);
    }
    if (tenantFormData.bedId) {
      formData.append('bedId', tenantFormData.bedId);
    }
    if (tenantFormData.leaseStartDate) {
      formData.append('leaseStartDate', tenantFormData.leaseStartDate);
    }
    if (tenantFormData.leaseEndDate) {
      formData.append('leaseEndDate', tenantFormData.leaseEndDate);
    }
    formData.append('monthlyRent', tenantFormData.monthlyRent || '0');
    formData.append('securityDeposit', tenantFormData.securityDeposit || '0');
    
    if (tenantFormData.profilePhoto) {
      formData.append('profilePhoto', tenantFormData.profilePhoto);
    }
    
    if (tenantFormData.documents) {
      formData.append('documents', tenantFormData.documents);
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
          const bedNumber = availableBeds.find(b => b.value === tenantFormData.bedId)?.label || 'N/A';
          alertService.createCheckInAlert(
            tenantName,
            `Room ${tenantFormData.roomId}`,
            bedNumber
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
      setCurrentStep(1);
      setTenantFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        cnicNumber: '',
        profilePhoto: null,
        previousProfilePhoto: null,
        previousDocuments: null,
        hostelId: '',
        floorId: '',
        roomId: '',
        bedId: '',
        leaseStartDate: '',
        leaseEndDate: '',
        monthlyRent: '',
        securityDeposit: '',
        documents: null,
      });
      setAvailableFloors([]);
      setAvailableRooms([]);
      setAvailableBeds([]);

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
    }
  };

  const handleEmployeeNextStep = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate step 1 fields before moving to step 2
    if (employeeCurrentStep === 1) {
      if (!employeeFormData.name || !employeeFormData.email || !employeeFormData.phone || !employeeFormData.username || !employeeFormData.password) {
        setToast({
          open: true,
          type: 'warning',
          message: 'Please fill in all required fields (Name, Email, Phone, Username, Password) before proceeding.',
        });
        return;
      }
    }
    
    // Move to next step
    if (employeeCurrentStep < 2) {
      console.log('Moving from step', employeeCurrentStep, 'to step', employeeCurrentStep + 1);
      setEmployeeCurrentStep(employeeCurrentStep + 1);
    }
  };

  const handleEmployeePreviousStep = () => {
    if (employeeCurrentStep > 1) {
      setEmployeeCurrentStep(employeeCurrentStep - 1);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form onSubmit triggered, current step:', employeeCurrentStep);
    
    // Only submit if we're on the final step (step 2)
    if (employeeCurrentStep !== 2) {
      console.log('Not on final step, preventing submission and moving to next step');
      // If not on final step, just move to next step and prevent any submission
      // Don't call handleEmployeeNextStep here to avoid double execution
      if (employeeCurrentStep === 1) {
        // Validate step 1 fields
        if (!employeeFormData.name || !employeeFormData.email || !employeeFormData.phone || !employeeFormData.username || !employeeFormData.password) {
          setToast({
            open: true,
            type: 'warning',
            message: 'Please fill in all required fields (Name, Email, Phone, Username, Password) before proceeding.',
          });
          return;
        }
      }
      setEmployeeCurrentStep(employeeCurrentStep + 1);
      return;
    }
    
    // Final step - submit the form
    console.log('Submitting employee form on step 2');
    
    const employeeName = employeeFormData.name;
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
      formData.append('username', employeeFormData.username);
      formData.append('email', employeeFormData.email);
      formData.append('phone', employeeFormData.phone);
      if (employeeFormData.password) {
        formData.append('password', employeeFormData.password);
      }
      
      // Employee fields
      formData.append('name', employeeFormData.name);
      if (employeeFormData.roleId) {
        formData.append('roleId', employeeFormData.roleId);
      }
      if (employeeFormData.hostelId) {
        formData.append('hostelId', employeeFormData.hostelId);
      }
      if (employeeFormData.joinDate) {
        formData.append('joinDate', employeeFormData.joinDate);
      }
      if (employeeFormData.salary) {
        formData.append('salary', employeeFormData.salary);
      }
      if (employeeFormData.workingHours) {
        formData.append('workingHours', employeeFormData.workingHours);
      }
      if (employeeFormData.notes) {
        formData.append('notes', employeeFormData.notes);
      }
      
      // Address fields
      if (employeeFormData.address.street) {
        formData.append('address[street]', employeeFormData.address.street);
      }
      if (employeeFormData.address.city) {
        formData.append('address[city]', employeeFormData.address.city);
      }
      if (employeeFormData.address.country) {
        formData.append('address[country]', employeeFormData.address.country);
      }
      
      // Files
      if (employeeFormData.profilePhoto) {
        formData.append('profilePhoto', employeeFormData.profilePhoto);
      }
      if (employeeFormData.document) {
        formData.append('documents', employeeFormData.document);
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
        setEmployeeCurrentStep(1);
        setEmployeeFormData({
          name: '',
          email: '',
          phone: '',
          username: '',
          password: '',
          profilePhoto: null,
          previousProfilePhoto: null,
          previousDocuments: null,
          address: {
            street: '',
            city: '',
            country: '',
          },
          roleId: '',
          hostelId: '',
          joinDate: '',
          salary: '',
          salaryType: 'monthly',
          workingHours: '',
          document: null,
          notes: '',
        });
        
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
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleAddClose = () => {
    setIsAddModalOpen(false);
    setEditingTenantId(null);
    setEditingEmployeeId(null);
    setCurrentStep(1);
    setEmployeeCurrentStep(1);
    setTenantFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      cnicNumber: '',
      profilePhoto: null,
      previousProfilePhoto: null,
      previousDocuments: null,
      hostelId: '',
      floorId: '',
      roomId: '',
      bedId: '',
      leaseStartDate: '',
      leaseEndDate: '',
      monthlyRent: '',
      securityDeposit: '',
      documents: null,
    });
    setEmployeeFormData({
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      profilePhoto: null,
      previousProfilePhoto: null,
      previousDocuments: null,
      address: {
        street: '',
        city: '',
        country: '',
      },
      roleId: '',
      hostelId: '',
      joinDate: '',
      salary: '',
      salaryType: 'monthly',
      workingHours: '',
      document: null,
      notes: '',
    });
    setAvailableFloors([]);
    setAvailableRooms([]);
    setAvailableBeds([]);
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
                <h1 className="text-3xl font-bold text-slate-900">{activeSection}</h1>
                <p className="text-slate-600 mt-1">
              {activeSection === 'Tenants' && 'Manage tenant information and room allocations.'}
              {activeSection === 'Employees' && 'Manage employee information and roles.'}
              {activeSection === 'Owners' && 'Manage property owners and their properties.'}
              {activeSection === 'Vendors' && 'Manage vendor information and services.'}
              {activeSection === 'Prospects' && 'Manage potential tenants and applications.'}
            </p>
              </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-full sm:w-80">
              <Select
                value={selectedHostelId}
                onChange={setSelectedHostelId}
                options={hostelOptions}
                disabled={hostelsLoading}
              />
            </div>
            {(activeSection === 'Tenants' || activeSection === 'Employees') && (
              <Button
                variant="primary"
                onClick={handleAddClick}
                icon={UserPlusIcon}
              >
                {activeSection === 'Tenants' ? 'Add Tenant' : 'Add Employee'}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="glass rounded-2xl border border-white/20 shadow-xl p-6">
          {!selectedHostelId ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredTenants as any[]).map((t, idx) => (
                  <TenantCard
                    key={t.id}
                    tenant={t}
                    index={idx}
                    onView={(id) => handleView(id, 'Tenant')}
                    onEdit={(id) => handleEdit(id, 'Tenant')}
                    onDelete={(id, name) => handleDelete(id, 'Tenant', name)}
                  />
                ))}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredEmployees as any[]).map((e, idx) => (
                  <EmployeeCard
                    key={e.id}
                    employee={e}
                    index={idx}
                    onView={(id) => handleView(id, 'Employee')}
                    onEdit={(id) => handleEdit(id, 'Employee')}
                    onDelete={(id, name) => handleDelete(id, 'Employee', name)}
                  />
                ))}
              </div>
            )
          ) : activeSection === 'Owners' ? (
            ownersLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading owners...</p>
              </div>
            ) : filteredOwners.length === 0 ? (
              <div className="text-center py-16">
                <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Owners Found</h3>
                <p className="text-gray-600 mb-6">No owners found for the selected hostel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredOwners as any[]).map((o, idx) => (
                  <OwnerCard
                    key={o.id}
                    owner={o}
                    index={idx}
                    onView={(id) => handleView(id, 'Owner')}
                  />
                ))}
              </div>
            )
          ) : activeSection === 'Vendors' ? (
            <div className="text-center py-16">
              <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vendors</h3>
              <p className="text-gray-600">Vendor management coming soon.</p>
            </div>
          ) : activeSection === 'Prospects' ? (
            <div className="text-center py-16">
              <UserPlusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Prospects</h3>
              <p className="text-gray-600">Prospect management coming soon.</p>
            </div>
          ) : null}
          </div>
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
                                            key={idx}
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
                                          key={idx}
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
                      ) : modal.type === 'Owner' ? (
                        <>
                          {/* Profile Photo */}
                          <div className="flex justify-center mb-6">
                            {modal.data.profilePhoto ? (
                              <img 
                                src={`${API_BASE_URL.replace('/api', '')}${modal.data.profilePhoto}`} 
                                alt={modal.data.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-2xl';
                                    fallback.textContent = modal.data.name.charAt(0).toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-2xl">
                                {modal.data.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Info label="Name" value={modal.data.name} />
                            <Info label="Status" value={modal.data.status} />
                            <Info label="Email" value={modal.data.email || 'N/A'} />
                            <Info label="Phone" value={modal.data.phone || 'N/A'} />
                            {modal.data.alternatePhone && <Info label="Alternate Phone" value={modal.data.alternatePhone} />}
                            {modal.data.ownerCode && <Info label="Owner Code" value={modal.data.ownerCode} />}
                            {modal.data.HostelName && <Info label="Hostel Name" value={modal.data.HostelName} />}
                            {modal.data.taxId && <Info label="Tax ID" value={modal.data.taxId} />}
                            {modal.data.registrationNumber && <Info label="Registration Number" value={modal.data.registrationNumber} />}
                            {modal.data.address && (
                              <>
                                {modal.data.address.city && <Info label="City" value={modal.data.address.city} />}
                                {modal.data.address.state && <Info label="State" value={modal.data.address.state} />}
                              </>
                            )}
                            {modal.data.hostelCount !== undefined && <Info label="Total Hostels" value={modal.data.hostelCount.toString()} />}
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
                                            key={idx}
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
                                          key={idx}
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
                                            key={idx}
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
                                          key={idx}
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

      {/* Add Tenant/Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleAddClose}
        title={activeSection === 'Tenants' 
          ? (editingTenantId ? `Edit Tenant - Step ${currentStep} of 3` : `Add New Tenant - Step ${currentStep} of 3`) 
          : (editingEmployeeId ? `Edit Employee - Step ${employeeCurrentStep} of 2` : `Add New Employee - Step ${employeeCurrentStep} of 2`)}
        size="lg"
      >
        {activeSection === 'Tenants' ? (
          <form onSubmit={handleTenantSubmit} className="space-y-6">
            {/* Step Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          currentStep >= step
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {currentStep > step ? '✓' : step}
                      </div>
                      <div className="ml-2 hidden sm:block">
                        <p className={`text-xs font-medium ${
                          currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step === 1 ? 'Personal' : step === 2 ? 'Room' : 'Lease'}
                        </p>
                      </div>
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Personal Information */}
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tenantFormData.firstName}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, firstName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tenantFormData.lastName}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, lastName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={tenantFormData.email}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={tenantFormData.phone}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={tenantFormData.gender}
                        onChange={(value) => setTenantFormData({ ...tenantFormData, gender: value })}
                        options={[
                          { value: '', label: 'Select Gender' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' },
                        ]}
                        placeholder="Select Gender"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tenantFormData.dateOfBirth}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNIC Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tenantFormData.cnicNumber}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, cnicNumber: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="12345-1234567-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setTenantFormData({ ...tenantFormData, profilePhoto: file });
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                      {tenantFormData.profilePhoto && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {tenantFormData.profilePhoto.name}
                        </p>
                      )}
                      {editingTenantId && tenantFormData.previousProfilePhoto && !tenantFormData.profilePhoto && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Current Profile Photo:</p>
                          <img
                            src={`${API_BASE_URL.replace('/api', '')}${tenantFormData.previousProfilePhoto}`}
                            alt="Current profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Room Allocation */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Allocation Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hostel <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={tenantFormData.hostelId}
                        onChange={(value) => {
                          setTenantFormData({
                            ...tenantFormData,
                            hostelId: value,
                            floorId: '',
                            roomId: '',
                            bedId: '',
                          });
                        }}
                        options={hostelOptions.filter(opt => opt.value !== '')}
                        placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
                        disabled={hostelsLoading}
                      />
                    </div>
                    {tenantFormData.hostelId && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Floor <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={tenantFormData.floorId}
                            onChange={(value) => {
                              setTenantFormData({
                                ...tenantFormData,
                                floorId: value,
                                roomId: '',
                                bedId: '',
                              });
                            }}
                            options={availableFloors}
                            placeholder={floorsLoading ? "Loading floors..." : "Select Floor"}
                            disabled={floorsLoading}
                          />
                        </div>
                        {tenantFormData.floorId && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Room <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={tenantFormData.roomId}
                              onChange={(value) => {
                                setTenantFormData({
                                  ...tenantFormData,
                                  roomId: value,
                                  bedId: '',
                                });
                              }}
                              options={availableRooms}
                              placeholder={roomsLoading ? "Loading rooms..." : "Select Room"}
                              disabled={roomsLoading}
                            />
                          </div>
                        )}
                        {tenantFormData.roomId && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bed <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={tenantFormData.bedId}
                              onChange={(value) => {
                                setTenantFormData({
                                  ...tenantFormData,
                                  bedId: value,
                                });
                              }}
                              options={availableBeds}
                              placeholder={bedsLoading ? "Loading beds..." : "Select Available Bed"}
                              disabled={bedsLoading}
                            />
                            {!bedsLoading && availableBeds.length === 0 && (
                              <p className="text-sm text-red-600 mt-2">No available beds in this room.</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Lease Information */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lease Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tenantFormData.leaseStartDate}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, leaseStartDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lease End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tenantFormData.leaseEndDate}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, leaseEndDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent
                      </label>
                      <input
                        type="number"
                        value={tenantFormData.monthlyRent}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, monthlyRent: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="20000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Security Deposit
                      </label>
                      <input
                        type="number"
                        value={tenantFormData.securityDeposit}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, securityDeposit: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="1000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Documents
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setTenantFormData({ ...tenantFormData, documents: file });
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                      {tenantFormData.documents && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {tenantFormData.documents.name}
                        </p>
                      )}
                      {editingTenantId && tenantFormData.previousDocuments && tenantFormData.previousDocuments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">Current Documents:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {tenantFormData.previousDocuments.map((doc: any, idx: number) => {
                              const isImage = doc.mimetype?.startsWith('image/') || 
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '');
                              const docUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                              const docName = doc.originalName || doc.filename || 'Document';
                              
                              return (
                                <div
                                  key={idx}
                                  className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                                >
                                  {isImage ? (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                        <img
                                          src={docUrl}
                                          alt={docName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              parent.innerHTML = `
                                                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                  </svg>
                                                </div>
                                              `;
                                            }
                                          }}
                                        />
                                      </div>
                                      <div className="p-2 bg-white border-t border-gray-200">
                                        <p className="text-xs text-gray-700 font-medium truncate" title={docName}>
                                          {docName}
                                        </p>
                                      </div>
                                    </a>
                                  ) : (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-3"
                                    >
                                      <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                      <span className="text-xs text-gray-700 truncate" title={docName}>
                                        {docName}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? handleAddClose : handlePreviousStep}
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </Button>
              <div className="flex gap-2">
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextStep}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    icon={UserPlusIcon}
                  >
                    {editingTenantId ? 'Update Tenant' : 'Add Tenant'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        ) : (
          <form 
            onSubmit={handleEmployeeSubmit} 
            onKeyDown={(e) => {
              // Prevent form submission on Enter key if not on final step
              if (e.key === 'Enter') {
                if (employeeCurrentStep < 2) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Enter key pressed on step 1, preventing submission');
                  handleEmployeeNextStep();
                }
                // On step 2, allow Enter to submit (default behavior)
              }
            }}
            className="space-y-6"
          >
            {/* Step Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          employeeCurrentStep >= step
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {employeeCurrentStep > step ? '✓' : step}
                      </div>
                      <div className="ml-2 hidden sm:block">
                        <p className={`text-xs font-medium ${
                          employeeCurrentStep >= step ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step === 1 ? 'Personal' : 'Employment'}
                        </p>
                      </div>
                    </div>
                    {step < 2 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          employeeCurrentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Personal Information */}
            <AnimatePresence mode="wait">
              {employeeCurrentStep === 1 && (
                <motion.div
                  key="employee-step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.name}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (employeeCurrentStep < 2) {
                              handleEmployeeNextStep();
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={employeeFormData.email}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (employeeCurrentStep < 2) {
                              handleEmployeeNextStep();
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={employeeFormData.phone}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (employeeCurrentStep < 2) {
                              handleEmployeeNextStep();
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.username}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="johndoe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={employeeFormData.password}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEmployeeFormData({ ...employeeFormData, profilePhoto: file });
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                      {employeeFormData.profilePhoto && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {employeeFormData.profilePhoto.name}
                        </p>
                      )}
                      {editingEmployeeId && employeeFormData.previousProfilePhoto && !employeeFormData.profilePhoto && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Current Profile Photo:</p>
                          <img
                            src={`${API_BASE_URL.replace('/api', '')}${employeeFormData.previousProfilePhoto}`}
                            alt="Current profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.address.street}
                        onChange={(e) => setEmployeeFormData({ 
                          ...employeeFormData, 
                          address: { ...employeeFormData.address, street: e.target.value }
                        })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.address.city}
                        onChange={(e) => setEmployeeFormData({ 
                          ...employeeFormData, 
                          address: { ...employeeFormData.address, city: e.target.value }
                        })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.address.country}
                        onChange={(e) => setEmployeeFormData({ 
                          ...employeeFormData, 
                          address: { ...employeeFormData.address, country: e.target.value }
                        })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Employment Details */}
              {employeeCurrentStep === 2 && (
                <motion.div
                  key="employee-step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role/Position <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={employeeFormData.roleId}
                        onChange={(value) => setEmployeeFormData({ ...employeeFormData, roleId: value })}
                        options={[
                          { value: '', label: rolesLoading ? 'Loading roles...' : 'Select Role' },
                          ...roles,
                        ]}
                        placeholder={rolesLoading ? "Loading roles..." : "Select Role"}
                        disabled={rolesLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hostel <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={employeeFormData.hostelId}
                        onChange={(value) => setEmployeeFormData({ ...employeeFormData, hostelId: value })}
                        options={hostelOptions.filter(opt => opt.value !== '')}
                        placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
                        disabled={hostelsLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Join Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={employeeFormData.joinDate}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, joinDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Working Hours
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.workingHours}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, workingHours: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="9:00 AM - 5:00 PM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salary
                      </label>
                      <input
                        type="number"
                        value={employeeFormData.salary}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="3000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEmployeeFormData({ ...employeeFormData, document: file });
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                      />
                      {employeeFormData.document && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {employeeFormData.document.name}
                        </p>
                      )}
                      {editingEmployeeId && employeeFormData.previousDocuments && employeeFormData.previousDocuments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">Current Documents:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {employeeFormData.previousDocuments.map((doc: any, idx: number) => {
                              const isImage = doc.mimetype?.startsWith('image/') || 
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '');
                              const docUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                              const docName = doc.originalName || doc.filename || 'Document';
                              
                              return (
                                <div
                                  key={idx}
                                  className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                                >
                                  {isImage ? (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                        <img
                                          src={docUrl}
                                          alt={docName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              parent.innerHTML = `
                                                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                  </svg>
                                                </div>
                                              `;
                                            }
                                          }}
                                        />
                                      </div>
                                      <div className="p-2 bg-white border-t border-gray-200">
                                        <p className="text-xs text-gray-700 font-medium truncate" title={docName}>
                                          {docName}
                                        </p>
                                      </div>
                                    </a>
                                  ) : (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-3"
                                    >
                                      <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                      <span className="text-xs text-gray-700 truncate" title={docName}>
                                        {docName}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={employeeFormData.notes}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, notes: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
                        placeholder="Add any additional notes or comments..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={employeeCurrentStep === 1 ? handleAddClose : handleEmployeePreviousStep}
              >
                {employeeCurrentStep === 1 ? 'Cancel' : 'Previous'}
              </Button>
              <div className="flex gap-2">
                {employeeCurrentStep < 2 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Next button clicked, current step:', employeeCurrentStep);
                      handleEmployeeNextStep(e);
                    }}
                    className="px-6 py-2.5 bg-[#2176FF] text-white font-semibold rounded-lg hover:bg-[#1966E6] active:bg-[#1555CC] shadow-sm transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    icon={UserPlusIcon}
                  >
                    {editingEmployeeId ? 'Update Employee' : 'Add Employee'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Score Update Modal */}
      <Modal
        isOpen={isScoreModalOpen}
        onClose={handleScoreClose}
        title={`${currentScoreEntity ? `Update Score - ${currentScoreEntity.name}` : 'Update Score'}`}
        size="lg"
      >
        <form onSubmit={handleScoreSubmit} className="space-y-6">
          {/* Behavior */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Behavior <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scoreForm.behavior}
                onChange={(e) => setScoreForm({ ...scoreForm, behavior: Number(e.target.value) })}
                className="flex-1"
                required
              />
              <div className="flex items-center gap-1 min-w-[100px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-6 h-6 ${
                      star <= scoreForm.behavior
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold text-gray-700">{scoreForm.behavior}/5</span>
              </div>
            </div>
          </div>

          {/* Punctuality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Punctuality <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scoreForm.punctuality}
                onChange={(e) => setScoreForm({ ...scoreForm, punctuality: Number(e.target.value) })}
                className="flex-1"
                required
              />
              <div className="flex items-center gap-1 min-w-[100px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-6 h-6 ${
                      star <= scoreForm.punctuality
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold text-gray-700">{scoreForm.punctuality}/5</span>
              </div>
            </div>
          </div>

          {/* Cleanliness / Task Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentScoreEntity?.type === 'Tenant' ? 'Cleanliness' : 'Task Quality'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scoreForm.cleanliness}
                onChange={(e) => setScoreForm({ ...scoreForm, cleanliness: Number(e.target.value) })}
                className="flex-1"
                required
              />
              <div className="flex items-center gap-1 min-w-[100px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-6 h-6 ${
                      star <= scoreForm.cleanliness
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold text-gray-700">{scoreForm.cleanliness}/5</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              value={scoreForm.remarks}
              onChange={(e) => setScoreForm({ ...scoreForm, remarks: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-transparent"
              placeholder="Add any additional notes or comments..."
            />
          </div>

          {/* Live Average Score */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Score:</span>
              <div className="flex items-center gap-2">
                <StarIcon className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-gray-900">{calculateAverage()}</span>
                <span className="text-gray-600">/ 5</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleScoreClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={TrophyIcon}>
              Save Score
            </Button>
          </div>
        </form>
      </Modal>

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


// Small info row component
const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-50 rounded-lg p-3">
    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
    <p className="text-slate-900 font-medium break-words">{value || '-'}</p>
  </div>
);

// Edit form component for both Tenant and Employee
const EditForm = ({ modal, onClose }: { modal: { mode: 'view' | 'edit'; type: 'Tenant' | 'Employee'; data: any }; onClose: () => void }) => {
  const [form, setForm] = useState<any>({ ...modal.data });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If tenant status changed, create appropriate alert
    if (modal.type === 'Tenant' && modal.data.status !== form.status) {
      const tenantName = form.name || modal.data.name;
      const room = form.room || modal.data.room;
      const seat = form.bed || modal.data.bed;
      
      try {
        if (form.status === 'Active' && modal.data.status !== 'Active') {
          // Check-in: Status changed to Active
          alertService.createCheckInAlert(tenantName, room, seat);
        } else if (form.status === 'Inactive' && modal.data.status === 'Active') {
          // Check-out: Status changed from Active to Inactive
          alertService.createCheckOutAlert(tenantName, room, seat);
        }
      } catch (error) {
        console.error('Failed to create alert:', error);
      }
    }
    
    console.log('Update', modal.type, form);
    onClose();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" required />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        {modal.type === 'Employee' ? (
          <>
            <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
            <Field label="Joined" value={form.joinedAt} onChange={(v) => setForm({ ...form, joinedAt: v })} type="date" />
          </>
        ) : (
          <>
            <Field label="Room" value={form.room} onChange={(v) => setForm({ ...form, room: v })} />
            <Field label="Bed" value={form.bed} onChange={(v) => setForm({ ...form, bed: v })} />
            <Field label="Lease Start" value={form.leaseStart} onChange={(v) => setForm({ ...form, leaseStart: v })} type="date" />
            <Field label="Lease End" value={form.leaseEnd} onChange={(v) => setForm({ ...form, leaseEnd: v })} type="date" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={form.status || 'Pending'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md hover:shadow-lg">Save Changes</button>
      </div>
    </form>
  );
};

const Field = ({ label, value, onChange, type = 'text', required = false }: { label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}{required ? ' *' : ''}</label>
    <input
      type={type}
      value={value || ''}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    />
  </div>
);

// Score Card View Component
interface ScoreCardViewProps {
  type: 'Tenant' | 'Employee';
  id: number;
  name: string;
  onUpdateClick: () => void;
  getScore: (type: 'Tenant' | 'Employee', id: number) => any;
  getScoreHistory: (type: 'Tenant' | 'Employee', id: number) => any[];
}

const ScoreCardView: React.FC<ScoreCardViewProps> = ({
  type,
  id,
  name,
  onUpdateClick,
  getScore,
  getScoreHistory,
}) => {
  const currentScore = getScore(type, id);
  const scoreHistory = getScoreHistory(type, id);

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    if (score >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Below Average';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Current Score Display */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Current Performance Score</h3>
            <p className="text-sm text-gray-600">{name}</p>
          </div>
          <Button variant="primary" onClick={onUpdateClick} icon={TrophyIcon}>
            Add / Update Score
          </Button>
        </div>

        {currentScore ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(currentScore.average)}`}>
                  {currentScore.average.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">/ 5.0</div>
                <div className={`text-sm font-medium mt-2 ${getScoreColor(currentScore.average)}`}>
                  {getScoreLabel(currentScore.average)}
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Behavior</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-4 h-4 ${
                            star <= currentScore.behavior
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {currentScore.behavior}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Punctuality</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-4 h-4 ${
                            star <= currentScore.punctuality
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {currentScore.punctuality}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {type === 'Tenant' ? 'Cleanliness' : 'Task Quality'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-4 h-4 ${
                            star <= currentScore.cleanliness
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {currentScore.cleanliness}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {currentScore.remarks && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Remarks:</span> {currentScore.remarks}
                </p>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(currentScore.date).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No score recorded yet.</p>
            <Button variant="primary" onClick={onUpdateClick} icon={TrophyIcon}>
              Add Score
            </Button>
          </div>
        )}
      </div>

      {/* Score History */}
      {scoreHistory.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Score History</h4>
          <div className="space-y-3">
            {scoreHistory.map((record: any, index: number) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className={`text-lg font-bold ${getScoreColor(record.average)}`}>
                      {record.average.toFixed(1)}/5
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2">
                  <div>Behavior: {record.behavior}/5</div>
                  <div>Punctuality: {record.punctuality}/5</div>
                  <div>
                    {type === 'Tenant' ? 'Cleanliness' : 'Quality'}: {record.cleanliness}/5
                  </div>
                </div>
                {record.remarks && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{record.remarks}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



