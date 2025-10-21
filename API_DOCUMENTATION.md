# 🚀 Hotel Management - User API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## 📋 Table of Contents
1. [Register User](#1-register-user)
2. [Login User](#2-login-user)
3. [Get All Users](#3-get-all-users)
4. [Get User By ID](#4-get-user-by-id)
5. [Update User](#5-update-user)
6. [Delete User](#6-delete-user)
7. [Soft Delete User](#7-soft-delete-user)

---

## 1. 📝 Register User

**Endpoint:** `POST /api/register`

**Description:** Register a new user

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "password123"
}
```

**Success Response (201):**
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "role": "user",
        "status": "active",
        "createdAt": "2024-10-19T10:30:00.000Z"
    },
    "message": "User registered successfully",
    "statusCode": 201
}
```

**Error Responses:**
- **400:** All fields are required
- **400:** Invalid email format
- **400:** Password must be at least 6 characters
- **400:** User with this email already exists

---

## 2. 🔐 Login User

**Endpoint:** `POST /api/login`

**Description:** Login with email and password

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "role": "user",
        "status": "active",
        "createdAt": "2024-10-19T10:30:00.000Z"
    },
    "message": "Login successful",
    "statusCode": 200
}
```

**Error Responses:**
- **400:** Email and password are required
- **401:** Invalid email or password
- **403:** Your account is inactive. Please contact support.

---

## 3. 👥 Get All Users

**Endpoint:** `GET /api/users`

**Description:** Retrieve all users (without passwords)

**Success Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "1234567890",
            "role": "user",
            "status": "active",
            "createdAt": "2024-10-19T10:30:00.000Z",
            "updatedAt": "2024-10-19T10:30:00.000Z"
        },
        {
            "id": "507f1f77bcf86cd799439012",
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "0987654321",
            "role": "admin",
            "status": "active",
            "createdAt": "2024-10-19T10:35:00.000Z",
            "updatedAt": "2024-10-19T10:35:00.000Z"
        }
    ],
    "message": "Users retrieved successfully",
    "statusCode": 200
}
```

---

## 4. 👤 Get User By ID

**Endpoint:** `GET /api/user/:id`

**Description:** Retrieve a specific user by their ID

**URL Parameters:**
- `id` (required): MongoDB ObjectId (24 characters)

**Example:** `GET /api/user/507f1f77bcf86cd799439011`

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "role": "user",
        "status": "active",
        "createdAt": "2024-10-19T10:30:00.000Z",
        "updatedAt": "2024-10-19T10:30:00.000Z"
    },
    "message": "User retrieved successfully",
    "statusCode": 200
}
```

**Error Responses:**
- **400:** Invalid user ID
- **404:** User not found

---

## 5. ✏️ Update User

**Endpoint:** `PUT /api/user/:id`

**Description:** Update user information (all fields are optional)

**URL Parameters:**
- `id` (required): MongoDB ObjectId (24 characters)

**Request Body:** (all fields are optional)
```json
{
    "name": "John Updated",
    "email": "johnupdated@example.com",
    "phone": "9999999999",
    "password": "newpassword123",
    "role": "admin",
    "status": "active"
}
```

**Allowed Roles:** `admin`, `manager`, `staff`, `user`

**Allowed Status:** `active`, `inactive`

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Updated",
        "email": "johnupdated@example.com",
        "phone": "9999999999",
        "role": "admin",
        "status": "active",
        "updatedAt": "2024-10-19T11:00:00.000Z"
    },
    "message": "User updated successfully",
    "statusCode": 200
}
```

**Error Responses:**
- **400:** Invalid user ID
- **400:** Invalid email format
- **400:** Email already exists
- **400:** Password must be at least 6 characters
- **404:** User not found

---

## 6. 🗑️ Delete User (Hard Delete)

**Endpoint:** `DELETE /api/user/:id`

**Description:** Permanently delete a user from the database

**URL Parameters:**
- `id` (required): MongoDB ObjectId (24 characters)

**Example:** `DELETE /api/user/507f1f77bcf86cd799439011`

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439011"
    },
    "message": "User deleted successfully",
    "statusCode": 200
}
```

**Error Responses:**
- **400:** Invalid user ID
- **404:** User not found

---

## 7. 🔒 Soft Delete User (Deactivate)

**Endpoint:** `PATCH /api/user/:id/deactivate`

**Description:** Deactivate a user (change status to inactive) without deleting

**URL Parameters:**
- `id` (required): MongoDB ObjectId (24 characters)

**Example:** `PATCH /api/user/507f1f77bcf86cd799439011/deactivate`

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "status": "inactive"
    },
    "message": "User deactivated successfully",
    "statusCode": 200
}
```

**Error Responses:**
- **400:** Invalid user ID
- **404:** User not found

---

## 🧪 Testing in Postman

### Step 1: Create a New Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "Hotel Management API"

### Step 2: Add Environment Variables
1. Click "Environments" → "Create Environment"
2. Name it "Development"
3. Add variable: `base_url` = `http://localhost:3000/api`
4. Save and select the environment

### Step 3: Test APIs in Order

1. **Register a User:**
   - Method: POST
   - URL: `{{base_url}}/register`
   - Body (raw/JSON):
     ```json
     {
         "name": "Test User",
         "email": "test@example.com",
         "phone": "1234567890",
         "password": "password123"
     }
     ```
   - Click "Send"
   - **Copy the user ID from the response for next tests**

2. **Login:**
   - Method: POST
   - URL: `{{base_url}}/login`
   - Body (raw/JSON):
     ```json
     {
         "email": "test@example.com",
         "password": "password123"
     }
     ```

3. **Get All Users:**
   - Method: GET
   - URL: `{{base_url}}/users`

4. **Get User By ID:**
   - Method: GET
   - URL: `{{base_url}}/user/YOUR_USER_ID_HERE`

5. **Update User:**
   - Method: PUT
   - URL: `{{base_url}}/user/YOUR_USER_ID_HERE`
   - Body (raw/JSON):
     ```json
     {
         "name": "Updated Name",
         "phone": "9876543210"
     }
     ```

6. **Soft Delete (Deactivate):**
   - Method: PATCH
   - URL: `{{base_url}}/user/YOUR_USER_ID_HERE/deactivate`

7. **Hard Delete:**
   - Method: DELETE
   - URL: `{{base_url}}/user/YOUR_USER_ID_HERE`

---

## 🔍 Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid credentials) |
| 403 | Forbidden (account inactive) |
| 404 | Not Found |
| 500 | Server Error |

---

## 📝 Notes

1. **Password Security:** Passwords are hashed using bcrypt before storing
2. **Email Validation:** Email format is validated on registration and update
3. **Unique Email:** Email must be unique across all users
4. **Status Check:** Login only works for users with "active" status
5. **MongoDB ObjectID:** User IDs are 24-character hexadecimal strings
6. **Soft Delete vs Hard Delete:** 
   - Soft delete keeps user data but marks as inactive
   - Hard delete permanently removes user from database

---

## 🐛 Troubleshooting

### Issue: "Raw query failed. Code: `unknown`. Message: `Kind: Server selection timeout`"
**Solution:** Your MongoDB is not configured as a replica set.
- **Quick Fix:** Use MongoDB Atlas (see ATLAS_SETUP_GUIDE.txt)
- **Local Fix:** Run fix-mongodb-replica.ps1 as Administrator

### Issue: "User with this email already exists"
**Solution:** Use a different email or delete the existing user first

### Issue: "Invalid user ID"
**Solution:** Make sure the user ID is a valid 24-character MongoDB ObjectId

---

## ✅ API Testing Checklist

- [ ] Register a new user
- [ ] Try registering with the same email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Get all users
- [ ] Get user by ID
- [ ] Update user information
- [ ] Try updating with duplicate email (should fail)
- [ ] Soft delete (deactivate) user
- [ ] Try logging in with deactivated user (should fail)
- [ ] Hard delete user
- [ ] Try getting deleted user (should fail)

---

**Created:** October 2024  
**Version:** 1.0  
**Framework:** Express.js + Prisma + MongoDB

