const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { 
  updateBusinessKPI, 
  trackTicketResolutionTime, 
  trackUserActivity, 
  updateGitHubIntegrationRate 
} = require('./apmMonitoringSimple');

// Business Intelligence data store (in production, use database)
const biData = {
    dailyStats: {},
    weeklyStats: {},
    monthlyStats: {},
    kpiHistory: [],
    userSegments: [],
    trendingTopics: [],
    systemUsage: []
};

class BusinessIntelligence {
    constructor() {
        this.initializeKPIs();
        this.startPeriodicAnalysis();
    }

    initializeKPIs() {
        this.kpis = {
            // Ticket KPIs
            ticketCreationRate: 0,
            ticketResolutionRate: 0,
            averageResolutionTime: 0,
            ticketBacklog: 0,
            customerSatisfactionScore: 0,
            
            // User KPIs
            userGrowthRate: 0,
            userEngagementRate: 0,
            userRetentionRate: 0,
            activeUserCount: 0,
            
            // System KPIs
            systemUptime: 0,
            systemPerformanceScore: 0,
            errorRate: 0,
            responseTime: 0,
            
            // GitHub Integration KPIs
            githubSyncRate: 0,
            githubIntegrationSuccess: 0,
            issueCreationRate: 0,
            
            // Business KPIs
            operationalEfficiency: 0,
            costPerTicket: 0,
            productivityScore: 0,
            utilizationRate: 0
        };
    }

    startPeriodicAnalysis() {
        // Run analysis every hour
        setInterval(() => {
            this.performAnalysis();
        }, 3600000);
        
        // Run initial analysis
        this.performAnalysis();
    }

    async performAnalysis() {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            // Calculate daily stats
            await this.calculateDailyStats(today);
            
            // Calculate weekly stats
            await this.calculateWeeklyStats(now);
            
            // Calculate monthly stats
            await this.calculateMonthlyStats(now);
            
            // Update KPIs
            await this.updateKPIs();
            
            // Analyze user segments
            await this.analyzeUserSegments();
            
            // Identify trending topics
            await this.identifyTrendingTopics();
            
            // Track system usage
            await this.trackSystemUsage();
            
            console.log('Business Intelligence analysis completed');
        } catch (error) {
            console.error('Error in BI analysis:', error);
        }
    }

    async calculateDailyStats(date) {
        const startOfDay = new Date(date + 'T00:00:00.000Z');
        const endOfDay = new Date(date + 'T23:59:59.999Z');
        
        try {
            // Ticket metrics
            const ticketsCreated = await Ticket.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            const ticketsResolved = await Ticket.countDocuments({
                status: 'resolved',
                updatedAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            const ticketsClosed = await Ticket.countDocuments({
                status: 'closed',
                updatedAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            // User metrics
            const usersRegistered = await User.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            // Priority distribution
            const priorityStats = await Ticket.aggregate([
                { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]);
            
            // Category distribution
            const categoryStats = await Ticket.aggregate([
                { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);
            
            // GitHub sync stats
            const githubSynced = await Ticket.countDocuments({
                githubIssueNumber: { $exists: true },
                updatedAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            biData.dailyStats[date] = {
                ticketsCreated,
                ticketsResolved,
                ticketsClosed,
                usersRegistered,
                priorityStats: this.formatAggregation(priorityStats),
                categoryStats: this.formatAggregation(categoryStats),
                githubSynced,
                date: date
            };
            
        } catch (error) {
            console.error('Error calculating daily stats:', error);
        }
    }

    async calculateWeeklyStats(now) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekKey = `week-${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        
        try {
            const ticketsCreated = await Ticket.countDocuments({
                createdAt: { $gte: weekStart, $lte: weekEnd }
            });
            
            const ticketsResolved = await Ticket.countDocuments({
                status: { $in: ['resolved', 'closed'] },
                updatedAt: { $gte: weekStart, $lte: weekEnd }
            });
            
            // Average resolution time
            const resolutionTimes = await Ticket.find({
                status: { $in: ['resolved', 'closed'] },
                createdAt: { $gte: weekStart, $lte: weekEnd }
            }).select('createdAt updatedAt');
            
            const avgResolutionTime = this.calculateAverageResolutionTime(resolutionTimes);
            
            biData.weeklyStats[weekKey] = {
                ticketsCreated,
                ticketsResolved,
                averageResolutionTime: avgResolutionTime,
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString()
            };
            
        } catch (error) {
            console.error('Error calculating weekly stats:', error);
        }
    }

    async calculateMonthlyStats(now) {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        try {
            // User growth
            const totalUsers = await User.countDocuments({
                createdAt: { $lte: monthEnd }
            });
            
            const newUsers = await User.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            
            // Ticket volume
            const totalTickets = await Ticket.countDocuments({
                createdAt: { $lte: monthEnd }
            });
            
            const newTickets = await Ticket.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            
            // Resolution rate
            const resolvedTickets = await Ticket.countDocuments({
                status: { $in: ['resolved', 'closed'] },
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            
            const resolutionRate = newTickets > 0 ? (resolvedTickets / newTickets) * 100 : 0;
            
            biData.monthlyStats[monthKey] = {
                totalUsers,
                newUsers,
                userGrowthRate: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0,
                totalTickets,
                newTickets,
                resolvedTickets,
                resolutionRate,
                monthStart: monthStart.toISOString(),
                monthEnd: monthEnd.toISOString()
            };
            
        } catch (error) {
            console.error('Error calculating monthly stats:', error);
        }
    }

    async updateKPIs() {
        try {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            // Ticket KPIs
            const recentTickets = await Ticket.find({
                createdAt: { $gte: last30Days }
            });
            
            this.kpis.ticketCreationRate = recentTickets.length / 30; // per day
            this.kpis.ticketBacklog = await Ticket.countDocuments({
                status: { $in: ['open', 'in_progress'] }
            });
            
            const resolvedTickets = await Ticket.find({
                status: { $in: ['resolved', 'closed'] },
                createdAt: { $gte: last30Days }
            });
            
            this.kpis.ticketResolutionRate = recentTickets.length > 0 ? 
                (resolvedTickets.length / recentTickets.length) * 100 : 0;
            
            this.kpis.averageResolutionTime = this.calculateAverageResolutionTime(resolvedTickets);
            
            // User KPIs
            const totalUsers = await User.countDocuments();
            const recentUsers = await User.find({
                createdAt: { $gte: last30Days }
            });
            
            this.kpis.userGrowthRate = totalUsers > 0 ? (recentUsers.length / totalUsers) * 100 : 0;
            this.kpis.activeUserCount = totalUsers;
            
            // GitHub Integration KPIs
            const githubTickets = await Ticket.countDocuments({
                githubIssueNumber: { $exists: true }
            });
            
            this.kpis.githubSyncRate = recentTickets.length > 0 ? 
                (githubTickets / recentTickets.length) * 100 : 0;
            
            // Update Prometheus metrics
            updateBusinessKPI('ticket_creation_rate', this.kpis.ticketCreationRate);
            updateBusinessKPI('ticket_resolution_rate', this.kpis.ticketResolutionRate);
            updateBusinessKPI('ticket_backlog', this.kpis.ticketBacklog);
            updateBusinessKPI('user_growth_rate', this.kpis.userGrowthRate);
            updateBusinessKPI('active_users', this.kpis.activeUserCount);
            updateBusinessKPI('avg_resolution_time', this.kpis.averageResolutionTime);
            updateGitHubIntegrationRate(this.kpis.githubSyncRate);
            
            // Track ticket resolution times
            resolvedTickets.forEach(ticket => {
                const hours = this.calculateAverageResolutionTime([ticket]);
                trackTicketResolutionTime(ticket.priority || 'medium', ticket.category || 'general', hours);
            });
            
            // Store KPI history
            biData.kpiHistory.push({
                timestamp: now.toISOString(),
                kpis: { ...this.kpis }
            });
            
            // Keep only last 100 KPI snapshots
            if (biData.kpiHistory.length > 100) {
                biData.kpiHistory = biData.kpiHistory.slice(-100);
            }
            
        } catch (error) {
            console.error('Error updating KPIs:', error);
        }
    }

    async analyzeUserSegments() {
        try {
            const userSegments = await User.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 },
                        avgAge: {
                            $avg: {
                                $dateDiff: {
                                    startDate: '$createdAt',
                                    endDate: new Date(),
                                    unit: 'day'
                                }
                            }
                        }
                    }
                }
            ]);
            
            biData.userSegments = this.formatAggregation(userSegments);
            
        } catch (error) {
            console.error('Error analyzing user segments:', error);
        }
    }

    async identifyTrendingTopics() {
        try {
            const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            // Analyze ticket titles and descriptions for common keywords
            const recentTickets = await Ticket.find({
                createdAt: { $gte: last7Days }
            }).select('title description tags category');
            
            const keywordFrequency = {};
            
            recentTickets.forEach(ticket => {
                const text = `${ticket.title} ${ticket.description} ${ticket.tags.join(' ')} ${ticket.category}`;
                const keywords = this.extractKeywords(text);
                
                keywords.forEach(keyword => {
                    keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
                });
            });
            
            // Get top trending topics
            const trendingTopics = Object.entries(keywordFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([keyword, frequency]) => ({ keyword, frequency }));
            
            biData.trendingTopics = trendingTopics;
            
        } catch (error) {
            console.error('Error identifying trending topics:', error);
        }
    }

    async trackSystemUsage() {
        try {
            const now = new Date();
            const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
            
            // This would integrate with monitoring data
            // For now, we'll simulate some usage metrics
            const usageData = {
                timestamp: now.toISOString(),
                activeUsers: Math.floor(Math.random() * 50) + 10,
                requestsPerMinute: Math.floor(Math.random() * 100) + 20,
                averageResponseTime: Math.random() * 200 + 50,
                errorRate: Math.random() * 5,
                systemLoad: Math.random() * 0.8 + 0.1
            };
            
            biData.systemUsage.push(usageData);
            
            // Keep only last 24 hours of usage data
            if (biData.systemUsage.length > 24) {
                biData.systemUsage = biData.systemUsage.slice(-24);
            }
            
        } catch (error) {
            console.error('Error tracking system usage:', error);
        }
    }

    formatAggregation(aggregation) {
        const formatted = {};
        aggregation.forEach(item => {
            formatted[item._id] = item.count;
        });
        return formatted;
    }

    calculateAverageResolutionTime(tickets) {
        if (tickets.length === 0) return 0;
        
        const totalTime = tickets.reduce((sum, ticket) => {
            const created = new Date(ticket.createdAt);
            const resolved = new Date(ticket.updatedAt);
            return sum + (resolved - created);
        }, 0);
        
        return totalTime / tickets.length / (1000 * 60 * 60); // Convert to hours
    }

    extractKeywords(text) {
        // Simple keyword extraction - in production, use NLP libraries
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
        
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .filter((word, index, array) => array.indexOf(word) === index);
    }

    getKPIDashboard() {
        return {
            currentKPIs: this.kpis,
            kpiTrends: this.calculateKPITrends(),
            performanceScore: this.calculatePerformanceScore(),
            recommendations: this.generateRecommendations()
        };
    }

    calculateKPITrends() {
        if (biData.kpiHistory.length < 2) return {};
        
        const current = biData.kpiHistory[biData.kpiHistory.length - 1].kpis;
        const previous = biData.kpiHistory[biData.kpiHistory.length - 2].kpis;
        
        const trends = {};
        
        Object.keys(current).forEach(key => {
            const currentValue = current[key];
            const previousValue = previous[key];
            
            if (previousValue > 0) {
                const change = ((currentValue - previousValue) / previousValue) * 100;
                trends[key] = {
                    current: currentValue,
                    previous: previousValue,
                    changePercent: change,
                    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
                };
            }
        });
        
        return trends;
    }

    calculatePerformanceScore() {
        // Weighted score based on various KPIs
        const weights = {
            ticketResolutionRate: 0.25,
            userGrowthRate: 0.15,
            githubSyncRate: 0.10,
            averageResolutionTime: 0.15, // Lower is better
            ticketBacklog: 0.10, // Lower is better
            systemUptime: 0.15,
            errorRate: 0.10 // Lower is better
        };
        
        let score = 0;
        let totalWeight = 0;
        
        Object.keys(weights).forEach(key => {
            const weight = weights[key];
            const value = this.kpis[key];
            
            if (value !== undefined) {
                // Normalize values (0-100 scale)
                let normalizedValue = value;
                
                if (key === 'averageResolutionTime' || key === 'ticketBacklog' || key === 'errorRate') {
                    // Lower is better for these metrics
                    normalizedValue = Math.max(0, 100 - value);
                } else {
                    // Higher is better for these metrics
                    normalizedValue = Math.min(100, value);
                }
                
                score += normalizedValue * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? score / totalWeight : 0;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.kpis.ticketResolutionRate < 70) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Low Ticket Resolution Rate',
                description: 'Consider implementing automated workflows or increasing staff resources',
                impact: 'Medium'
            });
        }
        
        if (this.kpis.ticketBacklog > 100) {
            recommendations.push({
                type: 'capacity',
                priority: 'medium',
                title: 'High Ticket Backlog',
                description: 'Review ticket prioritization and resource allocation',
                impact: 'High'
            });
        }
        
        if (this.kpis.githubSyncRate < 50) {
            recommendations.push({
                type: 'integration',
                priority: 'low',
                title: 'Low GitHub Integration',
                description: 'Improve GitHub sync process to increase integration rate',
                impact: 'Low'
            });
        }
        
        if (this.kpis.userGrowthRate < 5) {
            recommendations.push({
                type: 'growth',
                priority: 'medium',
                title: 'Low User Growth',
                description: 'Consider marketing initiatives or improve user onboarding',
                impact: 'High'
            });
        }
        
        return recommendations;
    }

    getUsageAnalytics() {
        return {
            dailyStats: biData.dailyStats,
            weeklyStats: biData.weeklyStats,
            monthlyStats: biData.monthlyStats,
            userSegments: biData.userSegments,
            trendingTopics: biData.trendingTopics,
            systemUsage: biData.systemUsage
        };
    }
}

// Create global BI instance
const bi = new BusinessIntelligence();

// BI middleware
const getBIAnalytics = (req, res) => {
    try {
        const analytics = bi.getUsageAnalytics();
        
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting BI analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
};

const getKPIDashboard = (req, res) => {
    try {
        const dashboard = bi.getKPIDashboard();
        
        res.json({
            success: true,
            data: dashboard,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting KPI dashboard:', error);
        res.status(500).json({ success: false, error: 'Failed to get KPI dashboard' });
    }
};

module.exports = {
    getBIAnalytics,
    getKPIDashboard,
    bi
};
