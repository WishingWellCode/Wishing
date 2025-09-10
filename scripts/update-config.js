#!/usr/bin/env node

// Quick config update script for Wishing Well
// Usage: node scripts/update-config.js [test|prod]

const fs = require('fs')
const path = require('path')

const CONFIG_FILE = path.join(__dirname, '../config/token.config.js')
const WRANGLER_FILE = path.join(__dirname, '../wrangler.toml')

function updateConfig(mode) {
  if (mode !== 'test' && mode !== 'prod') {
    console.error('Usage: node scripts/update-config.js [test|prod]')
    process.exit(1)
  }

  try {
    // Read current config
    let configContent = fs.readFileSync(CONFIG_FILE, 'utf8')
    
    // Update the CURRENT_CONFIG line
    if (mode === 'prod') {
      configContent = configContent.replace(
        /const CURRENT_CONFIG = TOKEN_CONFIG\.TESTING/,
        'const CURRENT_CONFIG = TOKEN_CONFIG.PRODUCTION'
      )
      console.log('✅ Updated config to PRODUCTION mode')
    } else {
      configContent = configContent.replace(
        /const CURRENT_CONFIG = TOKEN_CONFIG\.PRODUCTION/,
        'const CURRENT_CONFIG = TOKEN_CONFIG.TESTING'
      )
      console.log('✅ Updated config to TESTING mode')
    }
    
    // Write back to file
    fs.writeFileSync(CONFIG_FILE, configContent)
    
    console.log('🔧 Config updated successfully!')
    console.log('\nNext steps:')
    console.log('1. Run: wrangler deploy')
    console.log('2. Run: npm run build && wrangler pages deploy out --project-name="wishing-well"')
    
  } catch (error) {
    console.error('❌ Error updating config:', error.message)
    process.exit(1)
  }
}

// Get command line argument
const mode = process.argv[2]
updateConfig(mode)