# NEXUS Frequently Asked Questions

Frequently asked questions about NEXUS Support System.

## General Questions

### What is the NEXUS Support Ticket System?

A full-featured support ticket system with MongoDB integration and GitHub issue synchronization. It allows you to manage support tickets and sync them with GitHub issues for enhanced collaboration.

### What are the system requirements?

- Node.js 14.0.0 or higher
- MongoDB 4.4 or higher
- 2GB RAM minimum
- 20GB storage minimum

### Is this free to use?

Yes, the system is open-source and free to use. You'll need:
- Free MongoDB (local or MongoDB Atlas free tier)
- GitHub account (free)
- Hosting (varies by provider)

---

## Installation and Setup

### How do I install the system?

See the [Installation Guide](INSTALLATION.md) for detailed step-by-step instructions.

### Can I use this without GitHub?

Yes, you can use the system without GitHub integration. The GitHub features are optional.

### Do I need to know how to code?

Basic knowledge of command line and configuration is helpful, but no coding is required for basic usage.

---

## Configuration

### Where do I set environment variables?

Copy `.env.example` to `.env` and edit the file with your configuration.

### What is the webhook secret for?

The webhook secret secures GitHub webhooks. It verifies that webhooks are actually from GitHub.

### How do I generate secure secrets?

Use OpenSSL:
```bash
openssl rand -hex 32
```

### Can I change the port?

Yes, set `PORT` in your `.env` file.

---

## Database

### What database does this use?

MongoDB with Mongoose ODM.

### Can I use MongoDB Atlas?

Yes, update `MONGODB_URI` in `.env` with your Atlas connection string.

### How do I backup the database?

See the [Deployment Guide](DEPLOYMENT.md) for backup strategies.

### Can I use a different database?

Not currently. The system is designed for MongoDB.

---

## GitHub Integration

### How does GitHub integration work?

The system uses GitHub webhooks to:
- Create tickets from GitHub issues
- Sync comments between tickets and GitHub
- Update ticket status based on issue state

### Do I need a GitHub Personal Access Token?

Yes, for syncing tickets to GitHub. See [Installation Guide](INSTALLATION.md) for how to create one.

### What GitHub events are supported?

- Issues: opened, closed, reopened, edited, labeled
- Issue comments: created

### Can I sync existing tickets to GitHub?

Yes, use the "Sync with GitHub" button on ticket details or the API endpoint.

### What if I don't want GitHub integration?

Simply don't configure the GitHub environment variables. The system will work without them.

---

## Authentication

### Is authentication required?

Authentication is optional and can be configured per endpoint.

### What authentication method is used?

JWT (JSON Web Tokens) with bcrypt password hashing.

### What user roles are available?

- `admin`: Full access
- `support_agent`: Can manage tickets
- `user`: Can create tickets

### How do I create an admin user?

Register a user with role "admin" via the API or database.

---

## Usage

### How do I create a ticket?

Use the web interface at `http://localhost:3000` or the API endpoint `POST /api/tickets`.

### Can I assign tickets to users?

Yes, update the `assignedTo` field when updating a ticket.

### How do I add comments to tickets?

Use the web interface or the API endpoint `POST /api/tickets/:ticketId/comments`.

### Can I filter tickets?

Yes, filter by status, priority, category, and assignee via query parameters.

### What are the ticket statuses?

- `open`: New ticket
- `in_progress`: Being worked on
- `resolved`: Issue resolved
- `closed`: Ticket closed

### What are the priority levels?

- `low`: Low priority
- `medium`: Normal priority
- `high`: High priority
- `critical`: Urgent priority

---

## Development

### How do I contribute?

See the [Developer Guide](DEVELOPER.md) for contribution guidelines.

### Can I customize the frontend?

Yes, edit `public/index.html`. It's vanilla HTML/CSS/JavaScript.

### How do I add new API endpoints?

See the [Developer Guide](DEVELOPER.md) for instructions.

### What's the project structure?

See the [Developer Guide](DEVELOPER.md) for architecture overview.

---

## Deployment

### Where can I deploy?

- VPS (DigitalOcean, Linode, AWS EC2)
- PaaS (Heroku, Render, Railway)
- Container services (Docker, AWS ECS)

### Do I need SSL/HTTPS?

Highly recommended for production. See [Deployment Guide](DEPLOYMENT.md).

### How do I set up SSL?

Use Let's Encrypt with Certbot. See [Deployment Guide](DEPLOYMENT.md).

### Can I use Docker?

Yes, see the [Deployment Guide](DEPLOYMENT.md) for Docker setup.

---

## Troubleshooting

### The server won't start

Check:
- MongoDB is running
- Port is not in use
- Environment variables are set
- Dependencies are installed

### Webhooks aren't working

Check:
- Webhook URL is publicly accessible
- Webhook secret matches
- GitHub webhook delivery logs
- Server logs

### Database connection fails

Check:
- MongoDB is running
- Connection string is correct
- Firewall allows connection
- IP whitelist (for Atlas)

### See more issues?

See the [Troubleshooting Guide](TROUBLESHOOTING.md).

---

## Security

### Is this secure for production?

Yes, when properly configured with:
- Strong secrets
- SSL/HTTPS
- Authentication enabled
- Firewall configured
- Regular updates

### Should I commit .env file?

No, never commit `.env`. It's in `.gitignore` by default.

### How do I secure the database?

- Enable authentication
- Use strong passwords
- Use TLS/SSL
- Restrict network access
- Regular backups

---

## Licensing

### What license is this under?

MIT License. See LICENSE file for details.

### Can I use this commercially?

Yes, MIT license allows commercial use.

### Do I need to attribute the original authors?

No, MIT license doesn't require attribution, but it's appreciated.

---

## Support

### Where can I get help?

- Documentation in `/docs` directory
- GitHub Issues
- Contact maintainers

### How do I report a bug?

Open a GitHub Issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### How do I request a feature?

Open a GitHub Issue with the "enhancement" label.

---

## Performance

### How many tickets can this handle?

Depends on:
- Server resources
- Database configuration
- Indexing strategy
- Caching implementation

With proper setup, thousands of tickets.

### How do I improve performance?

- Add database indexes
- Implement pagination
- Use caching
- Enable compression
- Use CDN for static assets

---

## Integration

### Can I integrate with other services?

Yes, you can add custom integrations by:
- Adding new controllers
- Using webhooks
- API calls to other services

### Can I use this with existing systems?

Yes, via API endpoints. See [API Documentation](API.md).

---

## Updates

### How do I update to the latest version?

```bash
git pull origin main
npm install
pm2 restart nexus
```

### Will updates break my data?

No, database schema is backward compatible. Always backup before updating.

### How often is this updated?

As needed for bug fixes and features. Check GitHub for release history.

---

## Miscellaneous

### Can I change the theme?

Yes, edit the CSS in `public/index.html`.

### Can I add custom fields to tickets?

Yes, modify the Ticket model in `models/Ticket.js`.

### Is there an admin panel?

Not currently, but you can build one using the API.

### Can I export tickets?

Yes, via API or directly from MongoDB.

### Can I import tickets from other systems?

Yes, create a script to import via API or directly to MongoDB.
