import { describe, it, expect } from 'vitest'

describe('Integration Tests', () => {
  describe('Database Schema Integration', () => {
    it('should have all required RPC functions in schema', async () => {
      const fs = await import('fs')
      const schemaContent = fs.readFileSync('db/supabase-init.sql', 'utf-8')
      
      // Check for required RPC functions
      expect(schemaContent).toContain('cars_search_sorted')
      expect(schemaContent).toContain('cars_search_keyset')
      expect(schemaContent).toContain('bulk_merge_from_staging')
      expect(schemaContent).toContain('mark_missing_inactive')
      
      // Check for proper table structure
      expect(schemaContent).toContain('cars_staging')
      expect(schemaContent).toContain('is_active BOOLEAN DEFAULT true')
      expect(schemaContent).toContain('source_api TEXT')
    })
  })

  describe('Workflow Integration', () => {
    it('should have comprehensive verification in GitHub workflow', async () => {
      const fs = await import('fs')
      const workflowContent = fs.readFileSync('.github/workflows/sync-cars.yml', 'utf-8')
      
      // Check for verification steps
      expect(workflowContent).toContain('Verify sync results')
      expect(workflowContent).toContain('tsx scripts/verify-sync.ts')
      expect(workflowContent).toContain('190000')
      expect(workflowContent).toContain('cars_search_sorted')
      
      // Check for cleanup on failure
      expect(workflowContent).toContain('Cleanup on failure')
      expect(workflowContent).toContain('if: failure()')
    })
  })

  describe('Package Scripts Integration', () => {
    it('should have all required npm scripts', async () => {
      const fs = await import('fs')
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
      
      expect(packageJson.scripts).toHaveProperty('sync-cars')
      expect(packageJson.scripts).toHaveProperty('diagnose-db')
      expect(packageJson.scripts).toHaveProperty('verify-sync')
      
      expect(packageJson.scripts['sync-cars']).toBe('tsx scripts/sync-cars.ts')
      expect(packageJson.scripts['diagnose-db']).toBe('tsx scripts/diagnose-database.ts')
      expect(packageJson.scripts['verify-sync']).toBe('tsx scripts/verify-sync.ts')
    })
  })

  describe('Script Files Integration', () => {
    it('should have all required script files', async () => {
      const fs = await import('fs')
      
      // Check that all script files exist
      expect(fs.existsSync('scripts/sync-cars.ts')).toBe(true)
      expect(fs.existsSync('scripts/diagnose-database.ts')).toBe(true)
      expect(fs.existsSync('scripts/verify-sync.ts')).toBe(true)
      
      // Check script content has required features
      const syncContent = fs.readFileSync('scripts/sync-cars.ts', 'utf-8')
      expect(syncContent).toContain('PAGE_SIZE = 1000')
      expect(syncContent).toContain('BATCH_SIZE = 5000')
      expect(syncContent).toContain('190,000+')
      
      const diagnosticContent = fs.readFileSync('scripts/diagnose-database.ts', 'utf-8')
      expect(diagnosticContent).toContain('checkCarCounts')
      expect(diagnosticContent).toContain('checkRPCFunctions')
      
      const verifyContent = fs.readFileSync('scripts/verify-sync.ts', 'utf-8')
      expect(verifyContent).toContain('checkApiAvailability')
      expect(verifyContent).toContain('checkDatabaseStatus')
      expect(verifyContent).toContain('190000')
    })
  })

  describe('Frontend Components Integration', () => {
    it('should have database status components', async () => {
      const fs = await import('fs')
      
      // Check that component files exist
      expect(fs.existsSync('src/components/DatabaseStatus.tsx')).toBe(true)
      expect(fs.existsSync('src/pages/DatabaseStatusPage.tsx')).toBe(true)
      
      // Check component content
      const componentContent = fs.readFileSync('src/components/DatabaseStatus.tsx', 'utf-8')
      expect(componentContent).toContain('DatabaseStatus')
      expect(componentContent).toContain('190000')
      expect(componentContent).toContain('cars_search_sorted')
      
      const pageContent = fs.readFileSync('src/pages/DatabaseStatusPage.tsx', 'utf-8')
      expect(pageContent).toContain('DatabaseStatusPage')
      expect(pageContent).toContain('190,000+')
    })
  })

  describe('Documentation Integration', () => {
    it('should have comprehensive documentation', async () => {
      const fs = await import('fs')
      
      // Check documentation files exist
      expect(fs.existsSync('SYNC_ENHANCEMENTS.md')).toBe(true)
      expect(fs.existsSync('CAR_SYNC_IMPLEMENTATION.md')).toBe(true)
      
      // Check documentation content
      const enhancementsContent = fs.readFileSync('SYNC_ENHANCEMENTS.md', 'utf-8')
      expect(enhancementsContent).toContain('190,000+')
      expect(enhancementsContent).toContain('Car Sync Verification')
      expect(enhancementsContent).toContain('Sold Car Management')
      
      const implementationContent = fs.readFileSync('CAR_SYNC_IMPLEMENTATION.md', 'utf-8')
      expect(implementationContent).toContain('bulk_merge_from_staging')
      expect(implementationContent).toContain('mark_missing_inactive')
    })
  })
})