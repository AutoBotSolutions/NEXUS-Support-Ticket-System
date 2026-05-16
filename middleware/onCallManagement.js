/**
 * NEXUS On-Call Management System
 * Handles on-call scheduling, rotation, and incident management
 */

class OnCallManagement {
    constructor() {
        this.schedules = new Map();
        this.incidents = new Map();
        this.users = new Map();
        this.escalationPolicies = new Map();
        this.notificationChannels = new Map();
        this.handoffHistory = [];
        
        this.initializeDefaultData();
    }

    initializeDefaultData() {
        // Initialize default users
        this.addUser({
            id: 'user-1',
            name: 'Alice Johnson',
            email: 'alice@nexus-support.com',
            phone: '+1234567890',
            role: 'senior_engineer',
            timezone: 'America/New_York',
            skills: ['backend', 'database', 'security'],
            maxConcurrentShifts: 2,
            preferences: {
                shiftLength: 8, // hours
                preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                avoidDays: ['saturday', 'sunday'],
                preferredHours: { start: 9, end: 17 }
            }
        });

        this.addUser({
            id: 'user-2',
            name: 'Bob Smith',
            email: 'bob@nexus-support.com',
            phone: '+1234567891',
            role: 'senior_engineer',
            timezone: 'America/New_York',
            skills: ['frontend', 'api', 'performance'],
            maxConcurrentShifts: 2,
            preferences: {
                shiftLength: 8,
                preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                avoidDays: ['saturday', 'sunday'],
                preferredHours: { start: 9, end: 17 }
            }
        });

        this.addUser({
            id: 'user-3',
            name: 'Charlie Davis',
            email: 'charlie@nexus-support.com',
            phone: '+1234567892',
            role: 'lead_engineer',
            timezone: 'America/New_York',
            skills: ['backend', 'database', 'security', 'frontend'],
            maxConcurrentShifts: 3,
            preferences: {
                shiftLength: 12,
                preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                avoidDays: [],
                preferredHours: { start: 8, end: 20 }
            }
        });

        // Initialize default escalation policies
        this.addEscalationPolicy({
            id: 'default_critical',
            name: 'Default Critical Alert Escalation',
            severity: 'critical',
            rules: [
                { level: 1, timeout: 300, action: 'notify_oncall' },
                { level: 2, timeout: 600, action: 'notify_secondary' },
                { level: 3, timeout: 900, action: 'notify_manager' },
                { level: 4, timeout: 1800, action: 'notify_all' }
            ]
        });

        this.addEscalationPolicy({
            id: 'default_warning',
            name: 'Default Warning Alert Escalation',
            severity: 'warning',
            rules: [
                { level: 1, timeout: 1800, action: 'notify_oncall' },
                { level: 2, timeout: 3600, action: 'notify_secondary' },
                { level: 3, timeout: 7200, action: 'notify_manager' }
            ]
        });

        // Initialize notification channels
        this.addNotificationChannel({
            id: 'email',
            name: 'Email',
            type: 'email',
            enabled: true,
            config: {
                smtp_host: 'smtp.gmail.com',
                smtp_port: 587,
                from: 'alerts@nexus-support.com'
            }
        });

        this.addNotificationChannel({
            id: 'sms',
            name: 'SMS',
            type: 'sms',
            enabled: true,
            config: {
                provider: 'twilio',
                from_number: '+1234567890'
            }
        });

        this.addNotificationChannel({
            id: 'slack',
            name: 'Slack',
            type: 'slack',
            enabled: true,
            config: {
                webhook_url: process.env.SLACK_WEBHOOK_URL,
                channel: '#alerts'
            }
        });

        this.addNotificationChannel({
            id: 'pagerduty',
            name: 'PagerDuty',
            type: 'pagerduty',
            enabled: true,
            config: {
                integration_key: process.env.PAGERDUTY_INTEGRATION_KEY
            }
        });

        // Generate initial schedule
        this.generateSchedule(new Date(), 30); // Generate 30 days of schedule
    }

    addUser(userData) {
        const user = {
            ...userData,
            createdAt: new Date().toISOString(),
            currentIncidents: [],
            totalIncidents: 0,
            averageResolutionTime: 0,
            onCallHours: 0,
            lastOnCall: null
        };
        
        this.users.set(userData.id, user);
        return user;
    }

    addEscalationPolicy(policyData) {
        const policy = {
            ...policyData,
            createdAt: new Date().toISOString(),
            active: true
        };
        
        this.escalationPolicies.set(policyData.id, policy);
        return policy;
    }

    addNotificationChannel(channelData) {
        const channel = {
            ...channelData,
            createdAt: new Date().toISOString(),
            lastUsed: null
        };
        
        this.notificationChannels.set(channelData.id, channel);
        return channel;
    }

    generateSchedule(startDate, days) {
        const schedule = [];
        const availableUsers = Array.from(this.users.values());
        
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            // Generate 24-hour schedule for this day
            const daySchedule = this.generateDaySchedule(currentDate, availableUsers);
            schedule.push(...daySchedule);
        }
        
        // Store the schedule
        this.schedules.set('current', {
            id: 'schedule-' + Date.now(),
            startDate: startDate.toISOString(),
            endDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
            shifts: schedule,
            generatedAt: new Date().toISOString()
        });
        
        return schedule;
    }

    generateDaySchedule(date, availableUsers) {
        const shifts = [];
        const hoursInDay = 24;
        const shiftLength = 8; // 8-hour shifts
        
        // Create 3 shifts per day (8 hours each)
        for (let shiftStart = 0; shiftStart < hoursInDay; shiftStart += shiftLength) {
            const shiftEnd = Math.min(shiftStart + shiftLength, hoursInDay);
            
            // Find best user for this shift
            const bestUser = this.findBestUserForShift(
                availableUsers,
                date,
                shiftStart,
                shiftEnd
            );
            
            if (bestUser) {
                const shift = {
                    id: 'shift-' + Date.now() + '-' + shiftStart,
                    date: date.toISOString(),
                    startTime: shiftStart,
                    endTime: shiftEnd,
                    userId: bestUser.id,
                    userName: bestUser.name,
                    role: bestUser.role,
                    status: 'scheduled',
                    coverage: ['primary'],
                    handoffFrom: null,
                    handoffTo: null
                };
                
                shifts.push(shift);
                
                // Mark user as unavailable for overlapping shifts
                bestUser.availability = bestUser.availability || [];
                bestUser.availability.push({
                    date: date.toISOString(),
                    startTime: shiftStart,
                    endTime: shiftEnd
                });
            }
        }
        
        return shifts;
    }

    findBestUserForShift(users, date, startTime, endTime) {
        const availableUsers = users.filter(user => {
            // Check if user is available for this shift
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            
            // Check user preferences
            if (user.preferences.avoidDays && user.preferences.avoidDays.includes(dayOfWeek)) {
                return false;
            }
            
            // Check preferred hours
            if (user.preferences.preferredHours) {
                const userStart = user.preferences.preferredHours.start;
                const userEnd = user.preferences.preferredHours.end;
                
                if (startTime < userStart || endTime > userEnd) {
                    return false;
                }
            }
            
            // Check max concurrent shifts
            if (user.availability) {
                const concurrentShifts = user.availability.filter(availability => {
                    const availDate = new Date(availability.date);
                    return availDate.toDateString() === date.toDateString() &&
                           ((startTime >= availability.startTime && startTime < availability.endTime) ||
                            (endTime > availability.startTime && endTime <= availability.endTime) ||
                            (startTime <= availability.startTime && endTime >= availability.endTime));
                }).length;
                
                if (concurrentShifts >= user.maxConcurrentShifts) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (availableUsers.length === 0) return null;
        
        // Score users based on various factors
        const scoredUsers = availableUsers.map(user => {
            let score = 0;
            
            // Prefer users with fewer current incidents
            score -= user.currentIncidents.length * 10;
            
            // Prefer users with relevant skills
            if (user.skills.includes('security')) score += 5;
            if (user.skills.includes('backend')) score += 3;
            if (user.skills.includes('database')) score += 3;
            
            // Prefer users with good resolution time
            if (user.averageResolutionTime < 30) score += 5;
            else if (user.averageResolutionTime < 60) score += 2;
            
            // Prefer users with less on-call hours (for fairness)
            score -= user.onCallHours * 0.1;
            
            return { user, score };
        });
        
        // Sort by score (higher is better)
        scoredUsers.sort((a, b) => b.score - a.score);
        
        return scoredUsers[0]?.user || null;
    }

    createIncident(incidentData) {
        const incident = {
            id: 'incident-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            ...incidentData,
            status: 'open',
            severity: incidentData.severity || 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedTo: null,
            assignedAt: null,
            acknowledgedAt: null,
            resolvedAt: null,
            resolutionTime: null,
            escalationLevel: 0,
            notifications: [],
            timeline: [{
                timestamp: new Date().toISOString(),
                action: 'created',
                details: 'Incident created'
            }],
            tags: incidentData.tags || [],
            relatedAlerts: incidentData.relatedAlerts || []
        };
        
        this.incidents.set(incident.id, incident);
        
        // Find on-call person
        const onCallPerson = this.getCurrentOnCallPerson();
        if (onCallPerson) {
            this.assignIncident(incident.id, onCallPerson.id);
        }
        
        // Start escalation timer
        this.startEscalationTimer(incident.id);
        
        return incident;
    }

    getCurrentOnCallPerson() {
        const now = new Date();
        const currentSchedule = this.schedules.get('current');
        
        if (!currentSchedule) return null;
        
        const currentShift = currentSchedule.shifts.find(shift => {
            const shiftDate = new Date(shift.date);
            const shiftStart = new Date(shiftDate);
            const shiftEnd = new Date(shiftDate);
            
            shiftStart.setHours(shift.startTime);
            shiftEnd.setHours(shift.endTime);
            
            return now >= shiftStart && now < shiftEnd;
        });
        
        if (currentShift) {
            return this.users.get(currentShift.userId);
        }
        
        return null;
    }

    assignIncident(incidentId, userId) {
        const incident = this.incidents.get(incidentId);
        const user = this.users.get(userId);
        
        if (!incident || !user) return false;
        
        incident.assignedTo = userId;
        incident.assignedAt = new Date().toISOString();
        incident.status = 'assigned';
        
        user.currentIncidents.push(incidentId);
        user.totalIncidents++;
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'assigned',
            details: `Assigned to ${user.name}`,
            userId: userId
        });
        
        // Send notification
        this.sendNotification(user, 'incident_assigned', incident);
        
        return true;
    }

    acknowledgeIncident(incidentId, userId) {
        const incident = this.incidents.get(incidentId);
        const user = this.users.get(userId);
        
        if (!incident || !user) return false;
        
        if (incident.assignedTo !== userId) {
            return false; // Only assigned user can acknowledge
        }
        
        incident.acknowledgedAt = new Date().toISOString();
        incident.status = 'acknowledged';
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'acknowledged',
            details: `Acknowledged by ${user.name}`,
            userId: userId
        });
        
        // Reset escalation timer
        this.resetEscalationTimer(incidentId);
        
        return true;
    }

    resolveIncident(incidentId, userId, resolutionDetails) {
        const incident = this.incidents.get(incidentId);
        const user = this.users.get(userId);
        
        if (!incident || !user) return false;
        
        const resolutionTime = Date.now() - new Date(incident.createdAt).getTime();
        
        incident.status = 'resolved';
        incident.resolvedAt = new Date().toISOString();
        incident.resolutionTime = resolutionTime;
        incident.resolutionDetails = resolutionDetails;
        
        // Update user stats
        if (user.currentIncidents.includes(incidentId)) {
            user.currentIncidents = user.currentIncidents.filter(id => id !== incidentId);
            
            // Update average resolution time
            const totalIncidents = user.totalIncidents;
            user.averageResolutionTime = (
                (user.averageResolutionTime * (totalIncidents - 1) + resolutionTime) / totalIncidents
            );
        }
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'resolved',
            details: `Resolved by ${user.name}: ${resolutionDetails}`,
            userId: userId
        });
        
        // Cancel escalation timer
        this.cancelEscalationTimer(incidentId);
        
        // Send notification
        this.sendNotification(user, 'incident_resolved', incident);
        
        return true;
    }

    startEscalationTimer(incidentId) {
        const incident = this.incidents.get(incidentId);
        if (!incident) return;
        
        const policy = this.escalationPolicies.get('default_' + incident.severity);
        if (!policy) return;
        
        const currentRule = policy.rules[incident.escalationLevel];
        if (!currentRule) return;
        
        incident.escalationTimer = setTimeout(() => {
            this.escalateIncident(incidentId);
        }, currentRule.timeout * 1000);
    }

    resetEscalationTimer(incidentId) {
        const incident = this.incidents.get(incidentId);
        if (!incident || !incident.escalationTimer) return;
        
        clearTimeout(incident.escalationTimer);
        this.startEscalationTimer(incidentId);
    }

    cancelEscalationTimer(incidentId) {
        const incident = this.incidents.get(incidentId);
        if (!incident || !incident.escalationTimer) return;
        
        clearTimeout(incident.escalationTimer);
        incident.escalationTimer = null;
    }

    escalateIncident(incidentId) {
        const incident = this.incidents.get(incidentId);
        if (!incident) return;
        
        incident.escalationLevel++;
        
        const policy = this.escalationPolicies.get('default_' + incident.severity);
        if (!policy) return;
        
        const currentRule = policy.rules[incident.escalationLevel];
        if (!currentRule) return;
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'escalated',
            details: `Escalated to level ${incident.escalationLevel}: ${currentRule.action}`,
            escalationLevel: incident.escalationLevel
        });
        
        // Execute escalation action
        this.executeEscalationAction(currentRule.action, incident);
        
        // Set next escalation timer if there are more rules
        if (incident.escalationLevel < policy.rules.length - 1) {
            this.startEscalationTimer(incidentId);
        }
    }

    executeEscalationAction(action, incident) {
        switch (action) {
            case 'notify_oncall':
                this.notifyOnCall(incident);
                break;
            case 'notify_secondary':
                this.notifySecondary(incident);
                break;
            case 'notify_manager':
                this.notifyManager(incident);
                break;
            case 'notify_all':
                this.notifyAll(incident);
                break;
        }
    }

    notifyOnCall(incident) {
        const onCallPerson = this.getCurrentOnCallPerson();
        if (onCallPerson) {
            this.sendNotification(onCallPerson, 'escalation', incident);
        }
    }

    notifySecondary(incident) {
        // Find secondary on-call person
        const secondaryUser = this.findSecondaryOnCallPerson();
        if (secondaryUser) {
            this.sendNotification(secondaryUser, 'escalation', incident);
        }
    }

    notifyManager(incident) {
        // Find manager
        const manager = this.findManager();
        if (manager) {
            this.sendNotification(manager, 'escalation', incident);
        }
    }

    notifyAll(incident) {
        // Notify all users
        for (const user of this.users.values()) {
            this.sendNotification(user, 'escalation', incident);
        }
    }

    findSecondaryOnCallPerson() {
        // Find user with lead role or senior engineer
        const candidates = Array.from(this.users.values())
            .filter(user => user.role === 'lead_engineer' || user.role === 'senior_engineer');
        
        return candidates.length > 0 ? candidates[0] : null;
    }

    findManager() {
        // Find user with manager role (for demo, use lead engineer)
        const manager = Array.from(this.users.values())
            .find(user => user.role === 'lead_engineer');
        
        return manager || null;
    }

    sendNotification(user, type, data) {
        const notification = {
            id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            userId: user.id,
            type: type,
            data: data,
            channels: this.getNotificationChannels(type),
            sentAt: new Date().toISOString(),
            status: 'pending'
        };
        
        // Send notifications through configured channels
        for (const channel of notification.channels) {
            this.sendNotificationChannel(user, channel, data);
        }
        
        return notification;
    }

    getNotificationChannels(type) {
        const channels = [];
        
        // Default channels for different types
        switch (type) {
            case 'incident_assigned':
                channels.push('email', 'sms');
                break;
            case 'escalation':
                channels.push('sms', 'pagerduty', 'slack');
                break;
            case 'incident_resolved':
                channels.push('email', 'slack');
                break;
            default:
                channels.push('email');
        }
        
        // Filter to only enabled channels
        return channels.filter(channelId => {
            const channel = this.notificationChannels.get(channelId);
            return channel && channel.enabled;
        });
    }

    sendNotificationChannel(user, channelId, data) {
        const channel = this.notificationChannels.get(channelId);
        if (!channel) return;
        
        switch (channel.type) {
            case 'email':
                this.sendEmailNotification(user, data);
                break;
            case 'sms':
                this.sendSMSNotification(user, data);
                break;
            case 'slack':
                this.sendSlackNotification(user, data);
                break;
            case 'pagerduty':
                this.sendPagerDutyNotification(user, data);
                break;
        }
    }

    sendEmailNotification(user, data) {
        // In production, this would send actual email
        console.log(`Email notification sent to ${user.email}:`, {
            type: data.type || 'notification',
            incident: data.id || 'N/A',
            message: this.generateNotificationMessage(data)
        });
    }

    sendSMSNotification(user, data) {
        // In production, this would send actual SMS
        console.log(`SMS notification sent to ${user.phone}:`, {
            type: data.type || 'notification',
            incident: data.id || 'N/A',
            message: this.generateNotificationMessage(data)
        });
    }

    sendSlackNotification(user, data) {
        // In production, this would send actual Slack message
        console.log(`Slack notification sent for ${user.name}:`, {
            type: data.type || 'notification',
            incident: data.id || 'N/A',
            message: this.generateNotificationMessage(data)
        });
    }

    sendPagerDutyNotification(user, data) {
        // In production, this would send actual PagerDuty alert
        console.log(`PagerDuty notification sent for ${user.name}:`, {
            type: data.type || 'notification',
            incident: data.id || 'N/A',
            message: this.generateNotificationMessage(data)
        });
    }

    generateNotificationMessage(data) {
        switch (data.type) {
            case 'incident_assigned':
                return `Incident ${data.id} has been assigned to you. Severity: ${data.severity}`;
            case 'escalation':
                return `Incident ${data.id} has been escalated to level ${data.escalationLevel}. Action required!`;
            case 'incident_resolved':
                return `Incident ${data.id} has been resolved. Resolution: ${data.resolutionDetails}`;
            default:
                return `Notification: ${data.id || 'N/A'}`;
        }
    }

    getIncident(incidentId) {
        return this.incidents.get(incidentId);
    }

    getIncidents(status = null, severity = null, limit = 50) {
        let incidents = Array.from(this.incidents.values());
        
        if (status) {
            incidents = incidents.filter(incident => incident.status === status);
        }
        
        if (severity) {
            incidents = incidents.filter(incident => incident.severity === severity);
        }
        
        // Sort by creation date (newest first)
        incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return incidents.slice(0, limit);
    }

    getUserStats(userId) {
        const user = this.users.get(userId);
        if (!user) return null;
        
        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            currentIncidents: user.currentIncidents.length,
            totalIncidents: user.totalIncidents,
            averageResolutionTime: Math.round(user.averageResolutionTime / 1000 / 60), // minutes
            onCallHours: user.onCallHours,
            lastOnCall: user.lastOnCall
        };
    }

    getSchedule(date) {
        const currentSchedule = this.schedules.get('current');
        if (!currentSchedule) return [];
        
        return currentSchedule.shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate.toDateString() === date.toDateString();
        });
    }

    handoffIncident(incidentId, fromUserId, toUserId) {
        const incident = this.incidents.get(incidentId);
        const fromUser = this.users.get(fromUserId);
        const toUser = this.users.get(toUserId);
        
        if (!incident || !fromUser || !toUser) return false;
        
        // Remove from current user
        if (fromUser.currentIncidents.includes(incidentId)) {
            fromUser.currentIncidents = fromUser.currentIncidents.filter(id => id !== incidentId);
        }
        
        // Assign to new user
        this.assignIncident(incidentId, toUserId);
        
        // Record handoff
        this.handoffHistory.push({
            incidentId,
            fromUserId,
            toUserId,
            timestamp: new Date().toISOString(),
            reason: 'manual_handoff'
        });
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'handoff',
            details: `Handed off from ${fromUser.name} to ${toUser.name}`,
            fromUserId: fromUserId,
            toUserId: toUserId
        });
        
        return true;
    }
}

// Create global instance
const onCallManagement = new OnCallManagement();

module.exports = {
    onCallManagement
};
