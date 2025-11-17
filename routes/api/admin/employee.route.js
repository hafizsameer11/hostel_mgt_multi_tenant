// ===============================
// Employee Routes (Admin)
// ===============================

const express = require('express');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

// ===============================
// ✅ MULTER CONFIG (profile + multiple documents)
// ===============================
const uploadsDir = path.join(__dirname, '../../../uploads/employees');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, base + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
      'application/pdf', 'image/heic'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF'));
  }
});

// ===============================
// ✅ ROUTES (All protected)
// ===============================

// Create new employee (allow profilePhoto + multiple documents)
router.post(
  '/employee',
  authenticate,
  authorize('admin'),
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  createEmployee
);

// Get all employees (paginated + filter)
router.get('/employees', authenticate, authorize('admin', 'manager'), getAllEmployees);

// Get employee statistics
router.get('/employees/statistics', authenticate, authorize('admin', 'manager'), getEmployeeStatistics);

// Get employee by User ID
router.get('/employees/user/:userId', authenticate, authorize('admin', 'manager'), getEmployeeByUserId);

// Get employee by ID
router.get('/employee/:id', authenticate, authorize('admin', 'manager'), getEmployeeById);

// Update employee (profile + documents)
router.put(
  '/employee/:id',
  authenticate,
  authorize('admin', 'manager'),
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  updateEmployee
);

// Update employee salary
router.patch(
  '/employees/:id/salary',
  authenticate,
  authorize('admin'), // Only admin can update salary
  updateEmployeeSalary,
);

// Update employee status (active, inactive, on_leave, terminated)
router.patch(
  '/employee/:id/status',
  authenticate,
  authorize('admin', 'manager'),
  updateEmployeeStatus
);

// Delete employee
router.delete(
  '/employee/:id',
  authenticate,
  authorize('admin'), // Only admin can delete
  deleteEmployee,
);

module.exports = router;

