// ===============================
// Permission Controller
// ===============================

const { successResponse, errorResponse } = require('../../Helper/helper');
const { prisma } = require('../../config/db');

// ===================================
// GET ALL PERMISSIONS
// ===================================
const getAllPermissions = async (req, res) => {
    try {
        const { page = 1, limit = 100, resource, action, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};
        
        if (resource) {
            where.resource = resource;
        }
        
        if (action) {
            where.action = action;
        }
        
        if (search) {
            where.OR = [
                { resource: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [permissions, total] = await Promise.all([
            prisma.permission.findMany({
                where,
                skip,
                take,
                include: {
                    _count: {
                        select: {
                            roles: true
                        }
                    }
                },
                orderBy: [
                    { resource: 'asc' },
                    { action: 'asc' }
                ]
            }),
            prisma.permission.count({ where })
        ]);

        return successResponse(
            res,
            {
                permissions,
                pagination: {
                    page: parseInt(page),
                    limit: take,
                    total,
                    totalPages: Math.ceil(total / take)
                }
            },
            "Permissions retrieved successfully"
        );
    } catch (err) {
        console.error("Get All Permissions Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET PERMISSION BY ID
// ===================================
const getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const permissionId = parseInt(id);

        if (isNaN(permissionId)) {
            return errorResponse(res, "Invalid permission ID", 400);
        }

        const permission = await prisma.permission.findUnique({
            where: { id: permissionId },
            include: {
                roles: {
                    include: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        roles: true
                    }
                }
            }
        });

        if (!permission) {
            return errorResponse(res, "Permission not found", 404);
        }

        // Format roles for easier frontend consumption
        const formattedPermission = {
            ...permission,
            roles: permission.roles.map(rp => rp.role)
        };

        return successResponse(res, formattedPermission, "Permission retrieved successfully");
    } catch (err) {
        console.error("Get Permission By ID Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// CREATE PERMISSION
// ===================================
const createPermission = async (req, res) => {
    try {
        const { resource, action, description } = req.body;

        // Validation
        if (!resource || !resource.trim()) {
            return errorResponse(res, "Resource is required", 400);
        }

        if (!action || !action.trim()) {
            return errorResponse(res, "Action is required", 400);
        }

        // Check if permission already exists
        const existingPermission = await prisma.permission.findFirst({
            where: {
                resource: resource.trim(),
                action: action.trim()
            }
        });

        if (existingPermission) {
            return errorResponse(
                res,
                "Permission with this resource and action already exists",
                400
            );
        }

        // Create permission
        const permission = await prisma.permission.create({
            data: {
                resource: resource.trim(),
                action: action.trim(),
                description: description?.trim() || null
            }
        });

        return successResponse(
            res,
            permission,
            "Permission created successfully",
            201
        );
    } catch (err) {
        console.error("Create Permission Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// UPDATE PERMISSION
// ===================================
const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { resource, action, description } = req.body;
        const permissionId = parseInt(id);

        if (isNaN(permissionId)) {
            return errorResponse(res, "Invalid permission ID", 400);
        }

        // Check if permission exists
        const existingPermission = await prisma.permission.findUnique({
            where: { id: permissionId }
        });

        if (!existingPermission) {
            return errorResponse(res, "Permission not found", 404);
        }

        // Check if resource/action combination is being changed and if it conflicts
        if (
            (resource && resource.trim() !== existingPermission.resource) ||
            (action && action.trim() !== existingPermission.action)
        ) {
            const newResource = resource?.trim() || existingPermission.resource;
            const newAction = action?.trim() || existingPermission.action;

            const conflict = await prisma.permission.findFirst({
                where: {
                    resource: newResource,
                    action: newAction
                }
            });

            if (conflict && conflict.id !== permissionId) {
                return errorResponse(
                    res,
                    "Permission with this resource and action already exists",
                    400
                );
            }
        }

        // Prepare update data
        const updateData = {};
        if (resource) updateData.resource = resource.trim();
        if (action) updateData.action = action.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;

        // Update permission
        const updatedPermission = await prisma.permission.update({
            where: { id: permissionId },
            data: updateData
        });

        return successResponse(res, updatedPermission, "Permission updated successfully");
    } catch (err) {
        console.error("Update Permission Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// DELETE PERMISSION
// ===================================
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permissionId = parseInt(id);

        if (isNaN(permissionId)) {
            return errorResponse(res, "Invalid permission ID", 400);
        }

        // Check if permission exists
        const existingPermission = await prisma.permission.findUnique({
            where: { id: permissionId },
            include: {
                _count: {
                    select: {
                        roles: true
                    }
                }
            }
        });

        if (!existingPermission) {
            return errorResponse(res, "Permission not found", 404);
        }

        // Delete permission (role permissions will be cascade deleted)
        await prisma.permission.delete({
            where: { id: permissionId }
        });

        return successResponse(res, { id: permissionId }, "Permission deleted successfully");
    } catch (err) {
        console.error("Delete Permission Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET PERMISSIONS BY RESOURCE
// ===================================
const getPermissionsByResource = async (req, res) => {
    try {
        const { resource } = req.params;

        if (!resource) {
            return errorResponse(res, "Resource parameter is required", 400);
        }

        const permissions = await prisma.permission.findMany({
            where: { resource },
            orderBy: { action: 'asc' }
        });

        return successResponse(
            res,
            permissions,
            "Permissions retrieved successfully"
        );
    } catch (err) {
        console.error("Get Permissions By Resource Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ALL RESOURCES
// ===================================
const getAllResources = async (req, res) => {
    try {
        const resources = await prisma.permission.findMany({
            select: {
                resource: true
            },
            distinct: ['resource'],
            orderBy: {
                resource: 'asc'
            }
        });

        const uniqueResources = resources.map(r => r.resource);

        return successResponse(
            res,
            { resources: uniqueResources },
            "Resources retrieved successfully"
        );
    } catch (err) {
        console.error("Get All Resources Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ALL ACTIONS
// ===================================
const getAllActions = async (req, res) => {
    try {
        const actions = await prisma.permission.findMany({
            select: {
                action: true
            },
            distinct: ['action'],
            orderBy: {
                action: 'asc'
            }
        });

        const uniqueActions = actions.map(a => a.action);

        return successResponse(
            res,
            { actions: uniqueActions },
            "Actions retrieved successfully"
        );
    } catch (err) {
        console.error("Get All Actions Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// BULK CREATE PERMISSIONS
// ===================================
const bulkCreatePermissions = async (req, res) => {
    try {
        const { permissions } = req.body;

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return errorResponse(res, "Permissions array is required", 400);
        }

        const createdPermissions = [];
        const errors = [];

        for (const perm of permissions) {
            try {
                const { resource, action, description } = perm;

                if (!resource || !action) {
                    errors.push({ permission: perm, error: "Resource and action are required" });
                    continue;
                }

                // Check if permission already exists
                const existing = await prisma.permission.findFirst({
                    where: {
                        resource: resource.trim(),
                        action: action.trim()
                    }
                });

                if (existing) {
                    errors.push({ permission: perm, error: "Permission already exists" });
                    continue;
                }

                const created = await prisma.permission.create({
                    data: {
                        resource: resource.trim(),
                        action: action.trim(),
                        description: description?.trim() || null
                    }
                });

                createdPermissions.push(created);
            } catch (err) {
                errors.push({ permission: perm, error: err.message });
            }
        }

        return successResponse(
            res,
            {
                created: createdPermissions,
                errors: errors.length > 0 ? errors : undefined
            },
            `Created ${createdPermissions.length} permission(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`
        );
    } catch (err) {
        console.error("Bulk Create Permissions Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

module.exports = {
    getAllPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
    getPermissionsByResource,
    getAllResources,
    getAllActions,
    bulkCreatePermissions
};

