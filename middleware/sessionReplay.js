const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Session replay storage
const sessionStorage = {
    sessions: new Map(),
    events: new Map(),
    maxSessions: 1000,
    maxEventsPerSession: 5000,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    storagePath: path.join(__dirname, '../data/session-replay')
};

// Initialize session replay storage
const initializeSessionReplay = async () => {
    try {
        await fs.mkdir(sessionStorage.storagePath, { recursive: true });
        
        // Clean up old sessions periodically
        setInterval(cleanupOldSessions, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('Session replay system initialized');
    } catch (error) {
        console.error('Failed to initialize session replay:', error);
    }
};

// Generate unique session ID
const generateSessionId = () => {
    return crypto.randomBytes(16).toString('hex');
};

// Create new session
const createSession = (sessionData) => {
    const sessionId = generateSessionId();
    const session = {
        id: sessionId,
        startTime: new Date().toISOString(),
        endTime: null,
        userAgent: sessionData.userAgent,
        ip: sessionData.ip,
        url: sessionData.url,
        userId: sessionData.userId || null,
        events: [],
        metadata: {
            screenResolution: sessionData.screenResolution,
            viewport: sessionData.viewport,
            platform: sessionData.platform,
            language: sessionData.language
        }
    };
    
    sessionStorage.sessions.set(sessionId, session);
    return sessionId;
};

// Record session event
const recordSessionEvent = async (sessionId, eventData) => {
    const session = sessionStorage.sessions.get(sessionId);
    if (!session) {
        return { success: false, error: 'Session not found' };
    }
    
    const event = {
        id: crypto.randomBytes(8).toString('hex'),
        timestamp: new Date().toISOString(),
        type: eventData.type,
        data: eventData.data,
        coordinates: eventData.coordinates || null,
        target: eventData.target || null,
        duration: eventData.duration || null
    };
    
    session.events.push(event);
    
    // Limit events per session
    if (session.events.length > sessionStorage.maxEventsPerSession) {
        session.events = session.events.slice(-sessionStorage.maxEventsPerSession);
    }
    
    // Update session end time
    session.endTime = new Date().toISOString();
    
    // Save session to disk periodically
    if (session.events.length % 100 === 0) {
        await saveSessionToDisk(sessionId);
    }
    
    return { success: true, eventId: event.id };
};

// Save session to disk
const saveSessionToDisk = async (sessionId) => {
    try {
        const session = sessionStorage.sessions.get(sessionId);
        if (!session) return;
        
        const filePath = path.join(sessionStorage.storagePath, `${sessionId}.json`);
        await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
        console.error('Failed to save session to disk:', error);
    }
};

// Get session data
const getSession = async (sessionId) => {
    const session = sessionStorage.sessions.get(sessionId);
    if (session) {
        return { success: true, session };
    }
    
    // Try to load from disk
    try {
        const filePath = path.join(sessionStorage.storagePath, `${sessionId}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        const session = JSON.parse(data);
        sessionStorage.sessions.set(sessionId, session);
        return { success: true, session };
    } catch (error) {
        return { success: false, error: 'Session not found' };
    }
};

// Get session list
const getSessionList = async (filters = {}) => {
    const sessions = Array.from(sessionStorage.sessions.values());
    
    let filteredSessions = sessions;
    
    if (filters.userId) {
        filteredSessions = filteredSessions.filter(s => s.userId === filters.userId);
    }
    
    if (filters.startDate) {
        filteredSessions = filteredSessions.filter(s => 
            new Date(s.startTime) >= new Date(filters.startDate)
        );
    }
    
    if (filters.endDate) {
        filteredSessions = filteredSessions.filter(s => 
            new Date(s.startTime) <= new Date(filters.endDate)
        );
    }
    
    if (filters.minDuration) {
        filteredSessions = filteredSessions.filter(s => {
            const duration = new Date(s.endTime) - new Date(s.startTime);
            return duration >= filters.minDuration;
        });
    }
    
    // Sort by start time (most recent first)
    filteredSessions.sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
    );
    
    // Return summary data
    return filteredSessions.map(session => ({
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime ? 
            new Date(session.endTime) - new Date(session.startTime) : null,
        eventCount: session.events.length,
        userId: session.userId,
        userAgent: session.userAgent,
        url: session.url,
        metadata: session.metadata
    }));
};

// Clean up old sessions
const cleanupOldSessions = async () => {
    const now = Date.now();
    const sessions = Array.from(sessionStorage.sessions.entries());
    
    for (const [sessionId, session] of sessions) {
        const sessionAge = now - new Date(session.startTime).getTime();
        
        if (sessionAge > sessionStorage.sessionTimeout) {
            // Save to disk before removing from memory
            await saveSessionToDisk(sessionId);
            sessionStorage.sessions.delete(sessionId);
        }
    }
    
    // Limit total sessions in memory
    if (sessionStorage.sessions.size > sessionStorage.maxSessions) {
        const sortedSessions = Array.from(sessionStorage.sessions.entries())
            .sort((a, b) => new Date(a[1].startTime) - new Date(b[1].startTime));
        
        const sessionsToRemove = sortedSessions.slice(0, 
            sessionStorage.sessions.size - sessionStorage.maxSessions);
        
        for (const [sessionId] of sessionsToRemove) {
            await saveSessionToDisk(sessionId);
            sessionStorage.sessions.delete(sessionId);
        }
    }
};

// Get session analytics
const getSessionAnalytics = async (filters = {}) => {
    const sessions = await getSessionList(filters);
    
    const analytics = {
        totalSessions: sessions.length,
        averageSessionDuration: 0,
        averageEventsPerSession: 0,
        topPages: {},
        topUserAgents: {},
        errorRate: 0,
        completionRate: 0,
        userEngagement: {
            clicks: 0,
            scrolls: 0,
            formInteractions: 0,
            navigationEvents: 0
        },
        timeDistribution: {
            lessThan1Min: 0,
            oneTo5Min: 0,
            fiveTo15Min: 0,
            moreThan15Min: 0
        }
    };
    
    let totalDuration = 0;
    let totalEvents = 0;
    let completedSessions = 0;
    let errorSessions = 0;
    
    for (const session of sessions) {
        if (session.duration) {
            totalDuration += session.duration;
            completedSessions++;
            
            // Time distribution
            const durationMinutes = session.duration / (1000 * 60);
            if (durationMinutes < 1) {
                analytics.timeDistribution.lessThan1Min++;
            } else if (durationMinutes < 5) {
                analytics.timeDistribution.oneTo5Min++;
            } else if (durationMinutes < 15) {
                analytics.timeDistribution.fiveTo15Min++;
            } else {
                analytics.timeDistribution.moreThan15Min++;
            }
        }
        
        totalEvents += session.eventCount;
        
        // Top pages
        if (session.url) {
            analytics.topPages[session.url] = (analytics.topPages[session.url] || 0) + 1;
        }
        
        // Top user agents
        if (session.userAgent) {
            analytics.topUserAgents[session.userAgent] = 
                (analytics.topUserAgents[session.userAgent] || 0) + 1;
        }
    }
    
    analytics.averageSessionDuration = completedSessions > 0 ? 
        totalDuration / completedSessions : 0;
    analytics.averageEventsPerSession = sessions.length > 0 ? 
        totalEvents / sessions.length : 0;
    analytics.completionRate = sessions.length > 0 ? 
        (completedSessions / sessions.length) * 100 : 0;
    
    // Sort top pages and user agents
    analytics.topPages = Object.entries(analytics.topPages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    analytics.topUserAgents = Object.entries(analytics.topUserAgents)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    return analytics;
};

// Delete session
const deleteSession = async (sessionId) => {
    try {
        sessionStorage.sessions.delete(sessionId);
        
        const filePath = path.join(sessionStorage.storagePath, `${sessionId}.json`);
        await fs.unlink(filePath);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Export session data
const exportSessionData = async (sessionId, format = 'json') => {
    const sessionResult = await getSession(sessionId);
    if (!sessionResult.success) {
        return sessionResult;
    }
    
    const session = sessionResult.session;
    
    if (format === 'json') {
        return { success: true, data: JSON.stringify(session, null, 2) };
    } else if (format === 'csv') {
        const csvData = [
            'Timestamp,Type,Target,Coordinates,Data',
            ...session.events.map(event => 
                `"${event.timestamp}","${event.type}","${event.target || ''}","${event.coordinates || ''}","${JSON.stringify(event.data).replace(/"/g, '""')}"`
            )
        ].join('\n');
        
        return { success: true, data: csvData };
    }
    
    return { success: false, error: 'Unsupported format' };
};

// Session replay middleware
const sessionReplayMiddleware = (req, res, next) => {
    // Add session ID to response headers for frontend tracking
    res.setHeader('X-Session-ID', generateSessionId());
    next();
};

module.exports = {
    initializeSessionReplay,
    createSession,
    recordSessionEvent,
    getSession,
    getSessionList,
    getSessionAnalytics,
    deleteSession,
    exportSessionData,
    sessionReplayMiddleware,
    generateSessionId
};
