
const bcrypt = require("bcryptjs");
const { prisma } = require("../../config/db");
const { successResponse, errorResponse } = require("../../Helper/helper");
const { writeLog } = require("../../Helper/audit.helper");

// ========== PROFILE (logged-in admin/manager) ==========
exports.updateNameEmail = async (req, res) => {
  try {
    const { username, email, phone, name, address } = req.body;
    
    // Get current user to check profile type and admin status
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        employeeProfile: true,
        ownerProfile: true,
        tenantProfile: true
      }
    });

    if (!currentUser) {
      return errorResponse(res, "User not found", 404);
    }

    // Check if user is admin (isAdmin = true)
    const isAdmin = currentUser.isAdmin;
    
    // Admin can only update username and email
    if (isAdmin) {
      const userData = {};
      if (username !== undefined) userData.username = username;
      if (email !== undefined) {
        // Check if email is already in use by another user
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists && exists.id !== req.userId) {
          return errorResponse(res, "Email already in use", 400);
        }
        userData.email = email;
      }

      if (Object.keys(userData).length > 0) {
        await prisma.user.update({
          where: { id: req.userId },
          data: userData
        });
      }

      await writeLog({
        userId: req.userId,
        action: "update",
        module: "profile",
        description: "Updated username/email (admin)",
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          isAdmin: true,
          userRoleId: true,
          createdAt: true,
          updatedAt: true,
          userRole: {
            select: {
              id: true,
              roleName: true,
              description: true
            }
          }
        }
      });

      return successResponse(res, updatedUser, "Profile updated successfully");
    }

    // For non-admin users, update based on their profile type
    const userData = {};
    if (username !== undefined) userData.username = username;
    if (email !== undefined) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists && exists.id !== req.userId) {
        return errorResponse(res, "Email already in use", 400);
      }
      userData.email = email;
    }
    if (phone !== undefined) userData.phone = phone;

    // Handle profile photo upload
    let profilePhotoPath = null;
    if (req.file) {
      profilePhotoPath = `/uploads/profiles/${req.file.filename}`;
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update User table
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: req.userId },
          data: userData
        });
      }

      // Check profile type and update accordingly
      if (currentUser.employeeProfile) {
        // Employee profile
        const employeeData = {};
        if (name !== undefined) {
          // Employee doesn't have a name field, but we can update it in User if needed
          // Actually, Employee doesn't have name, so we skip it
        }
        if (profilePhotoPath) employeeData.profilePhoto = profilePhotoPath;
        if (address !== undefined) {
          // Parse address if it's a string, otherwise use as is
          employeeData.address = typeof address === 'string' ? JSON.parse(address) : address;
        }

        if (Object.keys(employeeData).length > 0) {
          await tx.employee.update({
            where: { id: currentUser.employeeProfile.id },
            data: employeeData
          });
        }
      } else if (currentUser.ownerProfile) {
        // Owner profile
        const ownerData = {};
        if (name !== undefined) ownerData.name = name;
        if (profilePhotoPath) ownerData.profilePhoto = profilePhotoPath;
        if (address !== undefined) {
          ownerData.address = typeof address === 'string' ? JSON.parse(address) : address;
        }

        if (Object.keys(ownerData).length > 0) {
          await tx.owner.update({
            where: { id: currentUser.ownerProfile.id },
            data: ownerData
          });
        }
      } else if (currentUser.tenantProfile) {
        // Tenant profile
        const tenantData = {};
        if (name !== undefined) tenantData.name = name;
        if (profilePhotoPath) tenantData.profilePhoto = profilePhotoPath;
        if (address !== undefined) {
          tenantData.address = typeof address === 'string' ? JSON.parse(address) : address;
        }

        if (Object.keys(tenantData).length > 0) {
          await tx.tenant.update({
            where: { id: currentUser.tenantProfile.id },
            data: tenantData
          });
        }
      }
    });

    await writeLog({
      userId: req.userId,
      action: "update",
      module: "profile",
      description: "Updated profile information",
    });

    // Fetch updated user with profile info
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        employeeProfile: {
          select: {
            id: true,
            profilePhoto: true,
            address: true
          }
        },
        ownerProfile: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            address: true
          }
        },
        tenantProfile: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            address: true
          }
        },
        userRole: {
          select: {
            id: true,
            roleName: true,
            description: true
          }
        }
      }
    });

    // Format response
    const response = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      status: updatedUser.status,
      isAdmin: updatedUser.isAdmin,
      userRoleId: updatedUser.userRoleId,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      userRole: updatedUser.userRole,
      profile: null
    };

    if (updatedUser.employeeProfile) {
      response.profile = {
        type: 'employee',
        profilePhoto: updatedUser.employeeProfile.profilePhoto,
        address: updatedUser.employeeProfile.address
      };
    } else if (updatedUser.ownerProfile) {
      response.profile = {
        type: 'owner',
        name: updatedUser.ownerProfile.name,
        profilePhoto: updatedUser.ownerProfile.profilePhoto,
        address: updatedUser.ownerProfile.address
      };
    } else if (updatedUser.tenantProfile) {
      response.profile = {
        type: 'tenant',
        name: updatedUser.tenantProfile.name,
        profilePhoto: updatedUser.tenantProfile.profilePhoto,
        address: updatedUser.tenantProfile.address
      };
    }

    return successResponse(res, response, "Profile updated successfully");
  } catch (e) {
    console.error('Update name/email error:', e);
    return errorResponse(res, e.message);
  }
};

// ========== GET PASSWORD STATUS ==========
exports.getPasswordStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        password: true
      }
    });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Return password status (whether password exists, not the actual password)
    return successResponse(res, {
      hasPassword: !!user.password,
      canChangePassword: true
    }, "Password status retrieved successfully");
  } catch (e) {
    console.error('Get password status error:', e);
    return errorResponse(res, e.message);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation: newPassword is required
    if (!newPassword) {
      return errorResponse(res, "New password is required", 400);
    }
    
    // Validation: confirmPassword is required
    if (!confirmPassword) {
      return errorResponse(res, "Confirm password is required", 400);
    }
    
    // Validation: passwords must match
    if (newPassword !== confirmPassword) {
      return errorResponse(res, "New password and confirm password do not match", 400);
    }
    
    // Validation: password length
    if (newPassword.length < 5) {
      return errorResponse(res, "Password must be at least 6 characters long", 400);
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // If user has a password, current password is required
    if (user.password) {
      if (!currentPassword) {
        return errorResponse(res, "Current password is required", 400);
      }
      
      // Verify current password
      const isValid = await bcrypt.compare(String(currentPassword), user.password);
      if (!isValid) {
        return errorResponse(res, "Current password is incorrect", 400);
      }
    }

    // Hash and update password
    const hashed = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed },
    });
    
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "profile",
      description: "Changed password",
    });
    
    return successResponse(res, null, "Password changed successfully");
  } catch (e) {
    console.error('Change password error:', e);
    return errorResponse(res, e.message);
  }
};

// ========== KEY–VALUE SETTINGS ==========
exports.getSettings = async (_req, res) => {
  try {
    const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    return successResponse(res, rows);
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// expects: [{key:"company_name", value:"Hostelity"}, ...]
exports.upsertSettings = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    await prisma.$transaction(
      items.map((it) =>
        prisma.setting.upsert({
          where: { key: it.key },
          update: { value: String(it.value ?? "") },
          create: { key: it.key, value: String(it.value ?? "") },
        })
      )
    );
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "settings",
      description: "Updated settings",
    });
    return successResponse(res, null, "Settings saved");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== USERS MANAGEMENT ==========
exports.listUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Role filter - find role by roleName
    if (role) {
      const roleRecord = await prisma.role.findFirst({
        where: { roleName: { contains: role, mode: 'insensitive' } }
      });
      if (roleRecord) {
        where.userRoleId = roleRecord.id;
      }
    }
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          isAdmin: true,
          userRoleId: true,
          createdAt: true,
          updatedAt: true,
          userRole: {
            select: {
              id: true,
              roleName: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    // Format users with role name and properties count
    const formattedUsers = await Promise.all(users.map(async (user) => {
      const managedHostels = await prisma.hostel.count({
        where: { managedBy: user.id }
      });
      
      return {
        ...user,
        role: user.userRole ? user.userRole.roleName : (user.isAdmin ? "Full Access" : "No Role"),
        properties: managedHostels > 0 ? `${managedHostels} Properties` : "All Properties"
      };
    }));
    
    return successResponse(res, {
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    }, "Users retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, phone, userRoleId, status = "active" } = req.body;
    
    if (!username || !email || !password) {
      return errorResponse(res, "Username, email, and password are required", 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    
    // Check if user exists
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return errorResponse(res, "Email already in use", 400);
    
    // Validate role if provided
    if (userRoleId) {
      const roleExists = await prisma.role.findUnique({ where: { id: Number(userRoleId) } });
      if (!roleExists) {
        return errorResponse(res, "Role not found", 400);
      }
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashed,
        status,
        userRoleId: userRoleId ? Number(userRoleId) : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        isAdmin: true,
        userRoleId: true,
        createdAt: true,
        userRole: {
          select: {
            id: true,
            roleName: true,
            description: true
          }
        }
      }
    });
    
    await writeLog({
      userId: req.userId,
      action: "create",
      module: "user",
      description: `User ${email} created`,
    });
    
    return successResponse(res, user, "User created successfully", 201);
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, email, phone, status, password, userRoleId } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }
    
    const data = {};
    if (username) data.username = username;
    if (phone) data.phone = phone;
    if (status) data.status = status;
    
    if (email && email !== existingUser.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return errorResponse(res, "Email already in use", 400);
      data.email = email;
    }
    
    if (userRoleId !== undefined) {
      if (userRoleId !== null) {
        const roleExists = await prisma.role.findUnique({ where: { id: Number(userRoleId) } });
        if (!roleExists) {
          return errorResponse(res, "Role not found", 400);
        }
      }
      data.userRoleId = userRoleId ? Number(userRoleId) : null;
    }
    
    if (password) {
      if (password.length < 8) {
        return errorResponse(res, "Password must be at least 8 characters long", 400);
      }
      data.password = await bcrypt.hash(String(password), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        isAdmin: true,
        userRoleId: true,
        updatedAt: true,
        userRole: {
          select: {
            id: true,
            roleName: true,
            description: true
          }
        }
      }
    });
    
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "user",
      description: `User #${id} updated`,
    });
    
    return successResponse(res, user, "User updated successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }
    
    // Prevent deleting yourself
    if (id === req.userId) {
      return errorResponse(res, "Cannot delete your own account", 400);
    }
    
    await prisma.user.delete({ where: { id } });
    
    await writeLog({
      userId: req.userId,
      action: "delete",
      module: "user",
      description: `User #${id} deleted`,
    });
    
    return successResponse(res, null, "User deleted successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== MANAGERS (Legacy - keeping for backward compatibility) ==========
exports.addManager = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return errorResponse(res, "Email already in use", 400);

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashed,
        status: "active",
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
    await writeLog({
      userId: req.userId,
      action: "create",
      module: "manager",
      description: `Manager ${email} created`,
    });
    return successResponse(res, user, "Manager added");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.listManagers = async (_req, res) => {
  try {
    // Find users with manager role or employees with manager role
    const managerRole = await prisma.role.findFirst({
      where: { roleName: { contains: "manager", mode: 'insensitive' } }
    });
    
    const where = {};
    if (managerRole) {
      where.userRoleId = managerRole.id;
    } else {
      // If no manager role exists, return empty array
      return successResponse(res, [], "No managers found");
    }
    
    const rows = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        userRole: {
          select: {
            id: true,
            roleName: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, rows);
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.updateManager = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, email, phone, status, password } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, "Manager not found", 404);
    }
    
    const data = {};
    if (username) data.username = username;
    if (phone) data.phone = phone;
    if (status) data.status = status;
    
    if (email && email !== existingUser.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return errorResponse(res, "Email already in use", 400);
      data.email = email;
    }
    
    if (password) {
      if (password.length < 8) {
        return errorResponse(res, "Password must be at least 8 characters long", 400);
      }
      data.password = await bcrypt.hash(String(password), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
        userRole: {
          select: {
            id: true,
            roleName: true,
            description: true
          }
        }
      }
    });
    
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "manager",
      description: `Manager #${id} updated`,
    });
    
    return successResponse(res, user, "Manager updated");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.deleteManager = async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, "Manager not found", 404);
    }
    
    await prisma.user.delete({ where: { id } });
    
    await writeLog({
      userId: req.userId,
      action: "delete",
      module: "manager",
      description: `Manager #${id} deleted`,
    });
    
    return successResponse(res, null, "Manager deleted");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== PERSONAL INFO ==========
exports.getPersonalInfo = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    // Check if user has linked Tenant or Employee profile
    const tenant = await prisma.tenant.findUnique({ 
      where: { userId: req.userId },
      select: { 
        firstName: true, 
        lastName: true, 
        companyName: true, 
        designation: true,
        name: true
      }
    });
    
    const employee = await prisma.employee.findUnique({ 
      where: { userId: req.userId },
      select: { 
        designation: true
      }
    });
    
    let personalInfo = {
      ...user,
      firstName: null,
      lastName: null,
      company: null,
      jobTitle: null
    };
    
    if (tenant) {
      personalInfo.firstName = tenant.firstName || null;
      personalInfo.lastName = tenant.lastName || null;
      personalInfo.company = tenant.companyName || null;
      personalInfo.jobTitle = tenant.designation || null;
      // If firstName/lastName are null, try to split name
      if (!personalInfo.firstName && !personalInfo.lastName && tenant.name) {
        const nameParts = tenant.name.split(' ');
        personalInfo.firstName = nameParts[0] || null;
        personalInfo.lastName = nameParts.slice(1).join(' ') || null;
      }
    } else if (employee) {
      personalInfo.jobTitle = employee.designation || null;
    }
    
    return successResponse(res, personalInfo, "Personal info retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== CONTACT INFO ==========
exports.updateContactInfo = async (req, res) => {
  try {
    const { phone } = req.body;
    
    const data = {};
    if (phone) data.phone = phone;
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
      }
    });
    
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "profile",
      description: "Updated contact information",
    });
    
    return successResponse(res, user, "Contact information updated");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== ADDRESS ==========
exports.updateAddress = async (req, res) => {
  try {
    const { country, state, city, zipCode, street1, street2 } = req.body;
    
    if (!country || !city || !zipCode || !street1) {
      return errorResponse(res, "Country, City, Zip code, and Street 1 are required", 400);
    }
    
    const address = {
      country,
      state: state || null,
      city,
      zipCode,
      street1,
      street2: street2 || null
    };
    
    // Check if user has linked Tenant or Employee profile
    const tenant = await prisma.tenant.findUnique({ where: { userId: req.userId } });
    const employee = await prisma.employee.findUnique({ where: { userId: req.userId } });
    
    if (tenant) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { address }
      });
    } else if (employee) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { address }
      });
    } else {
      // Store in settings if no tenant/employee profile exists
      await prisma.setting.upsert({
        where: { key: `user_${req.userId}_address` },
        update: { value: JSON.stringify(address) },
        create: { key: `user_${req.userId}_address`, value: JSON.stringify(address) }
      });
    }
    
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "profile",
      description: "Updated address",
    });
    
    return successResponse(res, address, "Address updated successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.getAddress = async (req, res) => {
  try {
    // Check if user has linked Tenant or Employee profile
    const tenant = await prisma.tenant.findUnique({ 
      where: { userId: req.userId },
      select: { address: true }
    });
    
    const employee = await prisma.employee.findUnique({ 
      where: { userId: req.userId },
      select: { address: true }
    });
    
    let address = null;
    
    if (tenant?.address) {
      address = tenant.address;
    } else if (employee?.address) {
      address = employee.address;
    } else {
      // Get from settings
      const setting = await prisma.setting.findUnique({
        where: { key: `user_${req.userId}_address` }
      });
      if (setting) {
        address = JSON.parse(setting.value);
      }
    }
    
    return successResponse(res, address || {}, "Address retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== HOSTEL INFO (Settings) ==========
exports.getHostelInfo = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'company_name',
            'company_logo',
            'primary_email',
            'primary_phone',
            'company_website',
            'address_street1',
            'address_street2',
            'address_city',
            'address_state',
            'address_country',
            'address_zipcode'
          ]
        }
      }
    });
    
    // Convert to object format
    const hostelInfo = {};
    settings.forEach(setting => {
      const key = setting.key.replace('address_', '');
      if (key === 'company_name') hostelInfo.companyName = setting.value;
      else if (key === 'company_logo') hostelInfo.companyLogo = setting.value;
      else if (key === 'primary_email') hostelInfo.primaryEmail = setting.value;
      else if (key === 'primary_phone') hostelInfo.primaryPhone = setting.value;
      else if (key === 'company_website') hostelInfo.companyWebsite = setting.value;
      else if (key === 'street1') hostelInfo.street1 = setting.value;
      else if (key === 'street2') hostelInfo.street2 = setting.value;
      else if (key === 'city') hostelInfo.city = setting.value;
      else if (key === 'state') hostelInfo.state = setting.value;
      else if (key === 'country') hostelInfo.country = setting.value;
      else if (key === 'zipcode') hostelInfo.zipCode = setting.value;
    });
    
    return successResponse(res, hostelInfo, "Hostel info retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.updateHostelInfo = async (req, res) => {
  try {
    const {
      companyName,
      companyLogo,
      primaryEmail,
      primaryPhone,
      companyWebsite,
      street1,
      street2,
      city,
      state,
      country,
      zipCode
    } = req.body;
    
    const settings = [];
    
    if (companyName !== undefined) {
      settings.push({ key: 'company_name', value: String(companyName) });
    }
    if (companyLogo !== undefined) {
      settings.push({ key: 'company_logo', value: String(companyLogo) });
    }
    if (primaryEmail !== undefined) {
      settings.push({ key: 'primary_email', value: String(primaryEmail) });
    }
    if (primaryPhone !== undefined) {
      settings.push({ key: 'primary_phone', value: String(primaryPhone) });
    }
    if (companyWebsite !== undefined) {
      settings.push({ key: 'company_website', value: String(companyWebsite) });
    }
    if (street1 !== undefined) {
      settings.push({ key: 'address_street1', value: String(street1) });
    }
    if (street2 !== undefined) {
      settings.push({ key: 'address_street2', value: String(street2) });
    }
    if (city !== undefined) {
      settings.push({ key: 'address_city', value: String(city) });
    }
    if (state !== undefined) {
      settings.push({ key: 'address_state', value: String(state) });
    }
    if (country !== undefined) {
      settings.push({ key: 'address_country', value: String(country) });
    }
    if (zipCode !== undefined) {
      settings.push({ key: 'address_zipcode', value: String(zipCode) });
    }
    
    if (settings.length > 0) {
      await prisma.$transaction(
        settings.map((it) =>
          prisma.setting.upsert({
            where: { key: it.key },
            update: { value: it.value },
            create: { key: it.key, value: it.value },
          })
        )
      );
    }
    
    await writeLog({
      userId: req.userId,
      action: "update",
      module: "settings",
      description: "Updated hostel info",
    });
    
    return successResponse(res, null, "Hostel info updated successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== ACTIVITY LOGS ==========
exports.listActivityLogs = async (req, res) => {
  try {
    const { module, userId, from, to, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    if (module) where.module = String(module);
    if (userId) where.userId = Number(userId);
    if (from || to)
      where.createdAt = {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      };
    
    const [rows, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { 
          user: { 
            select: { 
              id: true, 
              username: true, 
              email: true,
              isAdmin: true,
              userRole: {
                select: {
                  id: true,
                  roleName: true,
                  description: true
                }
              }
            } 
          } 
        },
      }),
      prisma.activityLog.count({ where })
    ]);
    
    return successResponse(res, {
      logs: rows,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    }, "Activity logs retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

// ========== SCORE CARDS ==========
exports.addScoreCard = async (req, res) => {
  try {
    const { entityType, entityId, score, criteria, remarks } = req.body;
    
    if (!entityType || !entityId || score === undefined) {
      return errorResponse(res, "Entity type, entity ID, and score are required", 400);
    }
    
    const row = await prisma.scoreCard.create({
      data: {
        entityType: String(entityType),
        entityId: Number(entityId),
        score: Number(score),
        criteria: criteria || null,
        remarks: remarks || null,
        recordedBy: req.userId,
      },
      include: {
        recorder: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    await writeLog({
      userId: req.userId,
      action: "create",
      module: "scorecard",
      description: `${entityType}#${entityId} scored ${score}`,
    });
    
    return successResponse(res, row, "Score recorded successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.getScoreCards = async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    if (entityType) where.entityType = String(entityType);
    if (entityId) where.entityId = Number(entityId);

    const [rows, total] = await Promise.all([
      prisma.scoreCard.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          recorder: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      }),
      prisma.scoreCard.count({ where })
    ]);
    
    return successResponse(res, {
      scoreCards: rows,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    }, "Score cards retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};

exports.scoreSummary = async (req, res) => {
  try {
    const { entityType } = req.query; // optional
    
    const groups = await prisma.scoreCard.groupBy({
      by: ["entityType", "entityId"],
      where: entityType ? { entityType: String(entityType) } : undefined,
      _avg: { score: true },
      _count: { _all: true },
      orderBy: { entityId: "asc" },
    });
    
    return successResponse(res, groups, "Score summary retrieved successfully");
  } catch (e) {
    return errorResponse(res, e.message);
  }
};
