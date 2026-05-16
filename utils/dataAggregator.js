/**
 * NEXUS Data Aggregator Utility
 * 
 * Handles data aggregation, processing, and transformation for analytics
 * and reporting purposes.
 */

class DataAggregator {
    constructor() {
        this.cache = new Map();
        this.defaultCacheTime = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Aggregate data by time period
     */
    aggregateByTime(data, timeField, period = 'day') {
        try {
            const aggregated = {};
            
            data.forEach(item => {
                const time = new Date(item[timeField]);
                let key;
                
                switch (period) {
                    case 'hour':
                        key = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}-${time.getHours()}`;
                        break;
                    case 'day':
                        key = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}`;
                        break;
                    case 'week':
                        const weekStart = new Date(time);
                        weekStart.setDate(time.getDate() - time.getDay());
                        key = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
                        break;
                    case 'month':
                        key = `${time.getFullYear()}-${time.getMonth()}`;
                        break;
                    case 'quarter':
                        key = `${time.getFullYear()}-Q${Math.floor(time.getMonth() / 3) + 1}`;
                        break;
                    case 'year':
                        key = `${time.getFullYear()}`;
                        break;
                    default:
                        key = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}`;
                }
                
                if (!aggregated[key]) {
                    aggregated[key] = {
                        period: key,
                        count: 0,
                        sum: 0,
                        min: Infinity,
                        max: -Infinity,
                        items: []
                    };
                }
                
                aggregated[key].count++;
                aggregated[key].sum += item.value || 0;
                aggregated[key].min = Math.min(aggregated[key].min, item.value || 0);
                aggregated[key].max = Math.max(aggregated[key].max, item.value || 0);
                aggregated[key].items.push(item);
            });
            
            // Calculate averages
            Object.keys(aggregated).forEach(key => {
                const data = aggregated[key];
                data.average = data.count > 0 ? data.sum / data.count : 0;
                data.min = data.min === Infinity ? 0 : data.min;
                data.max = data.max === -Infinity ? 0 : data.max;
            });
            
            return Object.values(aggregated);
        } catch (error) {
            console.error('Error aggregating data by time:', error);
            throw error;
        }
    }

    /**
     * Aggregate data by category
     */
    aggregateByCategory(data, categoryField, valueField = 'value') {
        try {
            const aggregated = {};
            
            data.forEach(item => {
                const category = item[categoryField] || 'unknown';
                const value = item[valueField] || 0;
                
                if (!aggregated[category]) {
                    aggregated[category] = {
                        category,
                        count: 0,
                        sum: 0,
                        min: Infinity,
                        max: -Infinity,
                        items: []
                    };
                }
                
                aggregated[category].count++;
                aggregated[category].sum += value;
                aggregated[category].min = Math.min(aggregated[category].min, value);
                aggregated[category].max = Math.max(aggregated[category].max, value);
                aggregated[category].items.push(item);
            });
            
            // Calculate averages
            Object.keys(aggregated).forEach(key => {
                const data = aggregated[key];
                data.average = data.count > 0 ? data.sum / data.count : 0;
                data.min = data.min === Infinity ? 0 : data.min;
                data.max = data.max === -Infinity ? 0 : data.max;
            });
            
            return Object.values(aggregated);
        } catch (error) {
            console.error('Error aggregating data by category:', error);
            throw error;
        }
    }

    /**
     * Calculate moving average
     */
    calculateMovingAverage(data, period = 7) {
        try {
            const result = [];
            
            for (let i = 0; i < data.length; i++) {
                const start = Math.max(0, i - period + 1);
                const end = i + 1;
                const subset = data.slice(start, end);
                
                const sum = subset.reduce((acc, item) => acc + (item.value || 0), 0);
                const average = sum / subset.length;
                
                result.push({
                    ...data[i],
                    movingAverage: average,
                    period
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error calculating moving average:', error);
            throw error;
        }
    }

    /**
     * Calculate trend
     */
    calculateTrend(data, valueField = 'value') {
        try {
            if (data.length < 2) {
                return { trend: 'stable', change: 0, slope: 0 };
            }
            
            const values = data.map(item => item[valueField] || 0);
            const n = values.length;
            
            // Calculate linear regression
            const sumX = (n * (n - 1)) / 2;
            const sumY = values.reduce((sum, val) => sum + val, 0);
            const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
            const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            // Determine trend
            let trend = 'stable';
            if (Math.abs(slope) < 0.01) {
                trend = 'stable';
            } else if (slope > 0) {
                trend = 'increasing';
            } else {
                trend = 'decreasing';
            }
            
            // Calculate percent change
            const firstValue = values[0] || 0;
            const lastValue = values[values.length - 1] || 0;
            const change = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
            
            return { trend, change, slope, intercept };
        } catch (error) {
            console.error('Error calculating trend:', error);
            throw error;
        }
    }

    /**
     * Calculate percentiles
     */
    calculatePercentiles(data, valueField = 'value', percentiles = [25, 50, 75, 90, 95, 99]) {
        try {
            const values = data.map(item => item[valueField] || 0).sort((a, b) => a - b);
            const result = {};
            
            percentiles.forEach(p => {
                const index = Math.ceil((p / 100) * values.length) - 1;
                result[`p${p}`] = values[Math.max(0, Math.min(index, values.length - 1))];
            });
            
            return result;
        } catch (error) {
            console.error('Error calculating percentiles:', error);
            throw error;
        }
    }

    /**
     * Group data by multiple fields
     */
    groupByMultipleFields(data, fields) {
        try {
            const grouped = {};
            
            data.forEach(item => {
                const key = fields.map(field => item[field] || 'unknown').join('|');
                
                if (!grouped[key]) {
                    grouped[key] = {
                        group: key,
                        count: 0,
                        sum: 0,
                        items: []
                    };
                }
                
                grouped[key].count++;
                grouped[key].sum += item.value || 0;
                grouped[key].items.push(item);
            });
            
            // Calculate averages
            Object.keys(grouped).forEach(key => {
                const data = grouped[key];
                data.average = data.count > 0 ? data.sum / data.count : 0;
            });
            
            return Object.values(grouped);
        } catch (error) {
            console.error('Error grouping by multiple fields:', error);
            throw error;
        }
    }

    /**
     * Filter data by date range
     */
    filterByDateRange(data, dateField, startDate, endDate) {
        try {
            return data.filter(item => {
                const date = new Date(item[dateField]);
                return date >= startDate && date <= endDate;
            });
        } catch (error) {
            console.error('Error filtering by date range:', error);
            throw error;
        }
    }

    /**
     * Calculate growth rate
     */
    calculateGrowthRate(data, valueField = 'value') {
        try {
            if (data.length < 2) {
                return 0;
            }
            
            const firstValue = data[0][valueField] || 0;
            const lastValue = data[data.length - 1][valueField] || 0;
            
            if (firstValue === 0) {
                return lastValue > 0 ? 100 : 0;
            }
            
            return ((lastValue - firstValue) / firstValue) * 100;
        } catch (error) {
            console.error('Error calculating growth rate:', error);
            throw error;
        }
    }

    /**
     * Calculate compound annual growth rate (CAGR)
     */
    calculateCAGR(data, valueField = 'value') {
        try {
            if (data.length < 2) {
                return 0;
            }
            
            const firstValue = data[0][valueField] || 0;
            const lastValue = data[data.length - 1][valueField] || 0;
            const years = data.length - 1;
            
            if (firstValue <= 0) {
                return 0;
            }
            
            return (Math.pow(lastValue / firstValue, 1 / years) - 1) * 100;
        } catch (error) {
            console.error('Error calculating CAGR:', error);
            throw error;
        }
    }

    /**
     * Smooth data using exponential moving average
     */
    smoothData(data, alpha = 0.3) {
        try {
            const smoothed = [];
            let previousValue = null;
            
            data.forEach((item, index) => {
                const value = item.value || 0;
                
                if (index === 0) {
                    previousValue = value;
                } else {
                    previousValue = alpha * value + (1 - alpha) * previousValue;
                }
                
                smoothed.push({
                    ...item,
                    smoothedValue: previousValue
                });
            });
            
            return smoothed;
        } catch (error) {
            console.error('Error smoothing data:', error);
            throw error;
        }
    }

    /**
     * Detect outliers using IQR method
     */
    detectOutliers(data, valueField = 'value') {
        try {
            const values = data.map(item => item[valueField] || 0).sort((a, b) => a - b);
            const q1 = values[Math.floor(values.length * 0.25)];
            const q3 = values[Math.floor(values.length * 0.75)];
            const iqr = q3 - q1;
            
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            const outliers = data.filter(item => {
                const value = item[valueField] || 0;
                return value < lowerBound || value > upperBound;
            });
            
            return {
                outliers,
                lowerBound,
                upperBound,
                iqr,
                q1,
                q3
            };
        } catch (error) {
            console.error('Error detecting outliers:', error);
            throw error;
        }
    }

    /**
     * Calculate correlation coefficient
     */
    calculateCorrelation(data, field1, field2) {
        try {
            const n = data.length;
            if (n < 2) return 0;
            
            const values1 = data.map(item => item[field1] || 0);
            const values2 = data.map(item => item[field2] || 0);
            
            const sum1 = values1.reduce((sum, val) => sum + val, 0);
            const sum2 = values2.reduce((sum, val) => sum + val, 0);
            const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
            const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
            const sum12 = values1.reduce((sum, val, index) => sum + val * values2[index], 0);
            
            const numerator = n * sum12 - sum1 * sum2;
            const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
            
            return denominator === 0 ? 0 : numerator / denominator;
        } catch (error) {
            console.error('Error calculating correlation:', error);
            throw error;
        }
    }

    /**
     * Cache aggregated data
     */
    cacheData(key, data, ttl = this.defaultCacheTime) {
        try {
            this.cache.set(key, {
                data,
                timestamp: Date.now(),
                ttl
            });
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }

    /**
     * Get cached data
     */
    getCachedData(key) {
        try {
            const cached = this.cache.get(key);
            
            if (!cached) {
                return null;
            }
            
            const now = Date.now();
            if (now - cached.timestamp > cached.ttl) {
                this.cache.delete(key);
                return null;
            }
            
            return cached.data;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        try {
            const now = Date.now();
            
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > value.ttl) {
                    this.cache.delete(key);
                }
            }
        } catch (error) {
            console.error('Error clearing expired cache:', error);
        }
    }

    /**
     * Transform data for chart visualization
     */
    transformForChart(data, chartType, options = {}) {
        try {
            switch (chartType) {
                case 'line':
                case 'area':
                    return this.transformForLineChart(data, options);
                case 'bar':
                case 'column':
                    return this.transformForBarChart(data, options);
                case 'pie':
                case 'doughnut':
                    return this.transformForPieChart(data, options);
                case 'scatter':
                    return this.transformForScatterChart(data, options);
                case 'gauge':
                    return this.transformForGaugeChart(data, options);
                default:
                    return data;
            }
        } catch (error) {
            console.error('Error transforming data for chart:', error);
            throw error;
        }
    }

    transformForLineChart(data, options) {
        const { xField = 'date', yField = 'value', labelField = 'label' } = options;
        
        return {
            labels: data.map(item => item[xField] || item[labelField] || ''),
            datasets: [{
                label: options.datasetLabel || 'Data',
                data: data.map(item => item[yField] || 0),
                borderColor: options.borderColor || '#3b82f6',
                backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.1)',
                tension: options.tension || 0.4
            }]
        };
    }

    transformForBarChart(data, options) {
        const { xField = 'category', yField = 'value', labelField = 'label' } = options;
        
        return {
            labels: data.map(item => item[xField] || item[labelField] || ''),
            datasets: [{
                label: options.datasetLabel || 'Data',
                data: data.map(item => item[yField] || 0),
                backgroundColor: options.backgroundColor || '#3b82f6',
                borderColor: options.borderColor || '#1e40af'
            }]
        };
    }

    transformForPieChart(data, options) {
        const { labelField = 'category', valueField = 'value' } = options;
        
        return {
            labels: data.map(item => item[labelField] || ''),
            datasets: [{
                data: data.map(item => item[valueField] || 0),
                backgroundColor: options.backgroundColor || [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
                ]
            }]
        };
    }

    transformForScatterChart(data, options) {
        const { xField = 'x', yField = 'y' } = options;
        
        return {
            datasets: [{
                label: options.datasetLabel || 'Data',
                data: data.map(item => ({
                    x: item[xField] || 0,
                    y: item[yField] || 0
                })),
                backgroundColor: options.backgroundColor || '#3b82f6'
            }]
        };
    }

    transformForGaugeChart(data, options) {
        const { valueField = 'value', maxField = 'max' } = options;
        
        const item = data[0] || {};
        const value = item[valueField] || 0;
        const max = item[maxField] || 100;
        
        return {
            value,
            max,
            percentage: (value / max) * 100
        };
    }
}

module.exports = DataAggregator;
