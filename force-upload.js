#!/usr/bin/env node

/**
 * Force Upload Script for NEXUS Support System
 * Ensures complete upload to the correct repository
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 FORCE UPLOAD TO NEXUS-Support-Ticket-System');
console.log('=' .repeat(60));

const repository = 'https://github.com/AutoBotSolutions/NEXUS-Support-Ticket-System.git';

function forceUpload() {
    try {
        console.log('🔧 Configuring repository...');
        
        // Remove existing remote
        try {
            execSync('git remote remove origin', { stdio: 'inherit' });
        } catch (error) {
            // Ignore if remote doesn't exist
        }
        
        // Add correct remote
        execSync(`git remote add origin ${repository}`, { stdio: 'inherit' });
        console.log('✅ Repository configured');
        
        console.log('📊 Verifying files...');
        
        // Count files
        const files = execSync('find . -type f -not -path "./.git/*" | wc -l', { encoding: 'utf8' }).trim();
        console.log(`📁 Total files: ${files}`);
        
        // Check key files
        const keyFiles = [
            'server.js',
            'package.json',
            'website/index.html',
            'website/styles.css',
            'website/script.js',
            'README.md',
            '.github/workflows/ai-deployment.yml',
            '.github/workflows/force-deploy.yml'
        ];
        
        keyFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file}: Present`);
            } else {
                console.log(`❌ ${file}: Missing`);
            }
        });
        
        console.log('🚀 Force uploading to repository...');
        
        // Force push master branch
        execSync('git push -f origin master', { stdio: 'inherit' });
        console.log('✅ Master branch pushed');
        
        // Push tags
        execSync('git push -f origin --tags', { stdio: 'inherit' });
        console.log('✅ Tags pushed');
        
        // Verify upload
        console.log('🔍 Verifying upload...');
        const status = execSync('git status', { encoding: 'utf8' });
        console.log(status);
        
        // Get latest commit
        const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        console.log(`🔗 Latest commit: ${commit}`);
        
        console.log('🎉 FORCE UPLOAD COMPLETE!');
        console.log(`🌐 Repository: ${repository}`);
        console.log(`🔗 Commit: ${commit}`);
        console.log(`📊 Files: ${files}`);
        console.log(`🌐 Website: https://autobotsolutions.github.io/NEXUS-Support-Ticket-System/`);
        
    } catch (error) {
        console.error('❌ Force upload failed:', error.message);
        process.exit(1);
    }
}

// Run force upload
forceUpload();
