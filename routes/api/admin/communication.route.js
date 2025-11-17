const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../middleware/auth.middleware');
const {
  sendEmailCampaign,
  tenantContacts,
  tenantContactDetails,
  employeeContacts,
  employeeContactDetails,
  vendorContacts,
  vendorContactDetails,
} = require('../../../controllers/api/communication.controller');

// All routes require authentication and admin/manager/staff role
router.use(authenticate);
router.use(authorize('admin', 'manager', 'staff'));

/**
 * =====================================================
 * COMMUNICATION ROUTES - Contact Directory
 * =====================================================
 * 
 * Base path: /api/admin/communication
 */

/**
 * Get Tenant Contacts List
 * GET /api/admin/communication/tenants
 * 
 * Query Parameters:
 * - status (optional): Filter by tenant status - 'active' | 'inactive' | 'blacklisted'
 * - hostelId (optional): Filter by hostel ID
 * - search (optional): Search by name, email, or phone
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 12, max: 100)
 * 
 * Returns: List of tenant contacts with pagination
 */
router.get('/communication/tenants', tenantContacts);

/**
 * Get Tenant Contact Details
 * GET /api/admin/communication/tenants/:id
 * 
 * URL Parameters:
 * - id: Tenant ID
 * 
 * Returns: Detailed tenant contact information including profile, payments, and lease details
 */
router.get('/communication/tenants/:id', tenantContactDetails);

/**
 * Get Employee Contacts List
 * GET /api/admin/communication/employees
 * 
 * Query Parameters:
 * - status (optional): Filter by employee status - 'active' | 'inactive' | 'on_leave' | 'terminated'
 * - department (optional): Filter by department
 * - search (optional): Search by name, email, phone, role, or designation
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 12, max: 100)
 * 
 * Returns: List of employee contacts with pagination
 */
router.get('/communication/employees', employeeContacts);

/**
 * Get Employee Contact Details
 * GET /api/admin/communication/employees/:id
 * 
 * URL Parameters:
 * - id: Employee ID
 * 
 * Returns: Detailed employee contact information including profile, score/rating, and employment details
 */
router.get('/communication/employees/:id', employeeContactDetails);

/**
 * Get Vendor Contacts List
 * GET /api/admin/communication/vendors
 * 
 * Query Parameters:
 * - status (optional): Filter by vendor status - 'active' | 'inactive' | 'blacklisted'
 * - search (optional): Search by name, companyName, email, phone, or category
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 12, max: 100)
 * 
 * Returns: List of vendor contacts with pagination, ratings, and service information
 */
router.get('/communication/vendors', vendorContacts);

/**
 * Get Vendor Contact Details
 * GET /api/admin/communication/vendors/:id
 * 
 * URL Parameters:
 * - id: Vendor ID
 * 
 * Returns: Detailed vendor contact information including profile, score/rating, and financial details
 */
router.get('/communication/vendors/:id', vendorContactDetails);

/**
 * Send Email Campaign
 * POST /api/admin/communication/email
 * 
 * Body:
 * - audience: 'tenants' | 'employees' | 'vendors' (REQUIRED)
 * - subject: string (REQUIRED)
 * - message: string (REQUIRED)
 * - ids?: []  Optional → Send to selected IDs only
 */
router.post('/communication/email', sendEmailCampaign);


module.exports = router;

