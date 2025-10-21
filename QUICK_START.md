# 🚀 Quick Start Guide

## ✅ What's Been Created

I've successfully created a complete User Management API with the following endpoints:

### 📝 APIs Available:
1. **POST** `/api/register` - Register new user
2. **POST** `/api/login` - User login
3. **GET** `/api/users` - Get all users
4. **GET** `/api/user/:id` - Get user by ID
5. **PUT** `/api/user/:id` - Update user
6. **DELETE** `/api/user/:id` - Delete user (hard delete)
7. **PATCH** `/api/user/:id/deactivate` - Deactivate user (soft delete)

---

## ⚠️ IMPORTANT: Before Testing

**Your MongoDB needs to be configured as a replica set!**

If you haven't done this yet, choose ONE option:

### Option A: MongoDB Atlas (FASTEST - 5 minutes)
Follow the step-by-step guide in: `ATLAS_SETUP_GUIDE.txt`

### Option B: Local MongoDB (Requires Admin)
Run in PowerShell as Administrator:
```powershell
cd "D:\nodejs projects\hotel_mangment\backend"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\fix-mongodb-replica.ps1
```

---

## 🎯 Testing Your APIs

### Method 1: Import Postman Collection (EASIEST)

1. **Open Postman**
2. **Click "Import"**
3. **Select file:** `Hotel_Management_API.postman_collection.json`
4. **All endpoints will be ready to test!**

### Method 2: Manual Testing

Follow the detailed guide in: `API_DOCUMENTATION.md`

---

## 📋 Quick Test Steps

### 1. Start Your Server
```bash
npm start
```

### 2. Test in Postman

**Step 1: Register a User**
- **Method:** POST
- **URL:** `http://localhost:3000/api/register`
- **Body (JSON):**
```json
{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "password123"
}
```
- **Expected:** 201 Created with user data
- **Copy the `id` from the response!**

---

**Step 2: Login**
- **Method:** POST
- **URL:** `http://localhost:3000/api/login`
- **Body (JSON):**
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```
- **Expected:** 200 OK with user data

---

**Step 3: Get All Users**
- **Method:** GET
- **URL:** `http://localhost:3000/api/users`
- **Expected:** 200 OK with array of users

---

**Step 4: Get User By ID**
- **Method:** GET
- **URL:** `http://localhost:3000/api/user/YOUR_USER_ID_HERE`
- **Replace** `YOUR_USER_ID_HERE` with the ID from Step 1
- **Expected:** 200 OK with user data

---

**Step 5: Update User**
- **Method:** PUT
- **URL:** `http://localhost:3000/api/user/YOUR_USER_ID_HERE`
- **Body (JSON):**
```json
{
    "name": "Updated Name",
    "phone": "9876543210"
}
```
- **Expected:** 200 OK with updated user data

---

**Step 6: Soft Delete (Deactivate)**
- **Method:** PATCH
- **URL:** `http://localhost:3000/api/user/YOUR_USER_ID_HERE/deactivate`
- **Expected:** 200 OK, user status changed to "inactive"

---

**Step 7: Try Login Again (Should Fail)**
- **Method:** POST
- **URL:** `http://localhost:3000/api/login`
- **Body:** Same as Step 2
- **Expected:** 403 Forbidden - "Your account is inactive"

---

**Step 8: Hard Delete User**
- **Method:** DELETE
- **URL:** `http://localhost:3000/api/user/YOUR_USER_ID_HERE`
- **Expected:** 200 OK, user permanently deleted

---

## 🎨 Features Included

### ✅ Security Features
- ✅ Password hashing with bcrypt
- ✅ Password never returned in responses
- ✅ Email validation
- ✅ Password length validation (min 6 characters)
- ✅ Duplicate email prevention

### ✅ User Status Management
- ✅ Active/Inactive status
- ✅ Login blocked for inactive users
- ✅ Soft delete (deactivate) option
- ✅ Hard delete (permanent) option

### ✅ Role Management
- ✅ Four roles: admin, manager, staff, user
- ✅ Default role: user
- ✅ Role can be updated

### ✅ Validation & Error Handling
- ✅ Input validation for all fields
- ✅ Email format validation
- ✅ MongoDB ObjectId validation
- ✅ Proper error messages
- ✅ HTTP status codes

### ✅ API Best Practices
- ✅ RESTful design
- ✅ Consistent response format
- ✅ Clear error messages
- ✅ Proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Password excluded from queries

---

## 📁 Files Created/Updated

1. **controllers/user.controller.js** - All user logic
2. **routes/user.route.js** - API routes
3. **API_DOCUMENTATION.md** - Complete API docs
4. **Hotel_Management_API.postman_collection.json** - Postman collection
5. **QUICK_START.md** - This file
6. **ATLAS_SETUP_GUIDE.txt** - MongoDB Atlas setup
7. **fix-mongodb-replica.ps1** - Local MongoDB fix script

---

## 🐛 Troubleshooting

### Error: "Server selection timeout: No available servers"
**Problem:** MongoDB not configured as replica set  
**Solution:** Follow `ATLAS_SETUP_GUIDE.txt` or run `fix-mongodb-replica.ps1`

### Error: "User with this email already exists"
**Problem:** Trying to register with duplicate email  
**Solution:** Use different email or delete existing user

### Error: "Invalid email or password"
**Problem:** Wrong credentials  
**Solution:** Check email and password are correct

### Error: "Your account is inactive"
**Problem:** User account is deactivated  
**Solution:** Update user status to "active" via update API

### Error: "Invalid user ID"
**Problem:** User ID is not a valid MongoDB ObjectId  
**Solution:** Use valid 24-character hex string

---

## 📞 API Response Format

### Success Response:
```json
{
    "success": true,
    "data": { /* your data here */ },
    "message": "Operation successful",
    "statusCode": 200
}
```

### Error Response:
```json
{
    "success": false,
    "message": "Error description",
    "statusCode": 400
}
```

---

## 🎉 You're All Set!

Your User Management API is ready to use with:
- ✅ Complete CRUD operations
- ✅ Authentication (login/register)
- ✅ Security features
- ✅ Proper validation
- ✅ Error handling

**Next Steps:**
1. Fix MongoDB replica set issue (if not done)
2. Import Postman collection
3. Test all endpoints
4. Build your hotel management features!

---

## 📚 Additional Resources

- **Full API Docs:** `API_DOCUMENTATION.md`
- **Postman Collection:** `Hotel_Management_API.postman_collection.json`
- **MongoDB Setup:** `ATLAS_SETUP_GUIDE.txt`
- **Local MongoDB Fix:** `fix-mongodb-replica.ps1`

---

**Happy Coding! 🚀**

