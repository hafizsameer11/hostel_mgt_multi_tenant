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
  HOSTEL: '/admin/hostel',
  HOSTEL_CREATE: '/admin/hostel/create',
  HOSTEL_VIEW: (id: string | number) => `/admin/hostel/${id}`,
  HOSTEL_EDIT: (id: string | number) => `/admin/hostel/${id}/edit`,
  ALERTS: '/admin/alerts',
  VENDOR: '/admin/vendor',
  COMM: '/admin/communication',
  FPA: '/admin/fpa',
  SETTINGS: '/admin/settings',
} as const;

export default ROUTES;

