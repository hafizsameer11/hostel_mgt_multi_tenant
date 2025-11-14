const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByUserId,
  updateEmployee,
  updateEmployeeSalary,
  updateEmployeeStatus,
  deleteEmployee,
  getEmployeeStatistics,
} = require('../../../controllers/api/employee.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// =================== EMPLOYEE ROUTES ===================

// All routes require authentication and admin/manager access
// Apply middleware to all routes
router.use(authenticate);
router.use(authorize('admin', 'manager'));

/**
 * @route   POST /api/admin/employees
 * @desc    Create new employee
 * @access  Admin, Manager
 * @body    { name, email, phone, password, role, employeeCode, department, designation, salary, salaryType, joinDate, ... }
 */
router.post('/employee', authenticate, authorize('admin'), createEmployee);

/**
 * @route   GET /api/admin/employees
 * @desc    Get all employees with filters and pagination
 * @access  Admin, Manager
 * @query   status, role, department, hostelAssigned, search, page, limit
 */
router.get('/employees', getAllEmployees);

/**
 * @route   GET /api/admin/employees/statistics
 * @desc    Get employee statistics
 * @access  Admin, Manager
 */
router.get('/employees/statistics', getEmployeeStatistics);

/**
 * @route   GET /api/admin/employees/:id
 * @desc    Get employee by ID
 * @access  Admin, Manager
 * @params  id - Employee ID
 */
router.get('/employee/:id', getEmployeeById);

/**
 * @route   GET /api/admin/employees/user/:userId
 * @desc    Get employee by User ID
 * @access  Admin, Manager
 * @params  userId - User ID
 */
router.get('/employees/user/:userId', getEmployeeByUserId);

/**
 * @route   PUT /api/admin/employees/:id
 * @desc    Update employee details
 * @access  Admin, Manager
 * @params  id - Employee ID
 * @body    { name, email, phone, role, department, designation, salary, ... }
 */
router.put('/employee/:id', updateEmployee);

/**
 * @route   PATCH /api/admin/employees/:id/salary
 * @desc    Update employee salary
 * @access  Admin
 * @params  id - Employee ID
 * @body    { salary, salaryType, effectiveDate, notes }
 */
router.patch(
  '/employees/:id/salary',
  authorize('admin'), // Only admin can update salary
  updateEmployeeSalary,
);

/**
 * @route   PATCH /api/admin/employees/:id/status
 * @desc    Update employee status (active, inactive, on_leave, terminated)
 * @access  Admin, Manager
 * @params  id - Employee ID
 * @body    { status, terminationDate, notes }
 */
router.patch('/employee/:id/status', updateEmployeeStatus);

/**
 * @route   DELETE /api/admin/employees/:id
 * @desc    Delete employee (and associated user)
 * @access  Admin
 * @params  id - Employee ID
 */
router.delete(
  '/employee/:id',
  authorize('admin'), // Only admin can delete
  deleteEmployee,
);

module.exports = router;

