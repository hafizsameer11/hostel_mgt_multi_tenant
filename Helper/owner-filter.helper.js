/**
 * Owner Filter Helper
 * Provides functions to filter data by owner's hostels
 */

const { prisma } = require('../config/db');

/**
 * Get owner's hostel IDs
 * @param {number} userId - User ID
 * @returns {Promise<number[]>} Array of hostel IDs
 */
const getOwnerHostelIds = async (userId) => {
  try {
    const ownerProfile = await prisma.owner.findUnique({
      where: { userId },
      include: {
        hostels: {
          select: { id: true }
        }
      }
    });

    if (!ownerProfile) {
      return [];
    }

    return ownerProfile.hostels.map(h => h.id);
  } catch (error) {
    console.error('Error getting owner hostel IDs:', error);
    return [];
  }
};

/**
 * Build filter for owner's hostels
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Filter object for Prisma queries
 */
const buildOwnerHostelFilter = async (req) => {
  // Admin sees everything
  if (req.isAdmin) {
    return {};
  }

  // Check if user is owner
  const userRoleName = req.userRole?.roleName?.toLowerCase();
  if (userRoleName !== 'owner') {
    // Not owner, return empty filter (will be handled by other logic)
    return {};
  }

  // Get owner's hostel IDs
  const hostelIds = await getOwnerHostelIds(req.userId);

  if (hostelIds.length === 0) {
    // Owner has no hostels, return filter that matches nothing
    return { id: { in: [-1] } };
  }

  return { hostelId: { in: hostelIds } };
};

/**
 * Build filter for tenants by owner's hostels
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Filter object for tenant queries
 */
const buildOwnerTenantFilter = async (req) => {
  // Admin sees everything
  if (req.isAdmin) {
    return {};
  }

  // Check if user is owner
  const userRoleName = req.userRole?.roleName?.toLowerCase();
  if (userRoleName !== 'owner') {
    return {};
  }

  // Get owner's hostel IDs
  const hostelIds = await getOwnerHostelIds(req.userId);

  if (hostelIds.length === 0) {
    // Owner has no hostels, return filter that matches nothing
    return { id: { in: [-1] } };
  }

  // Filter tenants by allocations in owner's hostels
  return {
    allocations: {
      some: {
        hostelId: { in: hostelIds },
        status: 'active'
      }
    }
  };
};

/**
 * Build filter for employees by owner's hostels
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Filter object for employee queries
 */
const buildOwnerEmployeeFilter = async (req) => {
  // Admin sees everything
  if (req.isAdmin) {
    return {};
  }

  // Check if user is owner
  const userRoleName = req.userRole?.roleName?.toLowerCase();
  if (userRoleName !== 'owner') {
    return {};
  }

  // Get owner's hostel IDs
  const hostelIds = await getOwnerHostelIds(req.userId);

  if (hostelIds.length === 0) {
    // Owner has no hostels, return filter that matches nothing
    return { id: { in: [-1] } };
  }

  // Filter employees by hostelId in owner's hostels
  return {
    hostelId: { in: hostelIds }
  };
};

/**
 * Build filter for vendors by owner's hostels
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Filter object for vendor queries
 */
const buildOwnerVendorFilter = async (req) => {
  // Admin sees everything
  if (req.isAdmin) {
    return {};
  }

  // Check if user is owner
  const userRoleName = req.userRole?.roleName?.toLowerCase();
  if (userRoleName !== 'owner') {
    return {};
  }

  // Get owner's hostel IDs
  const hostelIds = await getOwnerHostelIds(req.userId);

  if (hostelIds.length === 0) {
    // Owner has no hostels, return filter that matches nothing
    return { id: { in: [-1] } };
  }

  // Filter vendors by hostelId in owner's hostels
  return {
    hostelId: { in: hostelIds }
  };
};

module.exports = {
  getOwnerHostelIds,
  buildOwnerHostelFilter,
  buildOwnerTenantFilter,
  buildOwnerEmployeeFilter,
  buildOwnerVendorFilter
};
