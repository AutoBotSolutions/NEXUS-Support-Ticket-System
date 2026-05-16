/**
 * NEXUS Threat Intelligence Integration System
 * Integrates external threat data sources and provides threat intelligence
 */

class ThreatIntelligence {
    constructor() {
        this.threatFeeds = new Map();
        this.indicators = new Map();
        this.threatActors = new Map();
        this.campaigns = new Map();
        this.malwareFamilies = new Map();
        this.vulnerabilityDatabase = new Map();
        this.reputationDatabase = new Map();
        this.threatScores = new Map();
        this.intelligenceReports = new Map();
        
        this.initializeThreatFeeds();
        this.initializeThreatActors();
        this.initializeMalwareFamilies();
        this.initializeVulnerabilityDatabase();
        this.initializeReputationDatabase();
    }

    initializeThreatFeeds() {
        // Initialize threat feeds (simplified version)
        // In production, these would be real threat intelligence feeds
        
        this.threatFeeds.set('malware_domains', {
            id: 'malware_domains',
            name: 'Malicious Domain Feed',
            type: 'domain',
            source: 'internal',
            updateInterval: 3600000, // 1 hour
            lastUpdate: new Date().toISOString(),
            indicators: [],
            status: 'active'
        });

        this.threatFeeds.set('malicious_ips', {
            id: 'malicious_ips',
            name: 'Malicious IP Feed',
            type: 'ip',
            source: 'internal',
            updateInterval: 1800000, // 30 minutes
            lastUpdate: new Date().toISOString(),
            indicators: [],
            status: 'active'
        });

        this.threatFeeds.set('phishing_urls', {
            id: 'phishing_urls',
            name: 'Phishing URL Feed',
            type: 'url',
            source: 'internal',
            updateInterval: 900000, // 15 minutes
            lastUpdate: new Date().toISOString(),
            indicators: [],
            status: 'active'
        });

        // Populate with sample indicators
        this.populateSampleIndicators();
    }

    populateSampleIndicators() {
        // Sample malicious domains
        const maliciousDomains = [
            'malicious-site.com',
            'phishing-domain.net',
            'botnet-controller.org',
            'malware-distribution.info',
            'c2-server.biz'
        ];

        for (const domain of maliciousDomains) {
            this.addIndicator({
                type: 'domain',
                value: domain,
                threatType: 'malware',
                severity: 'high',
                confidence: 85,
                source: 'malware_domains',
                description: 'Malicious domain associated with malware distribution',
                tags: ['malware', 'c2', 'phishing'],
                firstSeen: new Date(Date.now() - 86400000 * 30).toISOString(),
                lastSeen: new Date().toISOString()
            });
        }

        // Sample malicious IPs
        const maliciousIPs = [
            '192.168.1.100',
            '10.0.0.50',
            '172.16.0.25',
            '203.0.113.10',
            '198.51.100.20'
        ];

        for (const ip of maliciousIPs) {
            this.addIndicator({
                type: 'ip',
                value: ip,
                threatType: 'malware',
                severity: 'medium',
                confidence: 75,
                source: 'malicious_ips',
                description: 'IP address associated with malicious activity',
                tags: ['botnet', 'scanning', 'brute_force'],
                firstSeen: new Date(Date.now() - 86400000 * 7).toISOString(),
                lastSeen: new Date().toISOString()
            });
        }

        // Sample phishing URLs
        const phishingURLs = [
            'http://phishing-site.com/login',
            'https://fake-bank.net/secure',
            'http://malicious-link.org/redirect',
            'https://scam-domain.info/update',
            'http://threat-url.com/download'
        ];

        for (const url of phishingURLs) {
            this.addIndicator({
                type: 'url',
                value: url,
                threatType: 'phishing',
                severity: 'critical',
                confidence: 90,
                source: 'phishing_urls',
                description: 'Phishing URL targeting financial services',
                tags: ['phishing', 'credential_theft', 'financial'],
                firstSeen: new Date(Date.now() - 86400000 * 3).toISOString(),
                lastSeen: new Date().toISOString()
            });
        }
    }

    initializeThreatActors() {
        // Initialize known threat actors
        this.threatActors.set('APT-28', {
            id: 'apt-28',
            name: 'Fancy Bear',
            aliases: ['APT28', 'Sofacy', 'Pawn Storm'],
            country: 'Russia',
            motivation: 'political',
            capabilities: ['malware', 'spear_phishing', 'zero_day_exploits'],
            targetIndustries: ['government', 'military', 'defense'],
            firstSeen: '2008-01-01',
            lastSeen: new Date().toISOString(),
            confidence: 95,
            description: 'Russian state-sponsored threat actor targeting government and military organizations'
        });

        this.threatActors.set('APT-29', {
            id: 'apt-29',
            name: 'Cozy Bear',
            aliases: ['APT29', 'CozyCar', 'The Dukes'],
            country: 'Russia',
            motivation: 'espionage',
            capabilities: ['malware', 'spear_phishing', 'watering_hole'],
            targetIndustries: ['government', 'diplomatic', 'think_tanks'],
            firstSeen: '2010-01-01',
            lastSeen: new Date().toISOString(),
            confidence: 90,
            description: 'Russian threat actor focused on espionage and intelligence gathering'
        });

        this.threatActors.set('Lazarus Group', {
            id: 'lazarus-group',
            name: 'Lazarus Group',
            aliases: ['APT38', 'Hidden Cobra', 'Guardians of Peace'],
            country: 'North Korea',
            motivation: 'financial',
            capabilities: ['malware', 'cryptocurrency_theft', 'banking_trojans'],
            targetIndustries: ['financial', 'cryptocurrency', 'banking'],
            firstSeen: '2009-01-01',
            lastSeen: new Date().toISOString(),
            confidence: 88,
            description: 'North Korean threat actor focused on financial crimes and cryptocurrency theft'
        });
    }

    initializeMalwareFamilies() {
        // Initialize known malware families
        this.malwareFamilies.set('emotet', {
            id: 'emotet',
            name: 'Emotet',
            type: 'banking_trojan',
            aliases: ['Heodo', 'Geodo'],
            firstSeen: '2014-01-01',
            lastSeen: new Date().toISOString(),
            capabilities: ['banking_theft', 'spreading', 'module_downloading'],
            infection_vectors: ['email_attachments', 'malicious_links'],
            affected_systems: ['Windows'],
            severity: 'high',
            description: 'Sophisticated banking trojan with modular architecture'
        });

        this.malwareFamilies.set('trickbot', {
            id: 'trickbot',
            name: 'TrickBot',
            type: 'banking_trojan',
            aliases: ['TrickBot', 'TheTrick'],
            firstSeen: '2016-01-01',
            lastSeen: new Date().toISOString(),
            capabilities: ['banking_theft', 'information_stealing', 'lateral_movement'],
            infection_vectors: ['email_campaigns', 'exploit_kits'],
            affected_systems: ['Windows'],
            severity: 'high',
            description: 'Modular banking trojan with information stealing capabilities'
        });

        this.malwareFamilies.set('ryuk', {
            id: 'ryuk',
            name: 'Ryuk',
            type: 'ransomware',
            aliases: ['Ryuk', 'Ryuk Ransomware'],
            firstSeen: '2018-08-01',
            lastSeen: new Date().toISOString(),
            capabilities: ['file_encryption', 'lateral_movement', 'data_exfiltration'],
            infection_vectors: ['trickbot_infection', 'brute_force'],
            affected_systems: ['Windows'],
            severity: 'critical',
            description: 'Ransomware targeting enterprise environments with high ransom demands'
        });
    }

    initializeVulnerabilityDatabase() {
        // Initialize vulnerability database
        this.vulnerabilityDatabase.set('CVE-2021-44228', {
            id: 'CVE-2021-44228',
            name: 'Log4Shell',
            severity: 'critical',
            cvss: 10.0,
            description: 'Remote code execution vulnerability in Log4j',
            affected_products: ['Apache Log4j', 'Various Java applications'],
            published_date: '2021-12-09',
            modified_date: '2021-12-10',
            exploit_available: true,
            exploit_complexity: 'low',
            impact: 'complete',
            remediation: 'Update to Log4j 2.17.0 or later'
        });

        this.vulnerabilityDatabase.set('CVE-2021-34527', {
            id: 'CVE-2021-34527',
            name: 'PrintNightmare',
            severity: 'critical',
            cvss: 8.8,
            description: 'Windows Print Spooler remote code execution vulnerability',
            affected_products: ['Windows 10', 'Windows Server 2019'],
            published_date: '2021-07-01',
            modified_date: '2021-07-06',
            exploit_available: true,
            exploit_complexity: 'low',
            impact: 'complete',
            remediation: 'Apply Windows security updates'
        });

        this.vulnerabilityDatabase.set('CVE-2022-22965', {
            id: 'CVE-2022-22965',
            name: 'Spring4Shell',
            severity: 'critical',
            cvss: 9.8,
            description: 'Remote code execution vulnerability in Spring Framework',
            affected_products: ['Spring Framework', 'Spring Boot'],
            published_date: '2022-03-31',
            modified_date: '2022-04-01',
            exploit_available: true,
            exploit_complexity: 'medium',
            impact: 'complete',
            remediation: 'Update to Spring Framework 5.3.18+ or 5.2.20+'
        });
    }

    initializeReputationDatabase() {
        // Initialize reputation database
        this.reputationDatabase.set('file_hashes', {
            type: 'file_hash',
            entries: new Map()
        });

        this.reputationDatabase.set('email_domains', {
            type: 'email_domain',
            entries: new Map()
        });

        this.reputationDatabase.set('certificates', {
            type: 'certificate',
            entries: new Map()
        });

        // Add sample entries
        this.addReputationEntry('file_hash', '5d41402abc4b2a76b9719d911017c592', {
            reputation: 'malicious',
            confidence: 95,
            threatType: 'malware',
            description: 'Known malware hash',
            firstSeen: new Date(Date.now() - 86400000 * 30).toISOString()
        });

        this.addReputationEntry('email_domain', 'suspicious-domain.com', {
            reputation: 'suspicious',
            confidence: 80,
            threatType: 'phishing',
            description: 'Domain associated with phishing campaigns',
            firstSeen: new Date(Date.now() - 86400000 * 7).toISOString()
        });
    }

    addIndicator(indicatorData) {
        const indicator = {
            id: this.generateIndicatorId(),
            ...indicatorData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.indicators.set(indicator.id, indicator);
        
        // Add to threat feed
        const feed = this.threatFeeds.get(indicatorData.source);
        if (feed) {
            feed.indicators.push(indicator.id);
        }

        return indicator;
    }

    addReputationEntry(type, key, reputationData) {
        const entry = {
            id: this.generateIndicatorId(),
            key: key,
            type: type,
            ...reputationData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const database = this.reputationDatabase.get(type);
        if (database) {
            database.entries.set(key, entry);
        }

        return entry;
    }

    checkIndicator(indicatorType, value) {
        // Check if indicator exists in threat intelligence
        const indicators = Array.from(this.indicators.values())
            .filter(indicator => indicator.type === indicatorType && indicator.value === value);

        if (indicators.length > 0) {
            return {
                found: true,
                indicators: indicators,
                threatLevel: this.calculateThreatLevel(indicators),
                recommendations: this.generateRecommendations(indicators)
            };
        }

        return {
            found: false,
            indicators: [],
            threatLevel: 'low',
            recommendations: []
        };
    }

    checkReputation(type, key) {
        const database = this.reputationDatabase.get(type);
        if (!database) {
            return {
                found: false,
                reputation: 'unknown',
                confidence: 0,
                threatType: null,
                description: null
            };
        }

        const entry = database.entries.get(key);
        if (entry) {
            return {
                found: true,
                reputation: entry.reputation,
                confidence: entry.confidence,
                threatType: entry.threatType,
                description: entry.description
            };
        }

        return {
            found: false,
            reputation: 'unknown',
            confidence: 0,
            threatType: null,
            description: null
        };
    }

    calculateThreatLevel(indicators) {
        if (indicators.length === 0) return 'low';

        const severities = indicators.map(i => i.severity);
        const confidence = indicators.reduce((sum, i) => sum + i.confidence, 0) / indicators.length;

        if (severities.includes('critical') && confidence > 80) return 'critical';
        if (severities.includes('high') && confidence > 70) return 'high';
        if (severities.includes('medium') && confidence > 60) return 'medium';
        if (severities.includes('low') && confidence > 50) return 'low';

        return 'unknown';
    }

    generateRecommendations(indicators) {
        const recommendations = [];
        const threatTypes = new Set(indicators.map(i => i.threatType));

        if (threatTypes.has('malware')) {
            recommendations.push('Block the indicator and scan for malware infections');
            recommendations.push('Update antivirus signatures and run full system scan');
        }

        if (threatTypes.has('phishing')) {
            recommendations.push('Block the indicator and warn users about phishing attempts');
            recommendations.push('Review user accounts for suspicious activity');
        }

        if (threatTypes.has('botnet')) {
            recommendations.push('Block network traffic to/from the indicator');
            recommendations.push('Monitor for lateral movement and data exfiltration');
        }

        if (threatTypes.has('c2')) {
            recommendations.push('Block all communication with the C2 server');
            recommendations.push('Isolate affected systems and investigate compromise');
        }

        return recommendations;
    }

    async enrichThreatData(indicatorData) {
        // Enrich threat data with additional intelligence
        const enriched = {
            ...indicatorData,
            enrichedAt: new Date().toISOString(),
            enrichment: {
                threatActor: null,
                malwareFamily: null,
                campaign: null,
                relatedIndicators: [],
                context: []
            }
        };

        // Check for related threat actors
        for (const [actorId, actor] of this.threatActors) {
            if (this.isRelatedToThreatActor(indicatorData, actor)) {
                enriched.enrichment.threatActor = actor;
                break;
            }
        }

        // Check for related malware families
        for (const [malwareId, malware] of this.malwareFamilies) {
            if (this.isRelatedToMalware(indicatorData, malware)) {
                enriched.enrichment.malwareFamily = malware;
                break;
            }
        }

        // Find related indicators
        enriched.enrichment.relatedIndicators = this.findRelatedIndicators(indicatorData);

        return enriched;
    }

    isRelatedToThreatActor(indicatorData, threatActor) {
        // Simplified logic for determining relationship
        const actorTags = threatActor.capabilities.concat(threatActor.targetIndustries);
        const indicatorTags = indicatorData.tags || [];

        return actorTags.some(tag => indicatorTags.includes(tag));
    }

    isRelatedToMalware(indicatorData, malware) {
        // Simplified logic for determining relationship
        const malwareTags = malware.capabilities.concat(malware.infection_vectors);
        const indicatorTags = indicatorData.tags || [];

        return malwareTags.some(tag => indicatorTags.includes(tag));
    }

    findRelatedIndicators(indicatorData) {
        const related = [];
        
        for (const [id, indicator] of this.indicators) {
            if (id !== indicatorData.id && this.areIndicatorsRelated(indicatorData, indicator)) {
                related.push(indicator);
            }
        }

        return related;
    }

    areIndicatorsRelated(indicator1, indicator2) {
        // Check if indicators share common tags or threat types
        const tags1 = indicator1.tags || [];
        const tags2 = indicator2.tags || [];

        const commonTags = tags1.filter(tag => tags2.includes(tag));
        
        return commonTags.length > 0 || indicator1.threatType === indicator2.threatType;
    }

    generateThreatReport(indicatorData) {
        const report = {
            id: this.generateReportId(),
            type: 'threat_intelligence_report',
            generatedAt: new Date().toISOString(),
            indicator: indicatorData,
            analysis: this.analyzeThreat(indicatorData),
            recommendations: this.generateThreatRecommendations(indicatorData),
            context: this.generateThreatContext(indicatorData)
        };

        this.intelligenceReports.set(report.id, report);
        return report;
    }

    analyzeThreat(indicatorData) {
        const analysis = {
            threatLevel: 'unknown',
            confidence: 0,
            threatTypes: [],
            attribution: null,
            timeline: {
                firstSeen: indicatorData.firstSeen || null,
                lastSeen: indicatorData.lastSeen || null,
                activity: 'unknown'
            }
        };

        // Analyze based on indicator properties
        if (indicatorData.severity) {
            analysis.threatLevel = this.mapSeverityToThreatLevel(indicatorData.severity);
        }

        if (indicatorData.confidence) {
            analysis.confidence = indicatorData.confidence;
        }

        if (indicatorData.threatType) {
            analysis.threatTypes.push(indicatorData.threatType);
        }

        // Add timeline analysis
        if (indicatorData.firstSeen && indicatorData.lastSeen) {
            const firstSeen = new Date(indicatorData.firstSeen);
            const lastSeen = new Date(indicatorData.lastSeen);
            const daysActive = Math.floor((lastSeen - firstSeen) / (1000 * 60 * 60 * 24));
            
            if (daysActive < 7) {
                analysis.timeline.activity = 'recent';
            } else if (daysActive < 30) {
                analysis.timeline.activity = 'active';
            } else {
                analysis.timeline.activity = 'long_term';
            }
        }

        return analysis;
    }

    mapSeverityToThreatLevel(severity) {
        const mapping = {
            'critical': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        };
        
        return mapping[severity] || 'unknown';
    }

    generateThreatRecommendations(indicatorData) {
        const recommendations = [];
        
        if (indicatorData.type === 'ip') {
            recommendations.push('Block IP address at network perimeter');
            recommendations.push('Add IP to firewall blocklist');
            recommendations.push('Monitor for connections from this IP');
        }

        if (indicatorData.type === 'domain') {
            recommendations.push('Block domain at DNS level');
            recommendations.push('Add domain to security blocklist');
            recommendations.push('Monitor for DNS queries to this domain');
        }

        if (indicatorData.type === 'url') {
            recommendations.push('Block URL in web proxy');
            recommendations.push('Add URL to security blocklist');
            recommendations.push('Warn users about malicious links');
        }

        if (indicatorData.type === 'file_hash') {
            recommendations.push('Quarantine files with this hash');
            recommendations.push('Scan systems for files with this hash');
            recommendations.push('Update antivirus signatures');
        }

        // Add general recommendations
        recommendations.push('Review system logs for related activity');
        recommendations.push('Monitor for additional indicators of compromise');
        recommendations.push('Update security controls and policies');

        return recommendations;
    }

    generateThreatContext(indicatorData) {
        const context = {
            relatedThreats: [],
            similarIndicators: [],
            historicalData: [],
            attribution: null
        };

        // Find related threats
        for (const [id, actor] of this.threatActors) {
            if (this.isRelatedToThreatActor(indicatorData, actor)) {
                context.relatedThreats.push({
                    type: 'threat_actor',
                    name: actor.name,
                    confidence: 75
                });
            }
        }

        // Find similar indicators
        for (const [id, indicator] of this.indicators) {
            if (id !== indicatorData.id && indicator.type === indicatorData.type) {
                context.similarIndicators.push({
                    id: indicator.id,
                    value: indicator.value,
                    similarity: this.calculateSimilarity(indicatorData, indicator)
                });
            }
        }

        return context;
    }

    calculateSimilarity(indicator1, indicator2) {
        // Simplified similarity calculation
        if (indicator1.threatType === indicator2.threatType) {
            return 0.8;
        }
        
        const tags1 = indicator1.tags || [];
        const tags2 = indicator2.tags || [];
        const commonTags = tags1.filter(tag => tags2.includes(tag));
        
        if (tags1.length > 0 && tags2.length > 0) {
            return commonTags.length / Math.max(tags1.length, tags2.length);
        }
        
        return 0.1;
    }

    getThreatFeed(feedId) {
        return this.threatFeeds.get(feedId);
    }

    getAllThreatFeeds() {
        return Array.from(this.threatFeeds.values());
    }

    getIndicators(type = null, limit = 100) {
        let indicators = Array.from(this.indicators.values());
        
        if (type) {
            indicators = indicators.filter(indicator => indicator.type === type);
        }
        
        return indicators
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, limit);
    }

    getThreatActors() {
        return Array.from(this.threatActors.values());
    }

    getMalwareFamilies() {
        return Array.from(this.malwareFamilies.values());
    }

    getVulnerabilities() {
        return Array.from(this.vulnerabilityDatabase.values());
    }

    getIntelligenceReports(limit = 50) {
        return Array.from(this.intelligenceReports.values())
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            .slice(0, limit);
    }

    async updateThreatFeeds() {
        // Update threat feeds (simplified version)
        for (const [feedId, feed] of this.threatFeeds) {
            if (feed.status === 'active') {
                // In production, this would fetch from external threat intelligence sources
                feed.lastUpdate = new Date().toISOString();
                
                // Add some new sample indicators
                if (Math.random() > 0.7) { // 30% chance of new indicators
                    this.addSampleIndicatorForFeed(feedId);
                }
            }
        }
    }

    addSampleIndicatorForFeed(feedId) {
        const feed = this.threatFeeds.get(feedId);
        if (!feed) return;

        let indicatorData = {};

        switch (feed.type) {
            case 'domain':
                indicatorData = {
                    type: 'domain',
                    value: `malicious-${Date.now()}.com`,
                    threatType: 'malware',
                    severity: 'high',
                    confidence: 80,
                    source: feedId,
                    description: 'New malicious domain detected',
                    tags: ['malware', 'auto_generated'],
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                };
                break;

            case 'ip':
                indicatorData = {
                    type: 'ip',
                    value: `203.0.113.${Math.floor(Math.random() * 255)}`,
                    threatType: 'scanning',
                    severity: 'medium',
                    confidence: 70,
                    source: feedId,
                    description: 'New malicious IP detected',
                    tags: ['scanning', 'auto_generated'],
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                };
                break;

            case 'url':
                indicatorData = {
                    type: 'url',
                    value: `http://malicious-${Date.now()}.com/redirect`,
                    threatType: 'phishing',
                    severity: 'critical',
                    confidence: 85,
                    source: feedId,
                    description: 'New phishing URL detected',
                    tags: ['phishing', 'auto_generated'],
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                };
                break;
        }

        this.addIndicator(indicatorData);
    }

    generateIndicatorId() {
        return 'indicator-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    }

    generateReportId() {
        return 'report-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    }

    getThreatSummary() {
        const summary = {
            totalIndicators: this.indicators.size,
            indicatorsByType: {},
            indicatorsBySeverity: {},
            indicatorsByThreatType: {},
            activeThreatFeeds: 0,
            totalThreatActors: this.threatActors.size,
            totalMalwareFamilies: this.malwareFamilies.size,
            totalVulnerabilities: this.vulnerabilityDatabase.size,
            lastUpdate: new Date().toISOString()
        };

        // Count indicators by type
        for (const indicator of this.indicators.values()) {
            summary.indicatorsByType[indicator.type] = (summary.indicatorsByType[indicator.type] || 0) + 1;
            summary.indicatorsBySeverity[indicator.severity] = (summary.indicatorsBySeverity[indicator.severity] || 0) + 1;
            summary.indicatorsByThreatType[indicator.threatType] = (summary.indicatorsByThreatType[indicator.threatType] || 0) + 1;
        }

        // Count active threat feeds
        for (const feed of this.threatFeeds.values()) {
            if (feed.status === 'active') {
                summary.activeThreatFeeds++;
            }
        }

        return summary;
    }
}

// Create global instance
const threatIntelligence = new ThreatIntelligence();

// Update threat feeds periodically
setInterval(() => {
    threatIntelligence.updateThreatFeeds();
}, 300000); // Update every 5 minutes

module.exports = {
    threatIntelligence
};
