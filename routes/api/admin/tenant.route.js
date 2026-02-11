// ===============================
// Tenant Routes (Admin)
// ===============================

const express = require('express');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const {
    createTenant,
    getAllTenants,
    getTenantById,
    updateTenant,
    deleteTenant,
    getTenantPaymentHistory,
    getTenantFinancialSummary,
    getActiveTenants,
    listTenants,
    tenantDetails,
    getTenantCurrentScore,
    getTenantScoreHistory,
    upsertTenantScore,
    getTenantsByHostelId,
    getProspects,
    getProspectsByHostel
} = require('../../../controllers/api/tenant.controller');

const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');

// ===============================
// ✅ MULTER CONFIG (profile + multiple documents)
// ===============================
const uploadsDir = path.join(__dirname, '../../../uploads/tenants');

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
      'application/pdf', 'image/heic', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX'));
  }
});

// More flexible upload that accepts any file fields
const uploadAny = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
      'application/pdf', 'image/heic', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX'));
  }
});

// ===============================
// ✅ ROUTES (All protected)
// ===============================

// Create new tenant (allow profilePhoto + multiple documents)
// Using uploadAny to accept any file fields dynamically
// Allow owner to create tenants for their hostels
router.post(
  '/tenant',
  authenticate,
  authorizeAdminOrOwner(),
  uploadAny.any(),
  createTenant
);

// Create new prospect (same as tenant, but without allocation)
// Prospects are tenants without allocations - use same createTenant function
// Allow owner to create prospects for their hostels
router.post(
  '/prospects',
  authenticate,
  authorizeAdminOrOwner(),
  uploadAny.any(),
  createTenant
);

// Get all tenants (paginated + filter)
// Admin sees all, owner sees only their hostels, employees see based on role
router.get('/tenant', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getAllTenants
);

// List tenants (alternative endpoint)
router.get('/tenants', 
  authenticate, 
  authorizeAdminOrOwner(), 
  listTenants
);

// Get active tenants
router.get('/tenants/active', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getActiveTenants
);

// Get tenants by hostel ID
router.get('/tenants/hostel/:hostelId', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getTenantsByHostelId
);

// Get prospects (tenants without allocations)
router.get('/prospects', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getProspects
);

// Get prospects by hostel ID
router.get('/prospects/hostel/:hostelId', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getProspectsByHostel
);

// Get tenant payment history
router.get('/tenant/:id/payments', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getTenantPaymentHistory
);

// Get tenant financial summary
router.get('/tenant/:id/financial-summary', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getTenantFinancialSummary
);

// Get tenant current score
router.get('/tenant/:id/score', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getTenantCurrentScore
);

// Get tenant score history
router.get('/tenant/:id/score/history', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getTenantScoreHistory
);

// Get tenant details (alternative endpoint)
router.get('/tenant/:id/details', 
  authenticate, 
  authorizeAdminOrOwner(), 
  tenantDetails
);

// Get tenant by ID
router.get('/tenant/:id', 
  authenticate, 
  authorizeAdminOrOwner(), 
  getTenantById
);

// Update tenant (profile + documents)
// Using uploadAny to accept any file fields dynamically
// Allow owner to update tenants for their hostels
router.put(
  '/tenant/:id',
  authenticate,
  authorizeAdminOrOwner(),
  uploadAny.any(),
  updateTenant
);

// Update prospect (same as tenant update)
// Allow owner to update prospects for their hostels
router.put(
  '/prospects/:id',
  authenticate,
  authorizeAdminOrOwner(),
  uploadAny.any(),
  updateTenant
);

// Upsert tenant score
router.post('/tenant/:id/score', 
  authenticate, 
  authorize('admin', 'manager', 'staff'), 
  upsertTenantScore
);

// Delete tenant - only admin
router.delete('/tenant/:id', 
  authenticate, 
  authorize('admin'), 
  deleteTenant
);

module.exports = router;
