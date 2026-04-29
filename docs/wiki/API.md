# NEXUS API Documentation

Complete API reference for NEXUS Support System.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

1. Register a user or login
2. Receive JWT token in response
3. Include token in subsequent requests

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

## HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required or failed
- `404` - Not Found: Resource not found
- `500` - Internal Server Error: Server error

---

## Authentication Endpoints

### Register User

Register a new user account.

**Endpoint:** `POST /users/register`

**Authentication:** Not required

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Unique username (3-30 characters) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 characters) |
| role | string | No | User role: `admin`, `support_agent`, `user` (default: `user`) |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "5f8d0d55b54764421b7156e4",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "User already exists"
}
```

---

### Login

Authenticate a user and receive JWT token.

**Endpoint:** `POST /users/login`

**Authentication:** Not required

**Request Body:**

```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Username |
| password | string | Yes | User password |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "5f8d0d55b54764421b7156e4",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### Get Current User

Get information about the authenticated user.

**Endpoint:** `GET /users/me`

**Authentication:** Required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0d55b54764421b7156e4",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "githubUsername": null,
    "createdAt": "2020-10-20T14:30:00.000Z"
  }
}
```

---

## Ticket Endpoints

### Create Ticket

Create a new support ticket.

**Endpoint:** `POST /tickets`

**Authentication:** Not required (can be configured as required)

**Request Body:**

```json
{
  "title": "Login page not responding",
  "description": "Users cannot access the login page after clicking the button",
  "priority": "high",
  "category": "bug",
  "tags": ["frontend", "auth", "urgent"],
  "createdBy": "John Doe",
  "createdByEmail": "john@example.com"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Ticket title |
| description | string | Yes | Detailed description |
| priority | string | No | Priority: `low`, `medium`, `high`, `critical` (default: `medium`) |
| category | string | No | Category (default: `general`) |
| tags | array | No | Array of tag strings |
| createdBy | string | Yes | Name of ticket creator |
| createdByEmail | string | Yes | Email of ticket creator |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0d55b54764421b7156e5",
    "ticketId": "TCK-K4J9X2M1",
    "title": "Login page not responding",
    "description": "Users cannot access the login page after clicking the button",
    "status": "open",
    "priority": "high",
    "category": "bug",
    "createdBy": "John Doe",
    "createdByEmail": "john@example.com",
    "assignedTo": null,
    "githubIssueNumber": null,
    "githubIssueUrl": null,
    "comments": [],
    "tags": ["frontend", "auth", "urgent"],
    "createdAt": "2020-10-20T14:30:00.000Z",
    "updatedAt": "2020-10-20T14:30:00.000Z",
    "resolvedAt": null
  }
}
```

---

### Get All Tickets

Retrieve all tickets with optional filtering.

**Endpoint:** `GET /tickets`

**Authentication:** Not required (can be configured as required)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: `open`, `in_progress`, `resolved`, `closed` |
| priority | string | No | Filter by priority: `low`, `medium`, `high`, `critical` |
| category | string | No | Filter by category |
| assignedTo | string | No | Filter by assignee |

**Example Request:**

```
GET /api/tickets?status=open&priority=high
```

**Response (200):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "5f8d0d55b54764421b7156e5",
      "ticketId": "TCK-K4J9X2M1",
      "title": "Login page not responding",
      "status": "open",
      "priority": "high",
      "createdAt": "2020-10-20T14:30:00.000Z"
    }
  ]
}
```

---

### Get Single Ticket

Retrieve a specific ticket by ticket ID.

**Endpoint:** `GET /tickets/:ticketId`

**Authentication:** Not required (can be configured as required)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Unique ticket identifier |

**Example Request:**

```
GET /api/tickets/TCK-K4J9X2M1
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0d55b54764421b7156e5",
    "ticketId": "TCK-K4J9X2M1",
    "title": "Login page not responding",
    "description": "Users cannot access the login page after clicking the button",
    "status": "open",
    "priority": "high",
    "category": "bug",
    "createdBy": "John Doe",
    "createdByEmail": "john@example.com",
    "assignedTo": null,
    "githubIssueNumber": null,
    "githubIssueUrl": null,
    "comments": [],
    "tags": ["frontend", "auth", "urgent"],
    "createdAt": "2020-10-20T14:30:00.000Z",
    "updatedAt": "2020-10-20T14:30:00.000Z",
    "resolvedAt": null
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Ticket not found"
}
```

---

### Update Ticket

Update an existing ticket.

**Endpoint:** `PUT /tickets/:ticketId`

**Authentication:** Not required (can be configured as required)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Unique ticket identifier |

**Request Body:**

```json
{
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "support_agent",
  "tags": ["frontend", "auth", "urgent", "assigned"]
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | No | Updated title |
| description | string | No | Updated description |
| status | string | No | Updated status |
| priority | string | No | Updated priority |
| category | string | No | Updated category |
| assignedTo | string | No | Assignee username |
| tags | array | No | Updated tags array |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0d55b54764421b7156e5",
    "ticketId": "TCK-K4J9X2M1",
    "title": "Login page not responding",
    "status": "in_progress",
    "priority": "high",
    "assignedTo": "support_agent",
    "updatedAt": "2020-10-20T15:00:00.000Z"
  }
}
```

---

### Delete Ticket

Delete a ticket permanently.

**Endpoint:** `DELETE /tickets/:ticketId`

**Authentication:** Not required (can be configured as required)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Unique ticket identifier |

**Response (200):**

```json
{
  "success": true,
  "data": {}
}
```

---

### Add Comment to Ticket

Add a comment to a ticket.

**Endpoint:** `POST /tickets/:ticketId/comments`

**Authentication:** Not required (can be configured as required)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Unique ticket identifier |

**Request Body:**

```json
{
  "author": "Support Agent",
  "authorEmail": "agent@example.com",
  "content": "This issue has been reproduced. Working on a fix."
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| author | string | Yes | Comment author name |
| authorEmail | string | Yes | Comment author email |
| content | string | Yes | Comment content |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0d55b54764421b7156e5",
    "ticketId": "TCK-K4J9X2M1",
    "comments": [
      {
        "author": "Support Agent",
        "authorEmail": "agent@example.com",
        "content": "This issue has been reproduced. Working on a fix.",
        "createdAt": "2020-10-20T15:30:00.000Z"
      }
    ]
  }
}
```

---

### Link to GitHub Issue

Manually link a ticket to a GitHub issue.

**Endpoint:** `POST /tickets/:ticketId/link-github`

**Authentication:** Not required (can be configured as required)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Unique ticket identifier |

**Request Body:**

```json
{
  "issueNumber": 123,
  "issueUrl": "https://github.com/owner/repo/issues/123"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| issueNumber | number | Yes | GitHub issue number |
| issueUrl | string | Yes | GitHub issue URL |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0d55b54764421b7156e5",
    "ticketId": "TCK-K4J9X2M1",
    "githubIssueNumber": 123,
    "githubIssueUrl": "https://github.com/owner/repo/issues/123"
  }
}
```

---

## GitHub Integration Endpoints

### Handle GitHub Webhook

Process GitHub webhook events (Issues, Issue Comments).

**Endpoint:** `POST /github/webhook`

**Authentication:** Webhook signature verification

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| X-GitHub-Event | Yes | Event type (issues, issue_comment) |
| X-Hub-Signature-256 | Yes | HMAC signature for verification |

**Webhook Events:**

- **issues**: `opened`, `closed`, `reopened`, `edited`, `labeled`
- **issue_comment**: `created`

**Response (200):**

```json
{
  "success": true
}
```

**Error Response (401):**

```json
{
  "error": "Invalid signature"
}
```

---

### Sync Ticket to GitHub

Sync a ticket to GitHub (create or update issue).

**Endpoint:** `POST /github/sync-ticket/:ticketId`

**Authentication:** Not required (can be configured as required)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Unique ticket identifier |

**Response (200) - New Issue Created:**

```json
{
  "success": true,
  "data": {
    "id": 123456789,
    "number": 123,
    "state": "open",
    "title": "Login page not responding",
    "body": "Users cannot access the login page after clicking the button",
    "html_url": "https://github.com/owner/repo/issues/123",
    "user": {
      "login": "bot-username"
    },
    "labels": [],
    "created_at": "2020-10-20T16:00:00.000Z"
  }
}
```

**Response (200) - Issue Updated:**

```json
{
  "success": true,
  "message": "Issue updated on GitHub"
}
```

**Error Response (500):**

```json
{
  "success": false,
  "error": "GitHub API error"
}
```

---

## Health Check

### Health Check

Check if the API server is running.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2020-10-20T16:30:00.000Z"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `E001` | Invalid authentication token |
| `E002` | Token expired |
| `E003` | User not found |
| `E004` | Invalid credentials |
| `E005` | Ticket not found |
| `E006` | Duplicate ticket ID |
| `E007` | Invalid ticket status |
| `E008` | Invalid priority level |
| `E009` | GitHub API error |
| `E010` | Webhook verification failed |
| `E011` | Database connection error |
| `E012` | Validation error |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers Returned:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

**Rate Limit Exceeded Response (429):**

```json
{
  "error": "Too many requests"
}
```

---

## Pagination

For endpoints that return lists, implement pagination:

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Example:**

```
GET /api/tickets?page=2&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## CORS

The API supports Cross-Origin Resource Sharing. Configure allowed origins in `server.js`.

Default configuration allows all origins in development. Restrict in production.

---

## Webhook Payload Examples

### Issues Opened

```json
{
  "action": "opened",
  "issue": {
    "id": 123456789,
    "number": 123,
    "title": "Bug report",
    "body": "Description of the bug",
    "state": "open",
    "user": {
      "login": "username",
      "id": 123456
    },
    "html_url": "https://github.com/owner/repo/issues/123"
  },
  "repository": {
    "name": "repo",
    "owner": {
      "login": "owner"
    }
  }
}
```

### Issue Comment Created

```json
{
  "action": "created",
  "issue": {
    "number": 123,
    "title": "Bug report"
  },
  "comment": {
    "id": 456789,
    "body": "Comment content",
    "user": {
      "login": "username"
    },
    "created_at": "2020-10-20T16:00:00.000Z"
  }
}
```

---

## Testing the API

### Using cURL

```bash
# Create ticket
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "description": "Test description",
    "createdBy": "Test User",
    "createdByEmail": "test@example.com"
  }'

# Get tickets
curl http://localhost:3000/api/tickets

# Get specific ticket
curl http://localhost:3000/api/tickets/TCK-ABC123

# Add comment
curl -X POST http://localhost:3000/api/tickets/TCK-ABC123/comments \
  -H "Content-Type: application/json" \
  -d '{
    "author": "User",
    "authorEmail": "user@example.com",
    "content": "Test comment"
  }'
```

### Using JavaScript/Fetch

```javascript
// Create ticket
fetch('http://localhost:3000/api/tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Ticket',
    description: 'Test description',
    createdBy: 'Test User',
    createdByEmail: 'test@example.com'
  })
})
  .then(response => response.json())
  .then(data => console.log(data));

// Get tickets
fetch('http://localhost:3000/api/tickets')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## Versioning

Current API version: v1.0.0

Include version in URL for future compatibility:

```
/api/v1/tickets
```

---

## Changelog

### v1.0.0 (Current)
- Initial release
- Basic CRUD operations for tickets
- GitHub webhook integration
- User authentication
- Comment system
