/**
 * Reset and Seed RBAC System
 * 
 * This script:
 * 1. Seeds all permissions
 * 2. Creates default roles
 * 3. Assigns permissions to roles
 * 4. Optionally creates a default admin user with admin role
 * 
 * Run with: node scripts/reset-and-seed-rbac.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Resources and actions
const RESOURCES = [
    'owners',
    'vendors',
    'tenants',
    'users',
    'user_roles'
];

const ACTIONS = [
    'view_list',
    'view_one',
    'create',
    'edit',
    'delete'
];

// Default roles configuration (no admin role - admin is handled via isAdmin flag)
// userId: null means global role, visible to all users
const DEFAULT_ROLES = [
    {
        name: 'owner',
        description: 'Property owner with access to manage their properties, tenants, and vendors',
        userId: null, // Global role
        permissions: [
            // Owners - can view their own profile
            { resource: 'owners', action: 'view_list' },
            { resource: 'owners', action: 'view_one' },
            { resource: 'owners', action: 'edit' },
            // Vendors - can manage vendors for their properties
            { resource: 'vendors', action: 'view_list' },
            { resource: 'vendors', action: 'view_one' },
            { resource: 'vendors', action: 'create' },
            { resource: 'vendors', action: 'edit' },
            // Tenants - can manage tenants in their properties
            { resource: 'tenants', action: 'view_list' },
            { resource: 'tenants', action: 'view_one' },
            { resource: 'tenants', action: 'create' },
            { resource: 'tenants', action: 'edit' },
            // Users - can view users
            { resource: 'users', action: 'view_list' },
            { resource: 'users', action: 'view_one' }
        ]
    },
    {
        name: 'manager',
        description: 'Manager with access to view and create, but limited edit/delete',
        userId: null, // Global role
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
            { resource: 'users', action: 'view_list' }
        ]
    },
    {
        name: 'staff',
        description: 'Staff member with limited view access',
        userId: null, // Global role
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
        userId: null, // Global role
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
                    console.log(`  ✓ Created permission: ${resource}.${action}`);
                } catch (err) {
                    console.error(`  ✗ Error creating permission ${resource}.${action}:`, err.message);
                }
            } else {
                createdPermissions.push(existing);
                console.log(`  - Permission already exists: ${resource}.${action}`);
            }
        }
    }

    console.log(`✅ Total permissions: ${createdPermissions.length}\n`);
    return createdPermissions;
}

async function seedRoles() {
    console.log('🌱 Seeding roles...\n');

    const roles = [];

    for (const roleConfig of DEFAULT_ROLES) {
        try {
            // Check if role exists (with userId)
            const roleUserId = roleConfig.userId !== undefined ? roleConfig.userId : null;
            let role = await prisma.role.findFirst({
                where: {
                    roleName: roleConfig.name,
                    userId: roleUserId
                }
            });

            if (!role) {
                role = await prisma.role.create({
                    data: {
                        roleName: roleConfig.name,
                        description: roleConfig.description,
                        userId: roleConfig.userId !== undefined ? roleConfig.userId : null
                    }
                });
                console.log(`  ✓ Created role: ${role.roleName} (${role.userId === null ? 'global' : 'user-specific'})`);
            } else {
                // Update role if userId is different
                if (role.userId !== roleConfig.userId) {
                    role = await prisma.role.update({
                        where: { id: role.id },
                        data: { userId: roleConfig.userId !== undefined ? roleConfig.userId : null }
                    });
                    console.log(`  ✓ Updated role: ${role.roleName} (${role.userId === null ? 'global' : 'user-specific'})`);
                } else {
                    console.log(`  - Role already exists: ${role.roleName} (${role.userId === null ? 'global' : 'user-specific'})`);
                }
            }

            // Assign permissions (skip if permissions is 'all' - that was for admin role which is removed)
            if (Array.isArray(roleConfig.permissions)) {
                // Assign specific permissions
                let assignedCount = 0;
                
                for (const perm of roleConfig.permissions) {
                    const permission = await prisma.permission.findFirst({
                        where: {
                            resource: perm.resource,
                            action: perm.action
                        }
                    });

                    if (permission) {
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
                            assignedCount++;
                        }
                    }
                }
                console.log(`    → Assigned ${assignedCount} new permissions to ${role.roleName}`);
            }

            roles.push(role);
        } catch (err) {
            console.error(`  ✗ Error creating role ${roleConfig.name}:`, err.message);
        }
    }

    console.log(`\n✅ Total roles: ${roles.length}\n`);
    return roles;
}

async function createAdminUser() {
    console.log('👤 Creating default admin user...\n');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
        where: {
            email: 'admin@example.com'
        }
    });

    if (existingAdmin) {
        // Update existing admin to have isAdmin flag (no role needed for admin)
        if (!existingAdmin.isAdmin) {
            await prisma.user.update({
                where: { id: existingAdmin.id },
                data: { isAdmin: true, userRoleId: null }
            });
            console.log('  ✓ Updated existing admin user with isAdmin flag');
        } else {
            console.log('  - Admin user already has isAdmin flag');
        }
        return existingAdmin;
    }

    // Create new admin user with isAdmin flag
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            status: 'active',
            isAdmin: true,
            userRoleId: null // Admin doesn't need a role
        }
    });

    console.log('  ✓ Created admin user:');
    console.log(`    Email: admin@example.com`);
    console.log(`    Password: admin123`);
    console.log(`    isAdmin: true (full access)\n`);

    return adminUser;
}

async function main() {
    try {
        console.log('🚀 Starting RBAC system setup...\n');

        // Seed permissions first
        await seedPermissions();

        // Then seed roles
        const roles = await seedRoles();

        // Create admin user (no role needed - uses isAdmin flag)
        await createAdminUser();

        console.log('✅ RBAC system setup completed successfully!\n');
        console.log('📝 Next steps:');
        console.log('  1. Login with admin@example.com / admin123');
        console.log('  2. Assign roles to existing users via API or database');
        console.log('  3. Test permissions on protected routes\n');

    } catch (error) {
        console.error('❌ Error during setup:', error);
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
            console.error('💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { seedPermissions, seedRoles, createAdminUser };

