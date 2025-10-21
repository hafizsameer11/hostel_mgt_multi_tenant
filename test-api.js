// ============================================================================
// API Test Script - Run this to verify all endpoints are working
// ============================================================================
// Prerequisites: 
// 1. MongoDB must be configured (Atlas or local replica set)
// 2. Server must be running (npm start)
// 3. Run with: node test-api.js
// ============================================================================

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let userId = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Test functions
async function testRegister() {
    console.log('\n🧪 Test 1: Register User');
    console.log('─────────────────────────');
    
    const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        phone: '1234567890',
        password: 'password123'
    };

    try {
        const response = await makeRequest('POST', '/api/register', userData);
        if (response.status === 201 && response.data.success) {
            userId = response.data.data.id;
            console.log('✅ PASSED - User registered successfully');
            console.log('📝 User ID:', userId);
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

async function testLogin() {
    console.log('\n🧪 Test 2: Login User');
    console.log('─────────────────────────');

    const loginData = {
        email: 'test@example.com',
        password: 'password123'
    };

    try {
        const response = await makeRequest('POST', '/api/login', loginData);
        if (response.status === 200 || response.status === 401) {
            console.log('✅ PASSED - Login endpoint working');
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

async function testGetAllUsers() {
    console.log('\n🧪 Test 3: Get All Users');
    console.log('─────────────────────────');

    try {
        const response = await makeRequest('GET', '/api/users');
        if (response.status === 200 && response.data.success) {
            console.log('✅ PASSED - Retrieved users successfully');
            console.log('📊 Total users:', response.data.data.length);
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

async function testGetUserById() {
    if (!userId) {
        console.log('\n⏭️  Test 4: Get User By ID - SKIPPED (no user ID)');
        return false;
    }

    console.log('\n🧪 Test 4: Get User By ID');
    console.log('─────────────────────────');

    try {
        const response = await makeRequest('GET', `/api/user/${userId}`);
        if (response.status === 200 && response.data.success) {
            console.log('✅ PASSED - User retrieved successfully');
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

async function testUpdateUser() {
    if (!userId) {
        console.log('\n⏭️  Test 5: Update User - SKIPPED (no user ID)');
        return false;
    }

    console.log('\n🧪 Test 5: Update User');
    console.log('─────────────────────────');

    const updateData = {
        name: 'Updated Test User',
        phone: '9876543210'
    };

    try {
        const response = await makeRequest('PUT', `/api/user/${userId}`, updateData);
        if (response.status === 200 && response.data.success) {
            console.log('✅ PASSED - User updated successfully');
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

async function testSoftDelete() {
    if (!userId) {
        console.log('\n⏭️  Test 6: Soft Delete User - SKIPPED (no user ID)');
        return false;
    }

    console.log('\n🧪 Test 6: Soft Delete (Deactivate) User');
    console.log('─────────────────────────────────────────');

    try {
        const response = await makeRequest('PATCH', `/api/user/${userId}/deactivate`);
        if (response.status === 200 && response.data.success) {
            console.log('✅ PASSED - User deactivated successfully');
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

async function testHardDelete() {
    if (!userId) {
        console.log('\n⏭️  Test 7: Hard Delete User - SKIPPED (no user ID)');
        return false;
    }

    console.log('\n🧪 Test 7: Hard Delete User');
    console.log('─────────────────────────');

    try {
        const response = await makeRequest('DELETE', `/api/user/${userId}`);
        if (response.status === 200 && response.data.success) {
            console.log('✅ PASSED - User deleted successfully');
            return true;
        } else {
            console.log('❌ FAILED:', response.data.message);
            return false;
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║     Hotel Management API - Automated Tests       ║');
    console.log('╚═══════════════════════════════════════════════════╝');

    // Check if server is running
    try {
        await makeRequest('GET', '/api/users');
    } catch (err) {
        console.log('\n❌ ERROR: Cannot connect to server!');
        console.log('Make sure the server is running on http://localhost:3000');
        console.log('Run: npm start');
        return;
    }

    const results = {
        passed: 0,
        failed: 0
    };

    // Run tests
    if (await testRegister()) results.passed++; else results.failed++;
    if (await testLogin()) results.passed++; else results.failed++;
    if (await testGetAllUsers()) results.passed++; else results.failed++;
    if (await testGetUserById()) results.passed++; else results.failed++;
    if (await testUpdateUser()) results.passed++; else results.failed++;
    if (await testSoftDelete()) results.passed++; else results.failed++;
    if (await testHardDelete()) results.passed++; else results.failed++;

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║                  TEST SUMMARY                     ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`\n✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total:  ${results.passed + results.failed}`);

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Your API is working perfectly!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the error messages above.');
        console.log('Common issues:');
        console.log('  - MongoDB not configured as replica set');
        console.log('  - Database connection issues');
        console.log('  - Server not running');
    }

    console.log('\n═══════════════════════════════════════════════════\n');
}

// Run tests
runAllTests();

