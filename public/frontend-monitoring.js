// Frontend Monitoring System
class FrontendMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            errorCount: 0,
            apiErrors: 0,
            userInteractions: 0,
            sessionDuration: 0,
            pagesViewed: 1
        };
        
        this.sessionStart = Date.now();
        this.apiCallTimes = [];
        this.errorBuffer = [];
        
        this.init();
    }

    init() {
        // Performance monitoring
        this.observePerformance();
        
        // Error tracking
        this.trackErrors();
        
        // API monitoring
        this.monitorApiCalls();
        
        // User interaction tracking
        this.trackUserInteractions();
        
        // Session tracking
        this.trackSession();
        
        // Send metrics periodically
        setInterval(() => this.sendMetrics(), 30000); // Every 30 seconds
        
        // Send metrics on page unload
        window.addEventListener('beforeunload', () => this.sendMetrics());
    }

    observePerformance() {
        if ('PerformanceObserver' in window) {
            // Core Web Vitals
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        switch (entry.entryType) {
                            case 'largest-contentful-paint':
                                this.metrics.largestContentfulPaint = entry.startTime;
                                break;
                            case 'first-input':
                                this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                                break;
                            case 'layout-shift':
                                if (!entry.hadRecentInput) {
                                    this.metrics.cumulativeLayoutShift += entry.value;
                                }
                                break;
                        }
                    }
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (error) {
                console.warn('Performance observer error:', error);
            }
        }

        // Page load timing
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
                this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            }
        });

        // First Contentful Paint
        if ('PerformancePaintTiming' in window) {
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcp) {
                this.metrics.firstContentfulPaint = fcp.startTime;
            }
        }
    }

    trackErrors() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.metrics.errorCount++;
            const error = {
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            this.errorBuffer.push(error);
            this.sendError(error);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.metrics.errorCount++;
            const error = {
                type: 'promise',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            this.errorBuffer.push(error);
            this.sendError(error);
        });
    }

    monitorApiCalls() {
        // Override fetch to monitor API calls
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const startTime = performance.now();
            const url = args[0];
            const options = args[1] || {};
            
            try {
                const response = await originalFetch.apply(this, args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Track API call metrics
                self.apiCallTimes.push({
                    url: url,
                    method: options.method || 'GET',
                    duration: duration,
                    status: response.status,
                    timestamp: Date.now()
                });
                
                // Track API errors
                if (!response.ok) {
                    self.metrics.apiErrors++;
                    const apiError = {
                        type: 'api',
                        url: url,
                        method: options.method || 'GET',
                        status: response.status,
                        statusText: response.statusText,
                        timestamp: Date.now()
                    };
                    
                    self.errorBuffer.push(apiError);
                    self.sendError(apiError);
                }
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                self.metrics.apiErrors++;
                const apiError = {
                    type: 'api',
                    url: url,
                    method: options.method || 'GET',
                    error: error.message,
                    duration: duration,
                    timestamp: Date.now()
                };
                
                self.errorBuffer.push(apiError);
                self.sendError(apiError);
                throw error;
            }
        };
    }

    trackUserInteractions() {
        let clickCount = 0;
        let keyPressCount = 0;
        let scrollCount = 0;
        
        // Click tracking
        document.addEventListener('click', () => {
            clickCount++;
            this.metrics.userInteractions++;
        });
        
        // Keyboard tracking
        document.addEventListener('keypress', () => {
            keyPressCount++;
            this.metrics.userInteractions++;
        });
        
        // Scroll tracking
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                scrollCount++;
                this.metrics.userInteractions++;
            }, 100);
        });
        
        // Form interaction tracking
        document.addEventListener('submit', (event) => {
            this.trackFormSubmission(event);
        });
    }

    trackFormSubmission(event) {
        const form = event.target;
        const formData = new FormData(form);
        const formName = form.id || form.className || 'unknown_form';
        
        const formMetrics = {
            type: 'form_submission',
            formName: formName,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        // Send form submission metrics
        this.sendMetric('form_submission', formMetrics);
    }

    trackSession() {
        // Update session duration periodically
        setInterval(() => {
            this.metrics.sessionDuration = Date.now() - this.sessionStart;
        }, 5000);
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.metrics.pagesViewed++;
            }
        });
    }

    sendError(error) {
        // Send error to backend immediately
        fetch('/api/monitoring/error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(error)
        }).catch(err => {
            console.warn('Failed to send error to monitoring:', err);
        });
    }

    sendMetric(type, data) {
        // Send metric to backend
        fetch('/api/monitoring/metric', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                data: data,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(err => {
            console.warn('Failed to send metric to monitoring:', err);
        });
    }

    sendMetrics() {
        this.metrics.sessionDuration = Date.now() - this.sessionStart;
        
        const metricsData = {
            ...this.metrics,
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            connectionType: navigator.connection?.effectiveType || 'unknown',
            apiCallStats: this.calculateApiStats()
        };
        
        // Send comprehensive metrics
        fetch('/api/monitoring/metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metricsData)
        }).catch(err => {
            console.warn('Failed to send metrics to monitoring:', err);
        });
    }

    calculateApiStats() {
        if (this.apiCallTimes.length === 0) {
            return {
                totalCalls: 0,
                averageResponseTime: 0,
                slowestCall: 0,
                fastestCall: 0,
                errorRate: 0
            };
        }
        
        const durations = this.apiCallTimes.map(call => call.duration);
        const errors = this.apiCallTimes.filter(call => call.status >= 400);
        
        return {
            totalCalls: this.apiCallTimes.length,
            averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
            slowestCall: Math.max(...durations),
            fastestCall: Math.min(...durations),
            errorRate: (errors.length / this.apiCallTimes.length) * 100
        };
    }

    // Public method to get current metrics
    getMetrics() {
        this.metrics.sessionDuration = Date.now() - this.sessionStart;
        return {
            ...this.metrics,
            apiCallStats: this.calculateApiStats()
        };
    }
}

// Initialize monitoring when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.nexusMonitor = new FrontendMonitor();
    });
} else {
    window.nexusMonitor = new FrontendMonitor();
}
