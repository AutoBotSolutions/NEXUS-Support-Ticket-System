/**
 * NEXUS Analytics Dashboard Frontend
 * 
 * Frontend JavaScript for analytics dashboard, data visualization,
 * and interactive reporting components.
 */

class AnalyticsDashboard {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            refreshInterval: options.refreshInterval || 30000,
            autoRefresh: options.autoRefresh !== false,
            theme: options.theme || 'light',
            chartLibrary: options.chartLibrary || 'chartjs'
        };
        
        this.container = document.getElementById(containerId);
        this.charts = new Map();
        this.widgets = new Map();
        this.filters = new Map();
        this.dataCache = new Map();
        
        this.init();
    }

    async init() {
        try {
            this.setupContainer();
            await this.loadDashboard();
            this.setupEventListeners();
            
            if (this.options.autoRefresh) {
                this.startAutoRefresh();
            }
        } catch (error) {
            console.error('Error initializing analytics dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    setupContainer() {
        if (!this.container) {
            throw new Error(`Container with ID '${this.containerId}' not found`);
        }

        this.container.innerHTML = `
            <div class="analytics-dashboard">
                <div class="dashboard-header">
                    <div class="dashboard-title">
                        <h2>NEXUS Analytics Dashboard</h2>
                        <div class="dashboard-controls">
                            <button class="refresh-btn" title="Refresh Data">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button class="fullscreen-btn" title="Toggle Fullscreen">
                                <i class="fas fa-expand"></i>
                            </button>
                            <div class="date-range-selector">
                                <select id="dateRange" class="form-select">
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d" selected>Last 30 Days</option>
                                    <option value="90d">Last 90 Days</option>
                                    <option value="1y">Last Year</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-filters"></div>
                </div>
                <div class="dashboard-content">
                    <div class="dashboard-grid"></div>
                    <div class="loading-overlay" style="display: none;">
                        <div class="spinner"></div>
                        <p>Loading analytics data...</p>
                    </div>
                </div>
                <div class="dashboard-footer">
                    <div class="dashboard-info">
                        <span class="last-updated">Last updated: Never</span>
                        <span class="data-count">0 widgets</span>
                    </div>
                </div>
            </div>
        `;

        this.gridElement = this.container.querySelector('.dashboard-grid');
        this.loadingOverlay = this.container.querySelector('.loading-overlay');
        this.lastUpdatedElement = this.container.querySelector('.last-updated');
        this.dataCountElement = this.container.querySelector('.data-count');
    }

    async loadDashboard() {
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/analytics/dashboard');
            const data = await response.json();
            
            if (data.success) {
                await this.renderDashboard(data.data);
                this.updateLastUpdated();
            } else {
                throw new Error(data.error || 'Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.showLoading(false);
        }
    }

    async renderDashboard(dashboardData) {
        this.gridElement.innerHTML = '';
        this.widgets.clear();
        this.charts.clear();

        const widgets = dashboardData.widgets || [];
        
        for (const widgetConfig of widgets) {
            await this.addWidget(widgetConfig);
        }

        this.updateDataCount(widgets.length);
    }

    async addWidget(widgetConfig) {
        const widgetId = widgetConfig.id || `widget_${Date.now()}`;
        
        const widgetElement = document.createElement('div');
        widgetElement.className = `dashboard-widget ${widgetConfig.type || 'card'}`;
        widgetElement.id = widgetId;
        
        // Set widget position
        if (widgetConfig.position) {
            widgetElement.style.gridColumn = `span ${widgetConfig.position.width || 4}`;
            widgetElement.style.gridRow = `span ${widgetConfig.position.height || 3}`;
        }

        widgetElement.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${widgetConfig.title}</h3>
                <div class="widget-controls">
                    <button class="widget-refresh" title="Refresh Widget">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="widget-settings" title="Widget Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="widget-maximize" title="Maximize">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="widget-loading">
                    <div class="spinner"></div>
                </div>
            </div>
            <div class="widget-footer">
                <span class="widget-status"></span>
            </div>
        `;

        this.gridElement.appendChild(widgetElement);
        
        // Store widget reference
        this.widgets.set(widgetId, {
            element: widgetElement,
            config: widgetConfig,
            data: null
        });

        // Load widget data
        await this.loadWidgetData(widgetId, widgetConfig);
        
        // Setup widget event listeners
        this.setupWidgetEventListeners(widgetId);
    }

    async loadWidgetData(widgetId, widgetConfig) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        try {
            this.showWidgetLoading(widgetId, true);
            
            const { dataSource } = widgetConfig;
            let data;

            if (dataSource.type === 'static') {
                data = dataSource.data || [];
            } else {
                const queryParams = new URLSearchParams(dataSource.query || {});
                const url = `/api/analytics/${dataSource.type}?${queryParams}`;
                
                const response = await fetch(url);
                const result = await response.json();
                
                if (result.success) {
                    data = result.data;
                } else {
                    throw new Error(result.error || 'Failed to load widget data');
                }
            }

            widget.data = data;
            
            // Render widget based on type
            await this.renderWidget(widgetId, data);
            
            this.updateWidgetStatus(widgetId, 'success', 'Data loaded successfully');
        } catch (error) {
            console.error(`Error loading widget data for ${widgetId}:`, error);
            this.showWidgetError(widgetId, error.message);
            this.updateWidgetStatus(widgetId, 'error', 'Failed to load data');
        } finally {
            this.showWidgetLoading(widgetId, false);
        }
    }

    async renderWidget(widgetId, data) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        const { config } = widget;
        const contentElement = widget.element.querySelector('.widget-content');
        
        switch (config.type) {
            case 'kpi_card':
                this.renderKPICard(widgetId, data, contentElement);
                break;
            case 'chart':
                await this.renderChart(widgetId, data, contentElement);
                break;
            case 'table':
                this.renderTable(widgetId, data, contentElement);
                break;
            case 'list':
                this.renderList(widgetId, data, contentElement);
                break;
            case 'metric':
                this.renderMetric(widgetId, data, contentElement);
                break;
            case 'gauge':
                await this.renderGauge(widgetId, data, contentElement);
                break;
            case 'progress':
                await this.renderProgress(widgetId, data, contentElement);
                break;
            case 'alert':
                this.renderAlert(widgetId, data, contentElement);
                break;
            case 'feed':
                this.renderFeed(widgetId, data, contentElement);
                break;
            default:
                this.renderDefault(widgetId, data, contentElement);
        }
    }

    renderKPICard(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { title, value, trend, comparison } = data;
        
        container.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-value">${this.formatValue(value, config.format)}</div>
                <div class="kpi-title">${title}</div>
                ${trend ? `
                    <div class="kpi-trend ${trend.direction}">
                        <i class="fas fa-arrow-${trend.direction}"></i>
                        <span>${trend.value}%</span>
                    </div>
                ` : ''}
                ${comparison ? `
                    <div class="kpi-comparison">
                        <span class="comparison-label">${comparison.label}:</span>
                        <span class="comparison-value">${this.formatValue(comparison.value, config.format)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderChart(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { visualization } = config;
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${widgetId}`;
        container.innerHTML = '';
        container.appendChild(canvas);
        
        try {
            const chartConfig = this.generateChartConfig(visualization.chartType, data, visualization);
            
            if (this.options.chartLibrary === 'chartjs' && window.Chart) {
                const ctx = canvas.getContext('2d');
                const chart = new Chart(ctx, chartConfig);
                this.charts.set(widgetId, chart);
            } else {
                // Fallback to simple table if Chart.js is not available
                this.renderTable(widgetId, data, container);
            }
        } catch (error) {
            console.error(`Error rendering chart for ${widgetId}:`, error);
            this.showWidgetError(widgetId, 'Failed to render chart');
        }
    }

    renderTable(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { headers, rows } = data;
        
        if (!headers || !rows) {
            container.innerHTML = '<p>No data available</p>';
            return;
        }

        let tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                ${Array.isArray(row) ? row.map(cell => `<td>${cell}</td>`).join('') : 
                                  headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    renderList(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { items = [] } = data;
        
        container.innerHTML = `
            <div class="list-container">
                <ul class="data-list">
                    ${items.map(item => `
                        <li class="list-item">
                            <div class="item-title">${item.title || item.name || item.label}</div>
                            <div class="item-value">${this.formatValue(item.value, config.format)}</div>
                            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderMetric(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { value, label, unit, threshold } = data;
        
        const thresholdClass = threshold && value > threshold.value ? 'threshold-exceeded' : '';
        
        container.innerHTML = `
            <div class="metric-display ${thresholdClass}">
                <div class="metric-value">${this.formatValue(value, config.format)}</div>
                <div class="metric-label">${label}</div>
                ${unit ? `<div class="metric-unit">${unit}</div>` : ''}
                ${threshold ? `
                    <div class="metric-threshold">
                        <span class="threshold-label">Threshold:</span>
                        <span class="threshold-value">${threshold.value}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderGauge(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { value, max, label } = data;
        
        const percentage = Math.min((value / max) * 100, 100);
        
        container.innerHTML = `
            <div class="gauge-container">
                <div class="gauge-chart">
                    <div class="gauge-fill" style="width: ${percentage}%"></div>
                    <div class="gauge-value">${this.formatValue(value, config.format)}</div>
                </div>
                <div class="gauge-label">${label}</div>
                <div class="gauge-max">Max: ${this.formatValue(max, config.format)}</div>
            </div>
        `;
    }

    async renderProgress(widgetId, data, container) {
        const { config } = this.widgets.get(widgetId);
        const { value, max, label, color } = data;
        
        const percentage = Math.min((value / max) * 100, 100);
        
        container.innerHTML = `
            <div class="progress-container">
                <div class="progress-label">${label}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%; background-color: ${color || '#3b82f6'}"></div>
                    <div class="progress-value">${percentage.toFixed(1)}%</div>
                </div>
                <div class="progress-details">
                    <span>${this.formatValue(value, config.format)} / ${this.formatValue(max, config.format)}</span>
                </div>
            </div>
        `;
    }

    renderAlert(widgetId, data, container) {
        const { alerts = [] } = data;
        
        container.innerHTML = `
            <div class="alert-container">
                ${alerts.map(alert => `
                    <div class="alert-item ${alert.severity || 'info'}">
                        <div class="alert-icon">
                            <i class="fas fa-${this.getAlertIcon(alert.severity)}"></i>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">${alert.title}</div>
                            <div class="alert-message">${alert.message}</div>
                            <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                        </div>
                    </div>
                `).join('')}
                ${alerts.length === 0 ? '<p>No alerts</p>' : ''}
            </div>
        `;
    }

    renderFeed(widgetId, data, container) {
        const { items = [] } = data;
        
        container.innerHTML = `
            <div class="feed-container">
                ${items.map(item => `
                    <div class="feed-item">
                        <div class="feed-icon">
                            <i class="fas fa-${item.icon || 'info-circle'}"></i>
                        </div>
                        <div class="feed-content">
                            <div class="feed-title">${item.title}</div>
                            <div class="feed-message">${item.message}</div>
                            <div class="feed-time">${this.formatTime(item.timestamp)}</div>
                        </div>
                    </div>
                `).join('')}
                ${items.length === 0 ? '<p>No recent activity</p>' : ''}
            </div>
        `;
    }

    renderDefault(widgetId, data, container) {
        container.innerHTML = `
            <div class="default-widget">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }

    generateChartConfig(chartType, data, options) {
        const chartData = this.formatChartData(chartType, data, options);
        const chartOptions = this.generateChartOptions(chartType, options);
        
        return {
            type: chartType,
            data: chartData,
            options: chartOptions
        };
    }

    formatChartData(chartType, data, options) {
        switch (chartType) {
            case 'line':
            case 'area':
                return this.formatLineChartData(data, options);
            case 'bar':
                return this.formatBarChartData(data, options);
            case 'pie':
            case 'doughnut':
                return this.formatPieChartData(data, options);
            default:
                return data;
        }
    }

    formatLineChartData(data, options) {
        return {
            labels: data.labels || [],
            datasets: data.datasets || [{
                label: options.datasetLabel || 'Data',
                data: data.values || [],
                borderColor: options.borderColor || '#3b82f6',
                backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: chartType === 'area'
            }]
        };
    }

    formatBarChartData(data, options) {
        return {
            labels: data.labels || [],
            datasets: data.datasets || [{
                label: options.datasetLabel || 'Data',
                data: data.values || [],
                backgroundColor: options.backgroundColor || '#3b82f6',
                borderColor: options.borderColor || '#1e40af'
            }]
        };
    }

    formatPieChartData(data, options) {
        return {
            labels: data.labels || [],
            datasets: [{
                data: data.values || [],
                backgroundColor: options.backgroundColor || [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
                ]
            }]
        };
    }

    generateChartOptions(chartType, options) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: options.showLegend !== false,
                    position: options.legendPosition || 'top'
                },
                tooltip: {
                    enabled: options.showTooltip !== false
                }
            }
        };

        if (chartType === 'line' || chartType === 'bar') {
            baseOptions.scales = {
                y: {
                    beginAtZero: options.beginAtZero !== false
                }
            };
        }

        return baseOptions;
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = this.container.querySelector('.refresh-btn');
        refreshBtn.addEventListener('click', () => this.refreshDashboard());

        // Fullscreen button
        const fullscreenBtn = this.container.querySelector('.fullscreen-btn');
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Date range selector
        const dateRange = this.container.querySelector('#dateRange');
        dateRange.addEventListener('change', (e) => this.handleDateRangeChange(e.target.value));
    }

    setupWidgetEventListeners(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        const widgetElement = widget.element;

        // Widget refresh
        const refreshBtn = widgetElement.querySelector('.widget-refresh');
        refreshBtn.addEventListener('click', () => this.refreshWidget(widgetId));

        // Widget settings
        const settingsBtn = widgetElement.querySelector('.widget-settings');
        settingsBtn.addEventListener('click', () => this.showWidgetSettings(widgetId));

        // Widget maximize
        const maximizeBtn = widgetElement.querySelector('.widget-maximize');
        maximizeBtn.addEventListener('click', () => this.toggleWidgetMaximize(widgetId));
    }

    async refreshDashboard() {
        await this.loadDashboard();
    }

    async refreshWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            await this.loadWidgetData(widgetId, widget.config);
        }
    }

    showWidgetSettings(widgetId) {
        // Implementation for widget settings modal
        console.log('Show widget settings for:', widgetId);
    }

    toggleWidgetMaximize(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            widget.element.classList.toggle('maximized');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    handleDateRangeChange(range) {
        // Implementation for date range change
        console.log('Date range changed to:', range);
        this.refreshDashboard();
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showWidgetLoading(widgetId, show) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            const loadingElement = widget.element.querySelector('.widget-loading');
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showWidgetError(widgetId, message) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            const contentElement = widget.element.querySelector('.widget-content');
            contentElement.innerHTML = `
                <div class="widget-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    updateWidgetStatus(widgetId, status, message) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            const statusElement = widget.element.querySelector('.widget-status');
            statusElement.textContent = message;
            statusElement.className = `widget-status ${status}`;
        }
    }

    updateLastUpdated() {
        this.lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
    }

    updateDataCount(count) {
        this.dataCountElement.textContent = `${count} widgets`;
    }

    showError(message) {
        this.gridElement.innerHTML = `
            <div class="dashboard-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Reload</button>
            </div>
        `;
    }

    formatValue(value, format) {
        if (value === null || value === undefined) return 'N/A';
        
        switch (format) {
            case 'number':
                return Number(value).toLocaleString();
            case 'percentage':
                return `${Number(value).toFixed(1)}%`;
            case 'currency':
                return `$${Number(value).toLocaleString()}`;
            case 'duration':
                return this.formatDuration(value);
            default:
                return value.toString();
        }
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    getAlertIcon(severity) {
        const icons = {
            'critical': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle',
            'success': 'check-circle'
        };
        return icons[severity] || 'info-circle';
    }

    startAutoRefresh() {
        setInterval(() => {
            this.refreshDashboard();
        }, this.options.refreshInterval);
    }

    destroy() {
        // Clean up charts
        this.charts.forEach(chart => {
            if (chart.destroy) {
                chart.destroy();
            }
        });
        
        this.charts.clear();
        this.widgets.clear();
        this.dataCache.clear();
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && window.AnalyticsDashboard) {
        // Auto-initialize dashboard if container exists
        const container = document.getElementById('analytics-dashboard');
        if (container) {
            new AnalyticsDashboard('analytics-dashboard');
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsDashboard;
} else if (typeof window !== 'undefined') {
    window.AnalyticsDashboard = AnalyticsDashboard;
}
