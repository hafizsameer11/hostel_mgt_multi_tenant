/**
 * Seed Script: Initialize Permissions and Default Roles
 * 
 * This script creates:
 * 1. All permissions based on the resources and actions shown in the UI
 * 2. Default roles (Admin, Manager, Staff, etc.)
 * 3. Assigns permissions to roles
 * 
 * Run with: node scripts/seed-permissions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Resources and actions based on the UI permission matrix
const RESOURCES = [
    'owners',
    'vendors',
    'tenants',
    'users',
    'user_roles',
];

const ACTIONS = [
    'view_list',
    'view_one',
    'create',
    'edit',
    'delete'
];

// Default roles configuration
const DEFAULT_ROLES = [
    {
        name: 'admin',
        description: 'System administrator with full access to all resources',
        permissions: 'all' // All permissions
    },
    {
        name: 'manager',
        description: 'Manager with access to view and create, but limited edit/delete',
        permissions: [
            // Owners
            { resource: 'owners', action: 'view_list' },
            { resource: 'owners', action: 'view_one' },
            // Vendors
            { resource: 'vendors', action: 'view_list' },
            { resource: 'vendors', action: 'view_one' },
            // Tenants
            { resource: 'tenants', action: 'view_list' },
            { resource: 'tenants', action: 'view_one' },
            { resource: 'tenants', action: 'create' },
            // Users
            { resource: 'users', action: 'view_list' },
        ]
    },
    {
        name: 'staff',
        description: 'Staff member with limited view access',
        permissions: [
            { resource: 'tenants', action: 'view_list' },
            { resource: 'tenants', action: 'view_one' },
            { resource: 'owners', action: 'view_list' },
            { resource: 'owners', action: 'view_one' },
            { resource: 'vendors', action: 'view_list' },
            { resource: 'vendors', action: 'view_one' }
        ]
    },
    {
        name: 'user',
        description: 'Regular user with minimal access',
        permissions: []
    }
];

async function seedPermissions() {
    console.log('🌱 Seeding permissions...');

    const createdPermissions = [];

    for (const resource of RESOURCES) {
        for (const action of ACTIONS) {
            // Check if permission exists
            const existing = await prisma.permission.findFirst({
                where: { resource, action }
            });

            if (!existing) {
                try {
                    const permission = await prisma.permission.create({
                        data: {
                            resource,
                            action,
                            description: `Permission to ${action.replace('_', ' ')} ${resource}`
                        }
                    });
                    createdPermissions.push(permission);
                } catch (err) {
                    console.error(`Error creating permission ${resource}.${action}:`, err.message);
                }
            } else {
                createdPermissions.push(existing);
            }
        }
    }

    console.log(`✅ Created ${createdPermissions.length} permissions`);
    return createdPermissions;
}

async function seedRoles() {
    console.log('🌱 Seeding roles...');

    const roles = [];

    for (const roleConfig of DEFAULT_ROLES) {
        try {
            // Check if role exists
            let role = await prisma.role.findUnique({
                where: { name: roleConfig.name }
            });

            if (!role) {
                role = await prisma.role.create({
                    data: {
                        name: roleConfig.name,
                        description: roleConfig.description
                    }
                });
            }

            // Assign permissions
            if (roleConfig.permissions === 'all') {
                    // Get all permissions
                    const allPermissions = await prisma.permission.findMany();
                    for (const permission of allPermissions) {
                        // Check if role permission already exists
                        const existing = await prisma.rolePermission.findFirst({
                            where: {
                                roleId: role.id,
                                permissionId: permission.id
                            }
                        });

                        if (!existing) {
                            await prisma.rolePermission.create({
                                data: {
                                    roleId: role.id,
                                    permissionId: permission.id
                                }
                            });
                        }
                    }
                } else if (Array.isArray(roleConfig.permissions)) {
                    // Assign specific permissions
                    for (const perm of roleConfig.permissions) {
                        const permission = await prisma.permission.findFirst({
                            where: {
                                resource: perm.resource,
                                action: perm.action
                            }
                        });

                        if (permission) {
                            // Check if role permission already exists
                            const existing = await prisma.rolePermission.findFirst({
                                where: {
                                    roleId: role.id,
                                    permissionId: permission.id
                                }
                            });

                            if (!existing) {
                                await prisma.rolePermission.create({
                                    data: {
                                        roleId: role.id,
                                        permissionId: permission.id
                                    }
                                });
                            }
                        }
                    }
                }

            roles.push(role);
            console.log(`✅ Created/updated role: ${role.name}`);
        } catch (err) {
            console.error(`❌ Error creating role ${roleConfig.name}:`, err.message);
        }
    }

    return roles;
}

async function main() {
    try {
        console.log('🚀 Starting permission and role seeding...\n');

        // Seed permissions first
        await seedPermissions();

        // Then seed roles
        await seedRoles();

        console.log('\n✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
if (require.main === module) {
    main()
        .then(() => {
            console.log('✨ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedPermissions, seedRoles };

