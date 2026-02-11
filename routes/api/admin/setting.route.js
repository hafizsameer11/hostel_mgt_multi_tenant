const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const ctrl = require("../../../controllers/api/setting.controller");
const {
  authenticate,
  authorize,
} = require("../../../middleware/auth.middleware");

// ===============================
// MULTER CONFIG for profile photo
// ===============================
const uploadsDir = path.join(__dirname, '../../../uploads/profiles');

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
    const base = 'profile-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, base + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP'));
  }
});

// ----- PROFILE (self) - Accessible to all authenticated users -----
router.get(
  "/settings/profile/personal-info",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  ctrl.getPersonalInfo
);
router.put(
  "/settings/profile-info",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  upload.single('profilePhoto'),
  ctrl.updateNameEmail
);
// Get password status
router.get(
  "/settings/profile/password",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  ctrl.getPasswordStatus
);

// Update password
router.put(
  "/settings/profile/password",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  ctrl.changePassword
);

// ----- CONTACT INFO - Accessible to all authenticated users -----
router.put(
  "/settings/profile/contact",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  ctrl.updateContactInfo
);

// ----- ADDRESS - Accessible to all authenticated users -----
router.get(
  "/settings/profile/address",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  ctrl.getAddress
);
router.put(
  "/settings/profile/address",
  authenticate,
  authorize("admin", "manager", "owner", "employee", "staff"),
  ctrl.updateAddress
);

// ----- KEY–VALUE SETTINGS -----
router.get(
  "/settings",
  authenticate,
  authorize("admin", "manager"),
  ctrl.getSettings
);
router.put("/settings", authenticate, authorize("admin"), ctrl.upsertSettings);

// ----- HOSTEL INFO -----
router.get(
  "/settings/hostel-info",
  authenticate,
  authorize("admin", "manager"),
  ctrl.getHostelInfo
);
router.put(
  "/settings/hostel-info",
  authenticate,
  authorize("admin"),
  ctrl.updateHostelInfo
);

// ----- USERS MANAGEMENT -----
router.get(
  "/settings/users",
  authenticate,
  authorize("admin", "manager"),
  ctrl.listUsers
);
router.post(
  "/settings/users",
  authenticate,
  authorize("admin"),
  ctrl.createUser
);
router.put(
  "/settings/users/:id",
  authenticate,
  authorize("admin"),
  ctrl.updateUser
);
router.delete(
  "/settings/users/:id",
  authenticate,
  authorize("admin"),
  ctrl.deleteUser
);

// ----- MANAGERS (Legacy - for backward compatibility) -----
router.post(
  "/settings/manager",
  authenticate,
  authorize("admin"),
  ctrl.addManager
);
router.get(
  "/settings/manager",
  authenticate,
  authorize("admin", "manager"),
  ctrl.listManagers
);
router.put(
  "/settings/manager/:id",
  authenticate,
  authorize("admin"),
  ctrl.updateManager
);
router.delete(
  "/settings/manager/:id",
  authenticate,
  authorize("admin"),
  ctrl.deleteManager
);

// ----- ACTIVITY LOGS -----
router.get(
  "/settings/logs",
  authenticate,
  authorize("admin", "manager"),
  ctrl.listActivityLogs
);

// ----- SCORE CARDS -----
router.post(
  "/settings/scorecard",
  authenticate,
  authorize("admin", "manager"),
  ctrl.addScoreCard
);
router.get(
  "/settings/scorecard",
  authenticate,
  authorize("admin", "manager"),
  ctrl.getScoreCards
);
router.get(
  "/settings/scorecard/summary",
  authenticate,
  authorize("admin", "manager"),
  ctrl.scoreSummary
);

module.exports = router;
