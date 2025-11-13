/**
 * Route path constants
 * Centralized route definitions to avoid magic strings
 */

export const ROUTES = {
  ROOT: '/admin',
  OVERVIEW: '/admin/overview',
  PEOPLE: '/admin/people',
  TENANTS: '/admin/people/tenants',
  EMPLOYEES: '/admin/people/employees',
  OWNERS: '/admin/people/owners',
  VENDORS: '/admin/people/vendors',
  PROSPECTS: '/admin/people/prospects',
  ACCOUNTS: '/admin/accounts',
  ACCOUNTS_PAYABLE: '/admin/accounts/payable',
  ACCOUNTS_PAYABLE_ALL: '/admin/accounts/payable/all',
  ACCOUNTS_PAYABLE_BILLS: '/admin/accounts/payable/bills',
  ACCOUNTS_PAYABLE_VENDOR: '/admin/accounts/payable/vendor',
  ACCOUNTS_PAYABLE_LAUNDRY: '/admin/accounts/payable/laundry',
  ACCOUNTS_RECEIVABLE: '/admin/accounts/receivable',
  ACCOUNTS_RECEIVABLE_ALL: '/admin/accounts/receivable/all',
  ACCOUNTS_RECEIVABLE_RECEIVED: '/admin/accounts/receivable/received',
  HOSTEL: '/admin/hostel',
  HOSTEL_CREATE: '/admin/hostel/create',
  HOSTEL_VIEW: (id: string | number) => `/admin/hostel/${id}`,
  HOSTEL_EDIT: (id: string | number) => `/admin/hostel/${id}/edit`,
  ALERTS: '/admin/alerts',
  VENDOR: '/admin/vendor',
  VENDOR_LIST: '/admin/vendor/list',
  VENDOR_MANAGEMENT: '/admin/vendor/management',
  COMM: '/admin/communication',
  COMM_TENANTS: '/admin/communication/tenants',
  COMM_EMPLOYEES: '/admin/communication/employees',
  COMM_VENDORS: '/admin/communication/vendors',
  FPA: '/admin/fpa',
  SETTINGS: '/admin/settings',
} as const;

export default ROUTES;

