/**
 * Seed Script: Create All Sidebar Tab Permissions
 * 
 * This script creates permissions for all sidebar tabs from both main sidebar and second sidebar.
 * Each tab gets: view_list, view_one, create, edit, delete permissions.
 * 
 * Personal Information and Change Password are accessible to all roles (no permission needed).
 * 
 * Run with: node scripts/seed-sidebar-permissions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All sidebar tabs from both main sidebar and second sidebar
const SIDEBAR_TABS = [
    // Main Sidebar Tabs
    'overview',
    'people',
    'vendor_management',
    'accounts',
    'hostel_management',
    'alerts',
    'communication',
    'fpa',
    'settings',
    // Second Sidebar - People
    'tenants',
    'employees',
    'prospects',
    // Second Sidebar - Vendor
    'vendor_list',
    // Second Sidebar - Accounts
    'accounts_all',
    'accounts_payable',
    'accounts_receivable',
    'bills',
    'accounts_vendor',
    'laundry',
    'received',
    // Second Sidebar - Communication
    'comm_tenants',
    'comm_employees',
    'comm_vendors',
    // Second Sidebar - FP&A
    'fpa_monthly',
    'fpa_yearly',
    // Second Sidebar - Alerts
    'alerts_bills',
    'alerts_maintenance',
    'alerts_bin',
    // Second Sidebar - Settings
    'personal_information',
    'change_password',
    'hostel_info',
    'user_roles',
    'vendor_category',
    'vendor_service',
    'currency',
];

// People entities
const PEOPLE_ENTITIES = [
    'prospects',
    'owners',
    'vendors',
    'tenants',
    'users',
    'user_roles',
    'api_keys',
];

// Tasks & Maintenance entities
const TASKS_ENTITIES = [
    'tasks',
    'work_orders',
    'tenant_requests',
    'owner_requests',
];

// All actions
const ACTIONS = [
    'view_list',
    'view_one',
    'create',
    'edit',
    'delete'
];

/**
 * Create or update a permission
 */
async function createPermission(resource, action, description) {
    try {
        // Check if permission exists
        const existing = await prisma.permission.findFirst({
            where: {
                resource,
                action
            }
        });

        if (existing) {
            // Update description if provided
            if (description && existing.description !== description) {
                await prisma.permission.update({
                    where: { id: existing.id },
                    data: { description }
                });
            }
            return existing;
        }

        // Create new permission
        const permission = await prisma.permission.create({
            data: {
                resource,
                action,
                description: description || `Permission to ${action.replace('_', ' ')} ${resource}`
            }
        });

        console.log(`  ✓ Created permission: ${resource}.${action}`);
        return permission;
    } catch (error) {
        console.error(`  ✗ Error creating permission ${resource}.${action}:`, error.message);
        throw error;
    }
}

/**
 * Seed all sidebar tab permissions
 */
async function seedSidebarPermissions() {
    console.log('🌱 Seeding sidebar tab permissions...\n');

    const createdPermissions = [];

    for (const tab of SIDEBAR_TABS) {
        for (const action of ACTIONS) {
            try {
                const description = `Permission to ${action.replace('_', ' ')} ${tab.replace('_', ' ')}`;
                const permission = await createPermission(tab, action, description);
                createdPermissions.push(permission);
            } catch (error) {
                console.error(`  ✗ Failed to create permission for ${tab}.${action}`);
            }
        }
    }

    console.log(`\n✅ Created/updated ${createdPermissions.length} sidebar tab permissions\n`);
    return createdPermissions;
}

/**
 * Seed all people entity permissions
 */
async function seedPeoplePermissions() {
    console.log('🌱 Seeding people entity permissions...\n');

    const createdPermissions = [];

    for (const entity of PEOPLE_ENTITIES) {
        for (const action of ACTIONS) {
            try {
                const description = `Permission to ${action.replace('_', ' ')} ${entity.replace('_', ' ')}`;
                const permission = await createPermission(entity, action, description);
                createdPermissions.push(permission);
            } catch (error) {
                console.error(`  ✗ Failed to create permission for ${entity}.${action}`);
            }
        }
    }

    console.log(`\n✅ Created/updated ${createdPermissions.length} people entity permissions\n`);
    return createdPermissions;
}

/**
 * Seed all tasks & maintenance permissions
 */
async function seedTasksPermissions() {
    console.log('🌱 Seeding tasks & maintenance permissions...\n');

    const createdPermissions = [];

    for (const entity of TASKS_ENTITIES) {
        for (const action of ACTIONS) {
            try {
                const description = `Permission to ${action.replace('_', ' ')} ${entity.replace('_', ' ')}`;
                const permission = await createPermission(entity, action, description);
                createdPermissions.push(permission);
            } catch (error) {
                console.error(`  ✗ Failed to create permission for ${entity}.${action}`);
            }
        }
    }

    console.log(`\n✅ Created/updated ${createdPermissions.length} tasks & maintenance permissions\n`);
    return createdPermissions;
}

/**
 * Main seeding function
 */
async function seedAllPermissions() {
    console.log('🚀 Starting permission seeding...\n');

    try {
        // Seed all permission types
        const sidebarPerms = await seedSidebarPermissions();
        const peoplePerms = await seedPeoplePermissions();
        const tasksPerms = await seedTasksPermissions();

        const total = sidebarPerms.length + peoplePerms.length + tasksPerms.length;

        console.log('📊 Summary:');
        console.log(`  - Sidebar Tab Permissions: ${sidebarPerms.length}`);
        console.log(`  - People Entity Permissions: ${peoplePerms.length}`);
        console.log(`  - Tasks & Maintenance Permissions: ${tasksPerms.length}`);
        console.log(`  - Total Permissions: ${total}\n`);

        console.log('✅ All permissions seeded successfully!');
        console.log('\n📝 Note: Personal Information and Change Password are accessible to all roles without permissions.\n');

        return {
            sidebar: sidebarPerms,
            people: peoplePerms,
            tasks: tasksPerms,
            total
        };
    } catch (error) {
        console.error('❌ Error during permission seeding:', error);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        await seedAllPermissions();
    } catch (error) {
        console.error('💥 Permission seeding failed:', error);
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

module.exports = { 
    seedAllPermissions, 
    seedSidebarPermissions, 
    seedPeoplePermissions, 
    seedTasksPermissions,
    createPermission 
};
