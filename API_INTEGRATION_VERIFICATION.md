# API Integration Verification Guide

## ✅ API Integration Status

The login API is **fully integrated** and ready to call your backend. Here's how to verify it's working:

## 🔍 How to Verify API is Being Called

### 1. Check Browser Console

When you submit the login form, you should see these console logs:

```
🌐 API Base URL: http://localhost:3000/api
🔧 Environment Variable VITE_API_BASE_URL: Not set (using default)
🔐 Attempting login with: { email: "your-email@example.com" }
📡 API Endpoint: /login
🚀 API Request: {
  method: "POST",
  url: "http://localhost:3000/api/login",
  data: { email: "...", password: "..." },
  headers: { ... }
}
```

### 2. Check Network Tab

1. Open your browser's Developer Tools (F12)
2. Go to the **Network** tab
3. Submit the login form
4. Look for a request to `http://localhost:3000/api/login`
5. Check:
   - **Status**: Should be 200 for success, or 400/401 for errors
   - **Request Payload**: Should contain `{ email, password }`
   - **Response**: Should contain your backend's response

### 3. Verify Backend is Running

Make sure your backend server is running on `http://localhost:3000` and the login endpoint is available at `/api/login`.

## 🔧 Configuration

### Default API URL
The default API base URL is: `http://localhost:3000/api`

### Change API URL

**Option 1: Environment Variable (Recommended)**

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Option 2: Direct Code Change**

Edit `src/services/api.config.ts`:

```typescript
export const API_BASE_URL = 'http://your-backend-url:port/api';
```

## 📋 API Request Details

### Login Request
- **Method**: POST
- **URL**: `http://localhost:3000/api/login`
- **Headers**: 
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "ali12@example.com",
    "password": "123456"
  }
  ```

### Expected Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "Ali",
    "email": "ali12@example.com",
    "phone": "03001234567",
    "role": "admin",
    "status": "active",
    "createdAt": "2025-11-05T13:05:34.296Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "statusCode": 200
}
```

## 🐛 Troubleshooting

### Issue: API not being called

**Check:**
1. ✅ Is your backend server running?
2. ✅ Is the URL correct in `api.config.ts`?
3. ✅ Check browser console for errors
4. ✅ Check Network tab for failed requests

### Issue: CORS Error

If you see CORS errors, your backend needs to allow requests from your frontend origin. Add CORS headers in your backend:

```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server URL
  credentials: true
}));
```

### Issue: Network Error

If you see "Network error" in console:
1. Check if backend is running
2. Check if URL is correct
3. Check firewall/antivirus settings
4. Try accessing the API directly in browser: `http://localhost:3000/api/login`

## 📝 Files Involved

- `src/services/api.config.ts` - API base URL and routes
- `src/services/apiClient.ts` - Axios client with interceptors
- `src/services/auth.service.ts` - Login function
- `src/services/auth.storage.ts` - Token storage
- `src/pages/Login.tsx` - Login form component

## ✅ Verification Checklist

- [ ] Backend server is running
- [ ] API URL is correct in `api.config.ts`
- [ ] Browser console shows API request logs
- [ ] Network tab shows the request
- [ ] Response is received from backend
- [ ] Token is stored in localStorage after successful login

## 🚀 Next Steps

Once login is working:
1. Token is automatically stored in localStorage
2. Token is automatically added to all subsequent API requests
3. You can create other services (hostel, tenant, etc.) using the same pattern

