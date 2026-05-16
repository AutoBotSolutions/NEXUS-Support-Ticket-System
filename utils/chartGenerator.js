/**
 * NEXUS Chart Generator Utility
 * 
 * Handles chart generation, configuration, and data formatting
 * for various chart types used in analytics and reporting.
 */

class ChartGenerator {
    constructor() {
        this.defaultColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
            '#06b6d4', '#a855f7', '#f43f5e', '#22c55e', '#eab308'
        ];
        
        this.chartTypes = [
            'line', 'bar', 'pie', 'doughnut', 'radar', 'polar',
            'scatter', 'bubble', 'area', 'gauge', 'progress', 'table'
        ];
    }

    /**
     * Generate chart configuration
     */
    generateChart(type, data, options = {}) {
        try {
            if (!this.chartTypes.includes(type)) {
                throw new Error(`Unsupported chart type: ${type}`);
            }

            const config = {
                type,
                data: this.formatData(type, data, options),
                options: this.generateOptions(type, options)
            };

            return config;
        } catch (error) {
            console.error('Error generating chart:', error);
            throw error;
        }
    }

    /**
     * Format data for specific chart type
     */
    formatData(type, data, options = {}) {
        try {
            switch (type) {
                case 'line':
                case 'area':
                    return this.formatLineData(data, options);
                case 'bar':
                    return this.formatBarData(data, options);
                case 'pie':
                case 'doughnut':
                    return this.formatPieData(data, options);
                case 'radar':
                    return this.formatRadarData(data, options);
                case 'polar':
                    return this.formatPolarData(data, options);
                case 'scatter':
                    return this.formatScatterData(data, options);
                case 'bubble':
                    return this.formatBubbleData(data, options);
                case 'gauge':
                    return this.formatGaugeData(data, options);
                case 'progress':
                    return this.formatProgressData(data, options);
                case 'table':
                    return this.formatTableData(data, options);
                default:
                    return data;
            }
        } catch (error) {
            console.error('Error formatting chart data:', error);
            throw error;
        }
    }

    /**
     * Generate chart options
     */
    generateOptions(type, options = {}) {
        try {
            const baseOptions = {
                responsive: options.responsive !== false,
                maintainAspectRatio: options.maintainAspectRatio !== false,
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: options.legendPosition || 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        enabled: options.showTooltip !== false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 4,
                        displayColors: true,
                        callbacks: options.tooltipCallbacks || {}
                    }
                }
            };

            // Add type-specific options
            switch (type) {
                case 'line':
                case 'area':
                    return {
                        ...baseOptions,
                        scales: this.generateScalesOptions(options),
                        elements: {
                            line: {
                                tension: options.tension || 0.4,
                                borderWidth: options.lineWidth || 2,
                                fill: type === 'area' ? true : false
                            },
                            point: {
                                radius: options.pointRadius || 4,
                                hoverRadius: options.pointHoverRadius || 6
                            }
                        }
                    };

                case 'bar':
                    return {
                        ...baseOptions,
                        scales: this.generateScalesOptions(options),
                        plugins: {
                            ...baseOptions.plugins,
                            datalabels: options.showDataLabels ? {
                                display: true,
                                color: '#ffffff',
                                font: {
                                    weight: 'bold'
                                }
                            } : undefined
                        }
                    };

                case 'pie':
                case 'doughnut':
                    return {
                        ...baseOptions,
                        cutout: type === 'doughnut' ? '50%' : 0,
                        plugins: {
                            ...baseOptions.plugins,
                            datalabels: options.showDataLabels ? {
                                display: true,
                                color: '#ffffff',
                                font: {
                                    weight: 'bold'
                                },
                                formatter: (value, context) => {
                                    const sum = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / sum) * 100).toFixed(1);
                                    return `${percentage}%`;
                                }
                            } : undefined
                        }
                    };

                case 'radar':
                    return {
                        ...baseOptions,
                        scales: {
                            r: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            }
                        }
                    };

                case 'gauge':
                    return {
                        ...baseOptions,
                        cutout: '70%',
                        rotation: -90,
                        circumference: 180,
                        plugins: {
                            ...baseOptions.plugins,
                            datalabels: {
                                display: true,
                                color: '#ffffff',
                                font: {
                                    size: 24,
                                    weight: 'bold'
                                },
                                formatter: (value) => `${value}%`
                            }
                        }
                    };

                case 'progress':
                    return {
                        ...baseOptions,
                        cutout: '80%',
                        plugins: {
                            ...baseOptions.plugins,
                            datalabels: {
                                display: true,
                                color: '#ffffff',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                },
                                formatter: (value) => `${value}%`
                            }
                        }
                    };

                default:
                    return baseOptions;
            }
        } catch (error) {
            console.error('Error generating chart options:', error);
            throw error;
        }
    }

    /**
     * Format data for line/area charts
     */
    formatLineData(data, options = {}) {
        const { xField = 'x', yField = 'y', labelField = 'label' } = options;
        
        const datasets = [];
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            // Single dataset
            if (data[0][yField] !== undefined) {
                datasets.push({
                    label: options.datasetLabel || 'Data',
                    data: data.map(item => item[yField]),
                    borderColor: options.borderColor || this.defaultColors[0],
                    backgroundColor: options.backgroundColor || this.hexToRgba(this.defaultColors[0], 0.1),
                    borderWidth: options.lineWidth || 2,
                    tension: options.tension || 0.4,
                    fill: options.fill || false
                });
            }
        } else if (typeof data === 'object' && data.datasets) {
            // Multiple datasets
            data.datasets.forEach((dataset, index) => {
                datasets.push({
                    ...dataset,
                    borderColor: dataset.borderColor || this.defaultColors[index % this.defaultColors.length],
                    backgroundColor: dataset.backgroundColor || this.hexToRgba(this.defaultColors[index % this.defaultColors.length], 0.1),
                    tension: dataset.tension || 0.4,
                    fill: dataset.fill || false
                });
            });
        }

        return {
            labels: data.map ? data.map(item => item[xField] || item[labelField] || '') : data.labels || [],
            datasets
        };
    }

    /**
     * Format data for bar charts
     */
    formatBarData(data, options = {}) {
        const { xField = 'x', yField = 'y', labelField = 'label' } = options;
        
        const datasets = [];
        
        if (Array.isArray(data) && data.length > 0) {
            datasets.push({
                label: options.datasetLabel || 'Data',
                data: data.map(item => item[yField] || 0),
                backgroundColor: options.backgroundColor || this.defaultColors[0],
                borderColor: options.borderColor || this.defaultColors[0],
                borderWidth: options.borderWidth || 1
            });
        } else if (typeof data === 'object' && data.datasets) {
            data.datasets.forEach((dataset, index) => {
                datasets.push({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || this.defaultColors[index % this.defaultColors.length],
                    borderColor: dataset.borderColor || this.defaultColors[index % this.defaultColors.length]
                });
            });
        }

        return {
            labels: data.map ? data.map(item => item[xField] || item[labelField] || '') : data.labels || [],
            datasets
        };
    }

    /**
     * Format data for pie/doughnut charts
     */
    formatPieData(data, options = {}) {
        const { labelField = 'label', valueField = 'value' } = options;
        
        let labels = [];
        let values = [];
        let backgroundColor = [];
        let borderColor = [];

        if (Array.isArray(data)) {
            labels = data.map(item => item[labelField] || '');
            values = data.map(item => item[valueField] || 0);
            backgroundColor = data.map((item, index) => 
                item.backgroundColor || this.defaultColors[index % this.defaultColors.length]
            );
            borderColor = backgroundColor.map(color => this.darkenColor(color));
        } else if (typeof data === 'object' && data.labels && data.datasets) {
            labels = data.labels;
            values = data.datasets[0].data;
            backgroundColor = data.datasets[0].backgroundColor || this.defaultColors;
            borderColor = backgroundColor.map(color => this.darkenColor(color));
        }

        return {
            labels,
            datasets: [{
                data: values,
                backgroundColor,
                borderColor,
                borderWidth: 1
            }]
        };
    }

    /**
     * Format data for radar charts
     */
    formatRadarData(data, options = {}) {
        const { labelField = 'label', valueField = 'value' } = options;
        
        const datasets = [];
        
        if (Array.isArray(data)) {
            datasets.push({
                label: options.datasetLabel || 'Data',
                data: data.map(item => item[valueField] || 0),
                borderColor: options.borderColor || this.defaultColors[0],
                backgroundColor: options.backgroundColor || this.hexToRgba(this.defaultColors[0], 0.2),
                pointBackgroundColor: options.pointBackgroundColor || this.defaultColors[0],
                pointBorderColor: options.pointBorderColor || '#ffffff',
                pointHoverBackgroundColor: options.pointHoverBackgroundColor || '#ffffff',
                pointHoverBorderColor: options.pointHoverBorderColor || this.defaultColors[0]
            });
        }

        return {
            labels: data.map(item => item[labelField] || ''),
            datasets
        };
    }

    /**
     * Format data for polar area charts
     */
    formatPolarData(data, options = {}) {
        const { labelField = 'label', valueField = 'value' } = options;
        
        const labels = data.map(item => item[labelField] || '');
        const values = data.map(item => item[valueField] || 0);
        const backgroundColor = data.map((item, index) => 
            item.backgroundColor || this.hexToRgba(this.defaultColors[index % this.defaultColors.length], 0.6)
        );
        const borderColor = backgroundColor.map(color => this.darkenColor(color));

        return {
            labels,
            datasets: [{
                data: values,
                backgroundColor,
                borderColor,
                borderWidth: 1
            }]
        };
    }

    /**
     * Format data for scatter charts
     */
    formatScatterData(data, options = {}) {
        const { xField = 'x', yField = 'y', labelField = 'label' } = options;
        
        const datasets = [];
        
        if (Array.isArray(data)) {
            datasets.push({
                label: options.datasetLabel || 'Data',
                data: data.map(item => ({
                    x: item[xField] || 0,
                    y: item[yField] || 0
                })),
                backgroundColor: options.backgroundColor || this.defaultColors[0],
                borderColor: options.borderColor || this.defaultColors[0],
                pointRadius: options.pointRadius || 5
            });
        }

        return {
            datasets
        };
    }

    /**
     * Format data for bubble charts
     */
    formatBubbleData(data, options = {}) {
        const { xField = 'x', yField = 'y', rField = 'r' } = options;
        
        const datasets = [];
        
        if (Array.isArray(data)) {
            datasets.push({
                label: options.datasetLabel || 'Data',
                data: data.map(item => ({
                    x: item[xField] || 0,
                    y: item[yField] || 0,
                    r: item[rField] || 5
                })),
                backgroundColor: options.backgroundColor || this.hexToRgba(this.defaultColors[0], 0.6),
                borderColor: options.borderColor || this.defaultColors[0]
            });
        }

        return {
            datasets
        };
    }

    /**
     * Format data for gauge charts
     */
    formatGaugeData(data, options = {}) {
        const { valueField = 'value', maxField = 'max' } = options;
        
        const item = Array.isArray(data) ? data[0] || {} : data;
        const value = item[valueField] || 0;
        const max = item[maxField] || 100;
        
        const percentage = Math.min((value / max) * 100, 100);
        
        let backgroundColor = '#ef4444'; // Red for low values
        if (percentage >= 70) {
            backgroundColor = '#10b981'; // Green for high values
        } else if (percentage >= 40) {
            backgroundColor = '#f59e0b'; // Yellow for medium values
        }

        return {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [backgroundColor, '#e5e7eb'],
                borderWidth: 0
            }]
        };
    }

    /**
     * Format data for progress charts
     */
    formatProgressData(data, options = {}) {
        const { valueField = 'value', maxField = 'max' } = options;
        
        const item = Array.isArray(data) ? data[0] || {} : data;
        const value = item[valueField] || 0;
        const max = item[maxField] || 100;
        
        const percentage = Math.min((value / max) * 100, 100);
        
        let backgroundColor = '#ef4444'; // Red for low values
        if (percentage >= 70) {
            backgroundColor = '#10b981'; // Green for high values
        } else if (percentage >= 40) {
            backgroundColor = '#f59e0b'; // Yellow for medium values
        }

        return {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [backgroundColor, '#e5e7eb'],
                borderWidth: 0
            }]
        };
    }

    /**
     * Format data for table charts
     */
    formatTableData(data, options = {}) {
        const { columns = [] } = options;
        
        if (!Array.isArray(data)) {
            return data;
        }

        return {
            headers: columns.length > 0 ? columns : Object.keys(data[0] || {}),
            rows: data.map(item => {
                if (columns.length > 0) {
                    return columns.map(col => item[col] || '');
                }
                return Object.values(item);
            })
        };
    }

    /**
     * Generate scales options
     */
    generateScalesOptions(options = {}) {
        return {
            x: {
                display: options.showXAxis !== false,
                grid: {
                    display: options.showXGrid !== false,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    display: options.showXTicks !== false
                }
            },
            y: {
                display: options.showYAxis !== false,
                beginAtZero: options.beginAtZero !== false,
                grid: {
                    display: options.showYGrid !== false,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    display: options.showYTicks !== false
                }
            }
        };
    }

    /**
     * Convert hex color to rgba
     */
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Darken color
     */
    darkenColor(hex, factor = 0.8) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    /**
     * Generate color palette
     */
    generateColorPalette(count, baseColors = this.defaultColors) {
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        
        return colors;
    }

    /**
     * Generate gradient colors
     */
    generateGradientColors(startColor, endColor, steps) {
        const colors = [];
        const start = this.hexToRgb(startColor);
        const end = this.hexToRgb(endColor);
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            const r = Math.round(start.r + (end.r - start.r) * ratio);
            const g = Math.round(start.g + (end.g - start.g) * ratio);
            const b = Math.round(start.b + (end.b - start.b) * ratio);
            
            colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
        }
        
        return colors;
    }

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return { r, g, b };
    }

    /**
     * Validate chart configuration
     */
    validateChartConfig(config) {
        const errors = [];
        
        if (!config.type) {
            errors.push('Chart type is required');
        }
        
        if (!config.data) {
            errors.push('Chart data is required');
        }
        
        if (config.data && !config.data.labels && !Array.isArray(config.data.datasets)) {
            errors.push('Chart data must have labels or datasets');
        }
        
        return errors;
    }

    /**
     * Generate chart HTML
     */
    generateChartHTML(config, containerId = 'chart') {
        const validationErrors = this.validateChartConfig(config);
        
        if (validationErrors.length > 0) {
            throw new Error(`Invalid chart configuration: ${validationErrors.join(', ')}`);
        }

        return `
            <div id="${containerId}" class="chart-container">
                <canvas id="${containerId}-canvas"></canvas>
            </div>
            <script>
                const ctx = document.getElementById('${containerId}-canvas').getContext('2d');
                new Chart(ctx, ${JSON.stringify(config)});
            </script>
        `;
    }

    /**
     * Export chart as image
     */
    exportChartAsImage(canvas, format = 'png', quality = 0.9) {
        try {
            return canvas.toDataURL(`image/${format}`, quality);
        } catch (error) {
            console.error('Error exporting chart as image:', error);
            throw error;
        }
    }

    /**
     * Generate chart thumbnail
     */
    generateThumbnail(config, width = 200, height = 150) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            
            // Draw simplified chart representation
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(20, height - 50, 40, 30);
            ctx.fillRect(80, height - 80, 40, 60);
            ctx.fillRect(140, height - 60, 40, 40);
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            throw error;
        }
    }
}

module.exports = ChartGenerator;
