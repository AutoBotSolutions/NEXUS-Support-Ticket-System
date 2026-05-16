NEXUS On-Call Management Documentation

Overview

The NEXUS On-Call Management system provides comprehensive incident management, intelligent scheduling, and multi-channel notification capabilities. All on-call components are operational and have been thoroughly tested. Status: OPERATIONAL - 100% Complete & Debugged

Components

User Management

Status: Operational

Features: User profile management with skills and preferences
Availability tracking and scheduling
Role-based access control
Performance metrics and statistics
Contact information managementAPI Endpoints: GET /api/oncall/users                    - List all users
GET /api/oncall/user/:user

Id/stats       - User performance stats
POST /api/oncall/users                   - Create new user
PUT /api/oncall/user/:user

Id             - Update user
DELETE /api/oncall/user/:user

Id          - Delete user

Usage Examples: Get all users
curl http://127.0.0.1:41663/api/oncall/users

Get user stats
curl http://127.0.0.1:41663/api/oncall/user/user-1/stats

Create new user
curl -X POST http://127.0.0.1:41663/api/oncall/users \
-H "Content-Type: application/json" \
-d '{
"name": "John Doe",
"email": "john@nexus-support.com",
"role": "senior_engineer",
"skills": ["backend", "database"],
"phone": "+1234567890"
}'User Profile Structure:
{
"id": "user-1",
"name": "Alice Johnson",
"email": "alice@nexus-support.com",
"role": "senior_engineer",
"timezone": "America/New_York",
"skills": ["backend", "database", "security"],
"phone": "+1234567890",
"preferences": {
"preferred

Hours": {
"start": "09:00",
"end": "17:00"
},
"avoid

Days": ["saturday", "sunday"]
},
"current

Incidents": [],
"total

Incidents": 0,
"average

Resolution

Time": 0,
"on

Call

Hours": 0
}Incident Management

Status: Operational

Features: Complete incident lifecycle management
Incident assignment and tracking
Escalation policy enforcement
Resolution tracking and analysis
Incident collaboration toolsAPI Endpoints: GET /api/oncall/incidents               - List incidents
POST /api/oncall/incidents              - Create incident
GET /api/oncall/incident/:incident

Id    - Get incident details
POST /api/oncall/incident/:incident

Id/assign    - Assign incident
POST /api/oncall/incident/:incident

Id/acknowledge - Acknowledge incident
POST /api/oncall/incident/:incident

Id/resolve     - Resolve incident
POST /api/oncall/incident/:incident

Id/handoff     - Handoff incident
PUT /api/oncall/incident/:incident

Id    - Update incident
DELETE /api/oncall/incident/:incident

Id - Delete incident

Usage Examples: Create incident
curl -X POST http://127.0.0.1:41663/api/oncall/incidents \
-H "Content-Type: application/json" \
-d '{
"title": "Database Connection Issue",
"description": "Unable to connect to MongoDB",
"severity": "high",
"tags": ["database", "connectivity"]
}'Assign incident
curl -X POST http://127.0.0.1:41663/api/oncall/incident/incident-1/assign \
-H "Content-Type: application/json" \
-d '{"user

Id": "user-1"}'Resolve incident
curl -X POST http://127.0.0.1:41663/api/oncall/incident/incident-1/resolve \
-H "Content-Type: application/json" \
-d '{
"user

Id": "user-1",
"resolution

Details": "Fixed database connection string"
}'Incident Structure:
{
"id": "incident-1",
"title": "Database Connection Issue",
"description": "Unable to connect to MongoDB",
"severity": "high",
"status": "open",
"created

At": "2026-05-14T03:00:00.000Z",
"updated

At": "2026-05-14T03:00:00.000Z",
"assigned

To": "user-1",
"acknowledged

By": null,
"resolved

By": null,
"resolution

Details": null,
"tags": ["database", "connectivity"],
"related

Alerts": ["alert-1", "alert-2"],
"escalations": [],
"handoffs": []
}Scheduling System

Status: Operational

Features: Intelligent on-call rotation scheduling
Automatic shift generation
Conflict resolution and optimization
Schedule visibility and management
Holiday and availability handlingAPI Endpoints: GET /api/oncall/schedule                 - Get schedule
GET /api/oncall/schedule/:date          - Get schedule for specific date
POST /api/oncall/schedule               - Generate new schedule
PUT /api/oncall/schedule               - Update schedule
GET /api/oncall/current                 - Get current on-call person

Usage Examples: Get current schedule
curl http://127.0.0.1:41663/api/oncall/schedule

Get schedule for specific date
curl http://127.0.0.1:41663/api/oncall/schedule/2026-05-15Get current on-call person
curl http://127.0.0.1:41663/api/oncall/current

Generate new schedule
curl -X POST http://127.0.0.1:41663/api/oncall/schedule \
-H "Content-Type: application/json" \
-d '{
"start

Date": "2026-05-15",
"end

Date": "2026-05-22",
"shift

Type": "weekly"
}'Schedule Structure:
{
"date": "2026-05-14",
"shifts": [
{
"id": "shift-1",
"type": "primary",
"start

Time": "09:00",
"end

Time": "17:00",
"assigned

To": "user-1",
"backup": "user-2",
"status": "active"
},
{
"id": "shift-2",
"type": "secondary",
"start

Time": "17:00",
"end

Time": "09:00",
"assigned

To": "user-2",
"backup": "user-3",
"status": "standby"
}
]
}Escalation Management

Status: Operational

Features: Automated escalation policies
Multi-level escalation rules
Timeout-based escalation
Escalation tracking and reporting
Custom escalation workflowsAPI Endpoints: GET /api/oncall/escalation-policies      - List escalation policies
POST /api/oncall/escalation-policies      - Create escalation policy
GET /api/oncall/escalation-policy/:id    - Get escalation policy
PUT /api/oncall/escalation-policy/:id    - Update escalation policy
DELETE /api/oncall/escalation-policy/:id - Delete escalation policy

Usage Examples: Get escalation policies
curl http://127.0.0.1:41663/api/oncall/escalation-policies

Create escalation policy
curl -X POST http://127.0.0.1:41663/api/oncall/escalation-policies \
-H "Content-Type: application/json" \
-d '{
"name": "Critical Incident Escalation",
"rules": [
{
"condition": "severity == critical",
"timeout": 300,
"action": "escalate_to_manager"
}
]
}'Notification System

Status: Operational

Features: Multi-channel notifications (Email, Slack, Pager

Duty, SMS)
Notification templates and customization
Notification history and tracking
Delivery status monitoring
Notification preferences managementAPI Endpoints: GET /api/oncall/notification-channels    - List notification channels
POST /api/oncall/notifications           - Send notification
GET /api/oncall/notifications/history    - Notification history
GET /api/oncall/notification-preferences - User notification preferences
PUT /api/oncall/notification-preferences - Update notification preferences

Usage Examples: Get notification channels
curl http://127.0.0.1:41663/api/oncall/notification-channels

Send notification
curl -X POST http://127.0.0.1:41663/api/oncall/notifications \
-H "Content-Type: application/json" \
-d '{
"user

Id": "user-1",
"type": "incident_assigned",
"message": "New incident assigned: Database Connection Issue",
"channels": ["email", "slack"]
}'Configuration

Escalation Policies

Define escalation rules for different incident types:{
"name": "Critical Incident Escalation",
"description": "Escalation policy for critical incidents",
"rules": [
{
"condition": "severity == 'critical'",
"timeout": 300,
"action": "escalate_to_manager",
"notifications": ["pagerduty", "slack"]
},
{
"condition": "age > 3600 AND status == 'open'",
"timeout": 600,
"action": "escalate_to_director",
"notifications": ["email", "pagerduty"]
}
]
}Notification Channels

Configure notification channels:{
"email": {
"enabled": true,
"smtp_host": "smtp.gmail.com",
"smtp_port": 587,
"username": "alerts@nexus-support.com",
"templates": {
"incident_assigned": "templates/incident_assigned.html",
"incident_escalated": "templates/incident_escalated.html"
}
},
"slack": {
"enabled": true,
"webhook_url": "https://hooks.slack.com/services/...",
"channel": "#oncall",
"username": "NEXUS On-Call Bot"
},
"pagerduty": {
"enabled": true,
"integration_key": "your-pagerduty-key",
"severity_mapping": {
"critical": "critical",
"high": "high",
"medium": "warning",
"low": "info"
}
}
}Scheduling Rules

Configure scheduling behavior:{
"shift

Types": {
"primary": {
"duration": 8,
"start_time": "09:00",
"end_time": "17:00",
"days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
},
"secondary": {
"duration": 16,
"start_time": "17:00",
"end_time": "09:00",
"days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
}
},
"rotation": {
"type": "weekly",
"auto_generate": true,
"conflict_resolution": "auto"
}
}Integration

Alert Management

Integrate with alerting systems:// Create incident from alert
const alert = {
title: "High CPU Usage",
description: "CPU usage exceeded 90%",
severity: "high",
source: "prometheus"
};// Create incident
const incident = await on

Call

Management.create

Incident(alert);ITSM Integration

Integrate with ITSM systems:// Sync incident with ITSM
const itsm

Incident = {
incident

Id: incident.id,
title: incident.title,
description: incident.description,
severity: incident.severity,
assigned

To: incident.assigned

To
};// Send to ITSM
await itsm

Client.create

Incident(itsm

Incident);Calendar Integration

Integrate with calendar systems:// Export schedule to calendar
const schedule = await on

Call

Management.get

Schedule();
const calendar

Events = schedule

ToCalendar

Events(schedule);// Add to Google Calendar
await calendar

Client.add

Events(calendar

Events);Best Practices

Incident Management
Clear Classification: Use consistent severity levels
Proper Assignment: Assign to appropriate skill sets
Timely Acknowledgment: Acknowledge incidents promptly
Documentation: Document resolution steps
Post-Mortem: Conduct post-incident reviews

Scheduling
Fair Rotation: Ensure equitable on-call distribution
Skill Matching: Match incidents with appropriate skills
Availability: Respect user preferences and availability
Backup Coverage: Always have backup on-call personnel
Holiday Coverage: Plan for holiday and vacation periods

Escalation
Clear Policies: Define escalation triggers and timeouts
Multiple Channels: Use multiple notification channels
Context Preservation: Maintain incident context during escalation
Follow-up: Ensure proper handoff during escalation
Review: Regularly review escalation effectiveness

Troubleshooting

Common Issues

Incident Not Assigned: Check user availability
Verify skill matching
Review scheduling conflicts

Escalation Not Triggered: Check escalation rules
Verify timeout configuration
Review notification channels

Notifications Not Sent: Check channel configuration
Verify delivery settings
Review notification history

Health Checks

Monitor on-call system health: Check current on-call
curl http://127.0.0.1:41663/api/oncall/current

Check schedule
curl http://127.0.0.1:41663/api/oncall/schedule

Check active incidents
curl http://127.0.0.1:41663/api/oncall/incidents?status=open

Debugging

Enable debug logging:
const on

Call

Config = {
debug: true,
log

Level: 'debug',
log

Notifications: true,
log

Escalations: true
};Metrics

On-Call Metrics
oncall_incidents_total - Total incidents created
oncall_incidents_by_severity - Incidents by severity level
oncall_incidents_by_status - Incidents by status
oncall_response_time_seconds - Time to acknowledge incidents

User Metrics
oncall_user_shifts_total - Total shifts worked
oncall_user_incidents_total - Incidents assigned to user
oncall_user_resolution_time_seconds - Average resolution time
oncall_user_satisfaction_score - User satisfaction scores

Escalation Metrics
oncall_escalations_total - Total escalations
oncall_escalations_by_reason - Escalations by reason
oncall_escalation_time_seconds - Time to escalation
oncall_notification_deliveries_total - Notifications delivered

Security

Data Protection
Personal Information: Protect user contact information
Incident Data: Secure sensitive incident details
Access Control: Implement role-based access
Audit Logging: Log all on-call operations

Privacy
Contact Information: Limit access to contact details
Incident Details: Redact sensitive information
User Preferences: Protect user privacy settings
Communication Logs: Secure communication logs

Future Enhancements

Planned Features
AI-Powered Assignment: Machine learning for incident assignment
Predictive Scheduling: Predict optimal scheduling patterns
Mobile App: Native mobile application
Voice Notifications: Voice call notifications
Integration Hub: Centralized integration platform

Scalability
Multi-Region: Global on-call coordination
Team Management: Multi-team on-call coordination
Advanced Analytics: Advanced on-call analytics
Automation: Increased automation capabilities