const express = require("express");
const router = express.Router();
const ctrl = require("../../../controllers/api/setting.controller");
const {
  authenticate,
  authorize,
} = require("../../../middleware/auth.middleware");

// ----- PROFILE (self) -----
router.get(
  "/settings/profile/personal-info",
  authenticate,
  authorize("admin", "manager"),
  ctrl.getPersonalInfo
);
router.put(
  "/settings/profile/name-email",
  authenticate,
  authorize("admin", "manager"),
  ctrl.updateNameEmail
);
router.put(
  "/settings/profile/password",
  authenticate,
  authorize("admin", "manager"),
  ctrl.changePassword
);

// ----- CONTACT INFO -----
router.put(
  "/settings/profile/contact",
  authenticate,
  authorize("admin", "manager"),
  ctrl.updateContactInfo
);

// ----- ADDRESS -----
router.get(
  "/settings/profile/address",
  authenticate,
  authorize("admin", "manager"),
  ctrl.getAddress
);
router.put(
  "/settings/profile/address",
  authenticate,
  authorize("admin", "manager"),
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
