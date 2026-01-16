# Guard Up MVP - Backend Integration Guide

## Overview

This document provides a comprehensive guide to the full-stack backend implementation for the Guard Up security guard management platform.

## Architecture

The Guard Up backend follows a three-tier architecture:

```
Frontend (React) → API Server (Hono/Deno) → Database (Supabase KV Store + Storage)
```

### Components

1. **Authentication & Authorization** (`/supabase/functions/server/auth.tsx`)
   - Supabase Auth integration
   - Role-based access control (RBAC)
   - Session management
   - JWT token validation

2. **API Routes** (`/supabase/functions/server/routes.tsx`)
   - RESTful API endpoints for all modules
   - Guards/Workforce Management
   - Reports System
   - Scheduling
   - Incidents
   - Vault Documents
   - Sites/Operations
   - Dashboard Metrics

3. **Data Persistence** (`/supabase/functions/server/data.tsx`)
   - KV store schema design
   - Data initialization and seeding
   - Helper functions for data operations

4. **File Storage** (`/supabase/functions/server/storage.tsx`)
   - Supabase Storage integration
   - File upload/download
   - Signed URL generation
   - File management utilities

5. **Frontend API Client** (`/utils/api.ts`)
   - Centralized API client
   - TypeScript-typed endpoints
   - Token management
   - Error handling

## Authentication Flow

### 1. Sign Up

```typescript
import { api } from './utils/api';

const result = await api.signUp(
  'john@example.com',
  'password123',
  'John Smith',
  'SECURITY_ADMIN',
  undefined // guardId (optional, for GUARD role)
);

if (result.success) {
  console.log('User created:', result.user);
}
```

### 2. Sign In

```typescript
const result = await api.signIn('john@example.com', 'password123');

if (result.success) {
  // Access token is automatically stored
  console.log('Logged in:', result.user);
  console.log('Role:', result.user.role);
}
```

### 3. Get Session

```typescript
const session = await api.getSession();

if (session.success) {
  console.log('Current user:', session.user);
}
```

### 4. Sign Out

```typescript
await api.signOut();
// Access token is automatically cleared
```

## User Roles

The system supports three role types with strict access control:

1. **SECURITY_ADMIN** - Full access to all features
   - Manage guards
   - Review and approve reports
   - Schedule shifts
   - View all data
   - Access vault documents

2. **GUARD** - Limited access for field personnel
   - View own schedule
   - Submit reports
   - Clock in/out
   - View own reports

3. **COMPANY_ADMIN** - Reserved for future use

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Create new user account | No |
| POST | `/auth/signin` | Sign in existing user | No |
| GET | `/auth/session` | Get current session | Yes |
| POST | `/auth/signout` | Sign out user | Yes |

### Guards/Workforce Management

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/guards` | Get all guards | Yes | Any |
| GET | `/guards/:id` | Get guard by ID | Yes | Any |
| POST | `/guards` | Create new guard | Yes | SECURITY_ADMIN |
| PUT | `/guards/:id` | Update guard | Yes | SECURITY_ADMIN |
| DELETE | `/guards/:id` | Delete guard | Yes | SECURITY_ADMIN |
| POST | `/guards/:id/clock-in` | Clock in guard | Yes | Any |
| POST | `/guards/:id/clock-out` | Clock out guard | Yes | Any |
| GET | `/guards/active/all` | Get active guards | Yes | Any |

### Reports

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/reports` | Get all reports (filtered by role) | Yes | Any |
| GET | `/reports/:id` | Get report by ID | Yes | Any |
| POST | `/reports` | Create new report | Yes | Any |
| PUT | `/reports/:id` | Update report | Yes | Any* |
| POST | `/reports/:id/approve` | Approve report | Yes | SECURITY_ADMIN |
| POST | `/reports/:id/reject` | Reject report | Yes | SECURITY_ADMIN |
| DELETE | `/reports/:id` | Delete report | Yes | SECURITY_ADMIN |

*Guards can only edit their own pending reports

### Scheduling

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/shifts` | Get all shifts (filtered by role) | Yes | Any |
| POST | `/shifts` | Create new shift | Yes | SECURITY_ADMIN |
| PUT | `/shifts/:id` | Update shift | Yes | SECURITY_ADMIN |
| DELETE | `/shifts/:id` | Delete shift | Yes | SECURITY_ADMIN |
| GET | `/shifts/unassigned/all` | Get unassigned shifts | Yes | SECURITY_ADMIN |
| POST | `/shifts/unassigned` | Create unassigned shift | Yes | SECURITY_ADMIN |

### Incidents

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/incidents` | Get all incidents | Yes | Any |
| POST | `/incidents` | Create new incident | Yes | Any |
| PUT | `/incidents/:id` | Update incident | Yes | Any |
| POST | `/incidents/:id/resolve` | Resolve incident | Yes | Any |

### Vault Documents

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/vault/documents` | Get all vault documents | Yes | SECURITY_ADMIN |
| POST | `/vault/documents` | Create vault document entry | Yes | SECURITY_ADMIN |

### Sites/Operations

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/sites` | Get all sites | Yes | Any |
| PUT | `/sites/:id` | Update site status | Yes | Any |

### Dashboard/Metrics

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/dashboard/metrics` | Get dashboard metrics | Yes | Any |

### File Storage

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/upload` | Upload file (multipart) | Yes | Any |
| POST | `/upload/base64` | Upload file from base64 | Yes | Any |
| POST | `/files/signed-url` | Get signed URL for file | Yes | Any |
| GET | `/files/:folder` | List files in folder | Yes | Any |
| DELETE | `/files` | Delete file | Yes | Any |

## Usage Examples

### Create a Guard

```typescript
import { api } from './utils/api';

const newGuard = await api.createGuard({
  name: 'John Doe',
  badgeId: 'BADGE-1030',
  role: 'Guard',
  status: 'active',
  phone: '(555) 999-8888',
  email: 'john.doe@example.com',
  licenseExpiry: 'Dec 31, 2025',
  certExpiry: 'Dec 31, 2025',
  location: 'Building A',
  shiftsThisWeek: 0,
  hoursThisWeek: 0,
  roleClassification: 'Guard - Armed',
  primarySite: 'Building A'
});

console.log('Created guard:', newGuard);
```

### Submit a Report

```typescript
const newReport = await api.createReport({
  reportCode: 'IR-2026-1',
  type: 'Incident',
  reportType: 'incident',
  priority: 'high',
  guardName: 'John Smith',
  site: 'Building A',
  content: 'Security breach detected at main entrance',
  incidentType: 'security-breach',
  location: 'Main Entrance'
});

console.log('Report submitted:', newReport);
```

### Approve a Report

```typescript
// Only SECURITY_ADMIN can approve
const approved = await api.approveReport(reportId, 'Acme Corporation');
console.log('Report approved:', approved);
```

### Create a Shift

```typescript
const newShift = await api.createShift({
  guardId: 1,
  guardName: 'John Smith',
  dayOfWeek: 'Monday',
  date: 'Jan 13, 2026',
  startTime: '08:00 AM',
  endTime: '04:00 PM',
  site: 'Building A',
  hours: 8,
  instructions: 'Main entrance patrol'
});

console.log('Shift created:', newShift);
```

### Upload a File

```typescript
// Method 1: Upload from File object
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await api.uploadFile(file, 'incident-photos');
console.log('File uploaded:', result.file.url);

// Method 2: Upload from base64
const base64Data = 'data:image/png;base64,iVBORw0KG...';
const result = await api.uploadFileBase64(
  base64Data,
  'photo.png',
  'image/png',
  'incident-photos'
);
console.log('File uploaded:', result.file.url);
```

### Get Dashboard Metrics

```typescript
const metrics = await api.getDashboardMetrics();
console.log('Dashboard metrics:', metrics);
// {
//   totalGuards: 6,
//   activeGuards: 3,
//   totalReports: 15,
//   pendingReports: 5,
//   openIncidents: 2,
//   upcomingShifts: 10
// }
```

## Data Storage Schema

The backend uses Supabase KV store with the following key prefixes:

- `user:{userId}` - User profiles
- `user:email:{email}` - Email to user ID mapping
- `guard:{id}` - Guard records
- `report:{id}` - Report records
- `shift:{id}` - Scheduled shifts
- `unassigned-shift:{id}` - Unassigned shifts
- `incident:{id}` - Incident logs
- `site:{id}` - Site data
- `vault-doc:{id}` - Vault document metadata
- `clock-in:{guardId}` - Active clock-in records

## File Storage Structure

Files are stored in Supabase Storage bucket: `make-e7fd76e8-guardup-files`

Folder structure:
```
/general          - Miscellaneous files
/incident-photos  - Incident report photos
/report-attachments - Report attachments
/licenses         - License documents
/certifications   - Certification documents
/vault-documents  - Vault documents
```

All files are stored in a private bucket and accessed via signed URLs with 1-hour expiry.

## Error Handling

All API endpoints return consistent error responses:

```typescript
{
  success: false,
  error: "Error message description"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad request (missing required fields)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Internal server error

## Security Considerations

1. **Authentication Required**: Most endpoints require a valid JWT token
2. **Role-Based Access**: Endpoints enforce role permissions at the middleware level
3. **Data Isolation**: Guards only see their own reports and shifts
4. **Private Storage**: All files stored in private bucket with signed URLs
5. **Input Validation**: Server validates all input data
6. **SQL Injection Prevention**: KV store prevents SQL injection
7. **CORS Enabled**: Server accepts requests from any origin (configure for production)

## Integration Checklist

To integrate the backend with your frontend:

- [ ] Import `api` client from `/utils/api.ts`
- [ ] Implement sign up/sign in flows
- [ ] Store and validate access tokens
- [ ] Replace mock data with API calls
- [ ] Handle loading and error states
- [ ] Implement role-based UI rendering
- [ ] Test all CRUD operations
- [ ] Test file uploads
- [ ] Test authorization restrictions
- [ ] Add error logging and monitoring

## Testing the Backend

You can test the backend using curl:

```bash
# Health check
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e7fd76e8/health

# Sign up
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e7fd76e8/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123","name":"Admin User","role":"SECURITY_ADMIN"}'

# Sign in
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e7fd76e8/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get guards (requires auth token from sign in response)
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e7fd76e8/guards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Deployment Notes

The backend is automatically deployed to Supabase Edge Functions. No additional deployment steps required.

## Performance Considerations

1. **KV Store Queries**: Queries use prefix matching for efficient lookups
2. **File Storage**: Files served via CDN with signed URLs
3. **Caching**: Consider implementing Redis for frequently accessed data
4. **Batch Operations**: Use batch endpoints for bulk operations
5. **Pagination**: Implement pagination for large datasets (future enhancement)

## Future Enhancements

- [ ] Implement pagination for large datasets
- [ ] Add real-time subscriptions using Supabase Realtime
- [ ] Implement caching layer for frequently accessed data
- [ ] Add rate limiting for API endpoints
- [ ] Implement audit logging for all operations
- [ ] Add data export functionality
- [ ] Implement backup and restore procedures
- [ ] Add email notifications for events
- [ ] Implement WebSocket for real-time updates
- [ ] Add analytics and reporting endpoints

## Support

For questions or issues, refer to:
- Supabase Documentation: https://supabase.com/docs
- Hono Documentation: https://hono.dev
- Guard Up GitHub Repository: [Link to repo]
