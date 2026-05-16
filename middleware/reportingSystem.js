/**
 * NEXUS Reporting System
 * Comprehensive reporting with business intelligence and analytics
 */

const Ticket = require('../models/Ticket');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

class ReportingSystem {
  constructor() {
    this.reportTemplates = new Map();
    this.scheduledReports = new Map();
    this.reportHistory = new Map();
    this.reportCache = new Map();
    
    this.initializeDefaultTemplates();
    this.startScheduledReports();
  }

  initializeDefaultTemplates() {
    const templates = [
      {
        id: 'ticket_summary',
        name: 'Ticket Summary Report',
        description: 'Overview of ticket statistics and trends',
        type: 'summary',
        category: 'tickets',
        format: 'json',
        schedule: 'daily',
        recipients: ['admin'],
        template: {
          sections: [
            {
              title: 'Ticket Overview',
              metrics: ['total_tickets', 'open_tickets', 'resolved_tickets', 'in_progress_tickets']
            },
            {
              title: 'Performance Metrics',
              metrics: ['avg_resolution_time', 'resolution_rate', 'response_rate']
            },
            {
              title: 'Trends',
              metrics: ['daily_ticket_volume', 'resolution_trend']
            }
          ]
        }
      },
      {
        id: 'user_activity',
        name: 'User Activity Report',
        description: 'User engagement and activity metrics',
        type: 'detailed',
        category: 'users',
        format: 'json',
        schedule: 'weekly',
        recipients: ['admin'],
        template: {
          sections: [
            {
              title: 'User Overview',
              metrics: ['total_users', 'active_users', 'new_users']
            },
            {
              title: 'Activity Metrics',
              metrics: ['logins_per_day', 'tickets_per_user', 'avg_session_duration']
            },
            {
              title: 'User Distribution',
              metrics: ['users_by_role', 'users_by_team']
            }
          ]
        }
      },
      {
        id: 'performance_metrics',
        name: 'System Performance Report',
        description: 'System performance and health metrics',
        type: 'performance',
        category: 'system',
        format: 'json',
        schedule: 'hourly',
        recipients: ['admin'],
        template: {
          sections: [
            {
              title: 'System Health',
              metrics: ['uptime', 'response_time', 'error_rate']
            },
            {
              title: 'Resource Usage',
              metrics: ['cpu_usage', 'memory_usage', 'disk_usage']
            },
            {
              title: 'Database Performance',
              metrics: ['db_connection_pool', 'query_performance', 'index_usage']
            }
          ]
        }
      },
      {
        id: 'business_kpis',
        name: 'Business KPI Report',
        description: 'Key business indicators and metrics',
        type: 'business',
        category: 'business',
        format: 'json',
        schedule: 'daily',
        recipients: ['admin', 'management'],
        template: {
          sections: [
            {
              title: 'Customer Satisfaction',
              metrics: ['satisfaction_score', 'nps_score', 'feedback_rate']
            },
            {
              title: 'Operational Efficiency',
              metrics: ['ticket_resolution_time', 'first_response_time', 'escalation_rate']
            },
            {
              title: 'Business Growth',
              metrics: ['user_growth', 'ticket_volume_growth', 'revenue_impact']
            }
          ]
        }
      },
      {
        id: 'team_performance',
        name: 'Team Performance Report',
        description: 'Team-specific performance metrics',
        type: 'team',
        category: 'teams',
        format: 'json',
        schedule: 'weekly',
        recipients: ['admin', 'team_leads'],
        template: {
          sections: [
            {
              title: 'Team Overview',
              metrics: ['team_size', 'active_members', 'workload_distribution']
            },
            {
              title: 'Performance Metrics',
              metrics: ['tickets_handled', 'avg_resolution_time', 'satisfaction_score']
            },
            {
              title: 'Collaboration',
              metrics: ['cross_team_tickets', 'escalation_rate', 'knowledge_sharing']
            }
          ]
        }
      }
    ];

    templates.forEach(template => {
      this.reportTemplates.set(template.id, template);
    });
  }

  async generateReport(templateId, options = {}) {
    const {
      timeRange = '30d',
      filters = {},
      format = 'json',
      userId = null
    } = options;

    const template = this.reportTemplates.get(templateId);
    
    if (!template) {
      throw new Error(`Report template not found: ${templateId}`);
    }

    // Check cache first
    const cacheKey = `${templateId}:${timeRange}:${JSON.stringify(filters)}`;
    const cached = this.reportCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes cache
      return cached.data;
    }

    // Generate report data
    const reportData = await this.generateReportData(template, timeRange, filters, userId);
    
    // Format report
    let formattedReport;
    switch (format) {
      case 'json':
        formattedReport = this.formatAsJSON(reportData, template);
        break;
      case 'csv':
        formattedReport = this.formatAsCSV(reportData, template);
        break;
      case 'html':
        formattedReport = this.formatAsHTML(reportData, template);
        break;
      case 'pdf':
        formattedReport = await this.formatAsPDF(reportData, template);
        break;
      default:
        formattedReport = this.formatAsJSON(reportData, template);
    }

    // Cache the result
    this.reportCache.set(cacheKey, {
      data: formattedReport,
      timestamp: Date.now()
    });

    // Record report generation
    this.recordReportGeneration(templateId, options, formattedReport);

    return formattedReport;
  }

  async generateReportData(template, timeRange, filters, userId) {
    const { startDate, endDate } = this.parseTimeRange(timeRange);
    const reportData = {
      template: template.id,
      name: template.name,
      generatedAt: new Date().toISOString(),
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      filters,
      sections: []
    };

    // Generate data for each section
    for (const section of template.template.sections) {
      const sectionData = await this.generateSectionData(section, startDate, endDate, filters, userId);
      reportData.sections.push({
        title: section.title,
        metrics: sectionData
      });
    }

    // Add summary statistics
    reportData.summary = this.generateReportSummary(reportData);

    return reportData;
  }

  async generateSectionData(section, startDate, endDate, filters, userId) {
    const metrics = {};

    for (const metricName of section.metrics) {
      metrics[metricName] = await this.calculateMetric(metricName, startDate, endDate, filters, userId);
    }

    return metrics;
  }

  async calculateMetric(metricName, startDate, endDate, filters, userId) {
    switch (metricName) {
      case 'total_tickets':
        return await this.getTotalTickets(startDate, endDate, filters);
      case 'open_tickets':
        return await this.getOpenTickets(startDate, endDate, filters);
      case 'resolved_tickets':
        return await this.getResolvedTickets(startDate, endDate, filters);
      case 'in_progress_tickets':
        return await this.getInProgressTickets(startDate, endDate, filters);
      case 'avg_resolution_time':
        return await this.getAvgResolutionTime(startDate, endDate, filters);
      case 'resolution_rate':
        return await this.getResolutionRate(startDate, endDate, filters);
      case 'response_rate':
        return await this.getResponseRate(startDate, endDate, filters);
      case 'daily_ticket_volume':
        return await this.getDailyTicketVolume(startDate, endDate, filters);
      case 'resolution_trend':
        return await this.getResolutionTrend(startDate, endDate, filters);
      case 'total_users':
        return await this.getTotalUsers(startDate, endDate, filters);
      case 'active_users':
        return await this.getActiveUsers(startDate, endDate, filters);
      case 'new_users':
        return await this.getNewUsers(startDate, endDate, filters);
      case 'logins_per_day':
        return await this.getLoginsPerDay(startDate, endDate, filters);
      case 'tickets_per_user':
        return await this.getTicketsPerUser(startDate, endDate, filters);
      case 'avg_session_duration':
        return await this.getAvgSessionDuration(startDate, endDate, filters);
      case 'users_by_role':
        return await this.getUsersByRole(startDate, endDate, filters);
      case 'users_by_team':
        return await this.getUsersByTeam(startDate, endDate, filters);
      case 'uptime':
        return await this.getUptime(startDate, endDate, filters);
      case 'response_time':
        return await this.getResponseTime(startDate, endDate, filters);
      case 'error_rate':
        return await this.getErrorRate(startDate, endDate, filters);
      case 'cpu_usage':
        return await this.getCPUUsage(startDate, endDate, filters);
      case 'memory_usage':
        return await this.getMemoryUsage(startDate, endDate, filters);
      case 'disk_usage':
        return await this.getDiskUsage(startDate, endDate, filters);
      case 'db_connection_pool':
        return await this.getDBConnectionPool(startDate, endDate, filters);
      case 'query_performance':
        return await this.getQueryPerformance(startDate, endDate, filters);
      case 'index_usage':
        return await this.getIndexUsage(startDate, endDate, filters);
      case 'satisfaction_score':
        return await this.getSatisfactionScore(startDate, endDate, filters);
      case 'nps_score':
        return await this.getNPSScore(startDate, endDate, filters);
      case 'feedback_rate':
        return await this.getFeedbackRate(startDate, endDate, filters);
      case 'ticket_resolution_time':
        return await this.getTicketResolutionTime(startDate, endDate, filters);
      case 'first_response_time':
        return await this.getFirstResponseTime(startDate, endDate, filters);
      case 'escalation_rate':
        return await this.getEscalationRate(startDate, endDate, filters);
      case 'user_growth':
        return await this.getUserGrowth(startDate, endDate, filters);
      case 'ticket_volume_growth':
        return await this.getTicketVolumeGrowth(startDate, endDate, filters);
      case 'revenue_impact':
        return await this.getRevenueImpact(startDate, endDate, filters);
      case 'team_size':
        return await this.getTeamSize(startDate, endDate, filters);
      case 'active_members':
        return await this.getActiveMembers(startDate, endDate, filters);
      case 'workload_distribution':
        return await this.getWorkloadDistribution(startDate, endDate, filters);
      case 'tickets_handled':
        return await this.getTicketsHandled(startDate, endDate, filters);
      case 'cross_team_tickets':
        return await this.getCrossTeamTickets(startDate, endDate, filters);
      case 'knowledge_sharing':
        return await this.getKnowledgeSharing(startDate, endDate, filters);
      default:
        return { value: 0, trend: 'stable' };
    }
  }

  async getTotalTickets(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };
    
    const count = await Ticket.countDocuments(query);
    const previousCount = await this.getPreviousPeriodCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  async getOpenTickets(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'open',
      ...filters
    };
    
    const count = await Ticket.countDocuments(query);
    const previousCount = await this.getPreviousPeriodCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  async getResolvedTickets(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'resolved',
      ...filters
    };
    
    const count = await Ticket.countDocuments(query);
    const previousCount = await this.getPreviousPeriodCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  async getInProgressTickets(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'in_progress',
      ...filters
    };
    
    const count = await Ticket.countDocuments(query);
    const previousCount = await this.getPreviousPeriodCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  async getAvgResolutionTime(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'resolved',
      resolvedAt: { $exists: true },
      ...filters
    };
    
    const tickets = await Ticket.find(query);
    
    if (tickets.length === 0) {
      return { value: 0, unit: 'hours', trend: 'stable' };
    }
    
    const totalResolutionTime = tickets.reduce((sum, ticket) => {
      return sum + (ticket.resolvedAt - ticket.createdAt);
    }, 0);
    
    const avgTime = totalResolutionTime / tickets.length;
    const avgHours = avgTime / (1000 * 60 * 60);
    
    // Get previous period for comparison
    const previousAvg = await this.getPreviousPeriodAvg(query);
    
    return {
      value: Math.round(avgHours * 10) / 10,
      unit: 'hours',
      previous: Math.round(previousAvg * 10) / 10,
      trend: this.calculateTrend(avgHours, previousAvg),
      change: this.calculateChange(avgHours, previousAvg)
    };
  }

  async getResolutionRate(startDate, endDate, filters) {
    const totalQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };
    
    const resolvedQuery = {
      ...totalQuery,
      status: 'resolved'
    };
    
    const [total, resolved] = await Promise.all([
      Ticket.countDocuments(totalQuery),
      Ticket.countDocuments(resolvedQuery)
    ]);
    
    const rate = total > 0 ? (resolved / total) * 100 : 0;
    const previousRate = await this.getPreviousPeriodRate(totalQuery, resolvedQuery);
    
    return {
      value: Math.round(rate * 10) / 10,
      unit: '%',
      previous: Math.round(previousRate * 10) / 10,
      trend: this.calculateTrend(rate, previousRate),
      change: this.calculateChange(rate, previousRate)
    };
  }

  async getResponseRate(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };
    
    const tickets = await Ticket.find(query);
    const ticketsWithComments = tickets.filter(ticket => 
      ticket.comments && ticket.comments.length > 0
    );
    
    const rate = tickets.length > 0 ? (ticketsWithComments.length / tickets.length) * 100 : 0;
    const previousRate = await this.getPreviousPeriodResponseRate(query);
    
    return {
      value: Math.round(rate * 10) / 10,
      unit: '%',
      previous: Math.round(previousRate * 10) / 10,
      trend: this.calculateTrend(rate, previousRate),
      change: this.calculateChange(rate, previousRate)
    };
  }

  async getDailyTicketVolume(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };
    
    const tickets = await Ticket.find(query).sort({ createdAt: 1 });
    const dailyVolume = {};
    
    // Initialize all days in range with 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyVolume[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count tickets per day
    tickets.forEach(ticket => {
      const dateKey = ticket.createdAt.toISOString().split('T')[0];
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + 1;
    });
    
    return {
      type: 'timeseries',
      data: Object.entries(dailyVolume).map(([date, count]) => ({
        date,
        value: count
      }))
    };
  }

  async getResolutionTrend(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'resolved',
      resolvedAt: { $exists: true },
      ...filters
    };
    
    const tickets = await Ticket.find(query).sort({ resolvedAt: 1 });
    const weeklyResolution = {};
    
    // Group by week
    tickets.forEach(ticket => {
      const weekKey = this.getWeekKey(ticket.resolvedAt);
      weeklyResolution[weekKey] = (weeklyResolution[weekKey] || 0) + 1;
    });
    
    return {
      type: 'timeseries',
      data: Object.entries(weeklyResolution).map(([week, count]) => ({
        week,
        value: count
      }))
    };
  }

  async getTotalUsers(startDate, endDate, filters) {
    const query = {
      createdAt: { $lte: endDate },
      ...filters
    };
    
    const count = await User.countDocuments(query);
    const previousCount = await this.getPreviousPeriodUserCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  async getActiveUsers(startDate, endDate, filters) {
    const query = {
      lastLogin: { $gte: startDate, $lte: endDate },
      ...filters
    };
    
    const count = await User.countDocuments(query);
    const previousCount = await this.getPreviousPeriodUserCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  async getNewUsers(startDate, endDate, filters) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };
    
    const count = await User.countDocuments(query);
    const previousCount = await this.getPreviousPeriodUserCount(query);
    
    return {
      value: count,
      previous: previousCount,
      trend: this.calculateTrend(count, previousCount),
      change: this.calculateChange(count, previousCount)
    };
  }

  // Helper methods
  parseTimeRange(timeRange) {
    const now = new Date();
    let startDate, endDate;
    
    if (typeof timeRange === 'string') {
      const match = timeRange.match(/^(\d+)([hdwmy])$/);
      if (match) {
        const [, number, unit] = match;
        const value = parseInt(number);
        
        endDate = now;
        startDate = new Date(now);
        
        switch (unit) {
          case 'h':
            startDate.setHours(startDate.getHours() - value);
            break;
          case 'd':
            startDate.setDate(startDate.getDate() - value);
            break;
          case 'w':
            startDate.setDate(startDate.getDate() - (value * 7));
            break;
          case 'm':
            startDate.setMonth(startDate.getMonth() - value);
            break;
          case 'y':
            startDate.setFullYear(startDate.getFullYear() - value);
            break;
        }
      } else {
        // Default to 30 days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
      }
    } else if (timeRange.startDate && timeRange.endDate) {
      startDate = new Date(timeRange.startDate);
      endDate = new Date(timeRange.endDate);
    } else {
      // Default to 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    }
    
    return { startDate, endDate };
  }

  calculateTrend(current, previous) {
    if (previous === 0) {
      return current > 0 ? 'up' : 'stable';
    }
    
    const change = ((current - previous) / previous) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  calculateChange(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  getWeekKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);
    return `${year}-W${week}`;
  }

  async getPreviousPeriodCount(query) {
    // This would calculate the same query for the previous period
    // For now, return a mock value
    return Math.floor(Math.random() * 100);
  }

  async getPreviousPeriodAvg(query) {
    // This would calculate the same average for the previous period
    // For now, return a mock value
    return Math.random() * 24; // Random hours
  }

  async getPreviousPeriodRate(totalQuery, resolvedQuery) {
    // This would calculate the same rate for the previous period
    // For now, return a mock value
    return Math.random() * 100;
  }

  async getPreviousPeriodResponseRate(query) {
    // This would calculate the same response rate for the previous period
    // For now, return a mock value
    return Math.random() * 100;
  }

  async getPreviousPeriodUserCount(query) {
    // This would calculate the same user count for the previous period
    // For now, return a mock value
    return Math.floor(Math.random() * 100);
  }

  // Placeholder methods for remaining metrics
  async getLoginsPerDay(startDate, endDate, filters) { return { value: 150, trend: 'up' }; }
  async getTicketsPerUser(startDate, endDate, filters) { return { value: 5.2, trend: 'stable' }; }
  async getAvgSessionDuration(startDate, endDate, filters) { return { value: 25, unit: 'minutes', trend: 'up' }; }
  async getUsersByRole(startDate, endDate, filters) { return { type: 'distribution', data: [] }; }
  async getUsersByTeam(startDate, endDate, filters) { return { type: 'distribution', data: [] }; }
  async getUptime(startDate, endDate, filters) { return { value: 99.9, unit: '%', trend: 'stable' }; }
  async getResponseTime(startDate, endDate, filters) { return { value: 150, unit: 'ms', trend: 'down' }; }
  async getErrorRate(startDate, endDate, filters) { return { value: 0.5, unit: '%', trend: 'down' }; }
  async getCPUUsage(startDate, endDate, filters) { return { value: 45, unit: '%', trend: 'stable' }; }
  async getMemoryUsage(startDate, endDate, filters) { return { value: 67, unit: '%', trend: 'up' }; }
  async getDiskUsage(startDate, endDate, filters) { return { value: 23, unit: '%', trend: 'stable' }; }
  async getDBConnectionPool(startDate, endDate, filters) { return { value: 5, trend: 'stable' }; }
  async getQueryPerformance(startDate, endDate, filters) { return { value: 25, unit: 'ms', trend: 'down' }; }
  async getIndexUsage(startDate, endDate, filters) { return { value: 85, unit: '%', trend: 'stable' }; }
  async getSatisfactionScore(startDate, endDate, filters) { return { value: 4.2, trend: 'up' }; }
  async getNPSScore(startDate, endDate, filters) { return { value: 45, trend: 'up' }; }
  async getFeedbackRate(startDate, endDate, filters) { return { value: 15, unit: '%', trend: 'stable' }; }
  async getTicketResolutionTime(startDate, endDate, filters) { return { value: 4.5, unit: 'hours', trend: 'down' }; }
  async getFirstResponseTime(startDate, endDate, filters) { return { value: 2.5, unit: 'hours', trend: 'down' }; }
  async getEscalationRate(startDate, endDate, filters) { return { value: 5, unit: '%', trend: 'down' }; }
  async getUserGrowth(startDate, endDate, filters) { return { value: 12, unit: '%', trend: 'up' }; }
  async getTicketVolumeGrowth(startDate, endDate, filters) { return { value: 8, unit: '%', trend: 'up' }; }
  async getRevenueImpact(startDate, endDate, filters) { return { value: 25000, unit: '$', trend: 'up' }; }
  async getTeamSize(startDate, endDate, filters) { return { value: 12, trend: 'stable' }; }
  async getActiveMembers(startDate, endDate, filters) { return { value: 10, trend: 'up' }; }
  async getWorkloadDistribution(startDate, endDate, filters) { return { type: 'distribution', data: [] }; }
  async getTicketsHandled(startDate, endDate, filters) { return { value: 150, trend: 'up' }; }
  async getCrossTeamTickets(startDate, endDate, filters) { return { value: 25, unit: '%', trend: 'stable' }; }
  async getKnowledgeSharing(startDate, endDate, filters) { return { value: 78, unit: '%', trend: 'up' }; }

  formatAsJSON(reportData, template) {
    return JSON.stringify(reportData, null, 2);
  }

  formatAsCSV(reportData, template) {
    const csvRows = [];
    
    // Add header
    csvRows.push('Section,Metric,Value,Unit,Trend,Change');
    
    // Add data rows
    reportData.sections.forEach(section => {
      Object.entries(section.metrics).forEach(([metric, data]) => {
        const value = typeof data === 'object' ? data.value : data;
        const unit = typeof data === 'object' ? data.unit || '' : '';
        const trend = typeof data === 'object' ? data.trend || '' : '';
        const change = typeof data === 'object' ? data.change || '' : '';
        
        csvRows.push(`"${section.title}","${metric}","${value}","${unit}","${trend}","${change}"`);
      });
    });
    
    return csvRows.join('\n');
  }

  formatAsHTML(reportData, template) {
    let html = `
      <html>
        <head>
          <title>${reportData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .metric { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }
            .metric-name { font-weight: bold; }
            .metric-value { color: #007bff; font-size: 1.2em; }
            .trend-up { color: #28a745; }
            .trend-down { color: #dc3545; }
            .trend-stable { color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportData.name}</h1>
            <p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
            <p>Time Range: ${reportData.timeRange}</p>
          </div>
    `;
    
    reportData.sections.forEach(section => {
      html += `
        <div class="section">
          <h2>${section.title}</h2>
      `;
      
      Object.entries(section.metrics).forEach(([metric, data]) => {
        const value = typeof data === 'object' ? data.value : data;
        const unit = typeof data === 'object' ? data.unit || '' : '';
        const trend = typeof data === 'object' ? data.trend || 'stable' : 'stable';
        
        html += `
          <div class="metric">
            <span class="metric-name">${metric}:</span>
            <span class="metric-value">${value} ${unit}</span>
            <span class="trend-${trend}">${trend}</span>
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    html += `
        </body>
      </html>
    `;
    
    return html;
  }

  async formatAsPDF(reportData, template) {
    // This would require a PDF library like puppeteer
    // For now, return a placeholder
    return {
      type: 'pdf',
      content: 'PDF generation not implemented yet',
      data: reportData
    };
  }

  recordReportGeneration(templateId, options, reportData) {
    const record = {
      templateId,
      options,
      generatedAt: Date.now(),
      size: JSON.stringify(reportData).length,
      format: options.format || 'json'
    };
    
    if (!this.reportHistory.has(templateId)) {
      this.reportHistory.set(templateId, []);
    }
    
    const history = this.reportHistory.get(templateId);
    history.unshift(record);
    
    // Keep only last 100 records per template
    if (history.length > 100) {
      history.splice(100);
    }
  }

  generateReportSummary(reportData) {
    const summary = {
      totalMetrics: 0,
      sectionsCount: reportData.sections.length,
      hasTrends: false,
      hasChanges: false
    };
    
    reportData.sections.forEach(section => {
      Object.values(section.metrics).forEach(metric => {
        summary.totalMetrics++;
        
        if (typeof metric === 'object') {
          if (metric.trend && metric.trend !== 'stable') {
            summary.hasTrends = true;
          }
          if (metric.change && metric.change !== 0) {
            summary.hasChanges = true;
          }
        }
      });
    });
    
    return summary;
  }

  startScheduledReports() {
    // This would implement scheduled report generation
    // For now, it's a placeholder
    setInterval(() => {
      this.processScheduledReports();
    }, 60000); // Check every minute
  }

  async processScheduledReports() {
    // Process scheduled reports based on their schedules
    // This would check each scheduled report and generate it if due
  }

  async scheduleReport(templateId, schedule, recipients, options = {}) {
    const scheduledReport = {
      id: this.generateReportId(),
      templateId,
      schedule,
      recipients,
      options,
      createdAt: Date.now(),
      lastRun: null,
      nextRun: this.calculateNextRun(schedule),
      active: true
    };
    
    this.scheduledReports.set(scheduledReport.id, scheduledReport);
    
    return scheduledReport;
  }

  calculateNextRun(schedule) {
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (schedule) {
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
  }

  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAvailableTemplates() {
    return Array.from(this.reportTemplates.values());
  }

  getTemplate(templateId) {
    return this.reportTemplates.get(templateId);
  }

  getReportHistory(templateId, limit = 50) {
    const history = this.reportHistory.get(templateId) || [];
    return history.slice(0, limit);
  }

  getScheduledReports() {
    return Array.from(this.scheduledReports.values());
  }

  async createCustomTemplate(templateData) {
    const template = {
      id: this.generateReportId(),
      ...templateData,
      createdAt: Date.now()
    };
    
    this.reportTemplates.set(template.id, template);
    
    return template;
  }

  async deleteTemplate(templateId) {
    return this.reportTemplates.delete(templateId);
  }

  async deleteScheduledReport(reportId) {
    return this.scheduledReports.delete(reportId);
  }

  clearCache() {
    this.reportCache.clear();
  }
}

// Create singleton instance
const reportingSystem = new ReportingSystem();

// Export functions
const generateReport = (templateId, options) => reportingSystem.generateReport(templateId, options);
const getAvailableTemplates = () => reportingSystem.getAvailableTemplates();
const getTemplate = (templateId) => reportingSystem.getTemplate(templateId);
const getReportHistory = (templateId, limit) => reportingSystem.getReportHistory(templateId, limit);
const scheduleReport = (templateId, schedule, recipients, options) => reportingSystem.scheduleReport(templateId, schedule, recipients, options);
const getScheduledReports = () => reportingSystem.getScheduledReports();
const createCustomTemplate = (templateData) => reportingSystem.createCustomTemplate(templateData);
const deleteTemplate = (templateId) => reportingSystem.deleteTemplate(templateId);
const deleteScheduledReport = (reportId) => reportingSystem.deleteScheduledReport(reportId);
const clearCache = () => reportingSystem.clearCache();

module.exports = {
  reportingSystem,
  generateReport,
  getAvailableTemplates,
  getTemplate,
  getReportHistory,
  scheduleReport,
  getScheduledReports,
  createCustomTemplate,
  deleteTemplate,
  deleteScheduledReport,
  clearCache
};
