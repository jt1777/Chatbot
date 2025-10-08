# Testing the Admin Interface

## Quick Start

1. **Register an Admin Account**
   - Go to `/admin/register`
   - Create an account with:
     - Email: `admin@test.com`
     - Password: `password123`
     - Organization: `Test Organization`
   - You'll be automatically logged in and redirected to the admin interface

2. **Login (if you already have an account)**
   - Go to `/admin/login`
   - Use your existing credentials
   - You'll be redirected to the admin interface

3. **Test Document Management**
   - Navigate to the Documents tab
   - Try uploading a PDF file
   - Try scraping a website
   - Test document deletion
   - All operations use real JWT authentication

## Authentication Flow

The admin interface uses JWT (JSON Web Token) authentication:

1. **Registration/Login** - Creates a JWT token with user info
2. **Token Storage** - JWT stored in localStorage
3. **API Calls** - All requests include `Authorization: Bearer <token>`
4. **Auto-logout** - Expired tokens automatically redirect to login
5. **Session Management** - Tokens persist across browser sessions

## API Endpoints

The admin interface connects to these backend endpoints:

- **Auth**: `https://askakasha-production.up.railway.app/api/auth/admin/`
- **Documents**: `https://askakasha-production.up.railway.app/api/documents/`
- **Organizations**: `https://askakasha-production.up.railway.app/api/organizations/`

## Troubleshooting

### "Session expired" errors
- Clear localStorage: `localStorage.clear()`
- Refresh the page and login again

### Document upload fails
- Check that the file is a supported format (PDF, TXT)
- Ensure the backend is running and accessible

### Web scraping fails
- Verify the URL is accessible
- Check that the URL doesn't require authentication

## Development

To run locally:
```bash
cd packages/landing-page
npm run dev
```

The app will be available at `http://localhost:3000`
