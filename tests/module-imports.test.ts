import { describe, it, expect } from 'vitest'

describe('Module imports', () => {
  it('should import Radix UI components without errors', async () => {
    // Test that all Radix UI components can be imported successfully
    const dialogModule = await import('@radix-ui/react-dialog')
    const selectModule = await import('@radix-ui/react-select')
    const tabsModule = await import('@radix-ui/react-tabs')
    const checkboxModule = await import('@radix-ui/react-checkbox')
    const labelModule = await import('@radix-ui/react-label')
    
    expect(dialogModule).toBeDefined()
    expect(selectModule).toBeDefined()
    expect(tabsModule).toBeDefined()
    expect(checkboxModule).toBeDefined()
    expect(labelModule).toBeDefined()
  })

  it('should import UI components without errors', async () => {
    // Test that UI components can be imported successfully
    const dialogUI = await import('@/components/ui/dialog')
    const selectUI = await import('@/components/ui/select')
    const tabsUI = await import('@/components/ui/tabs')
    const checkboxUI = await import('@/components/ui/checkbox')
    const labelUI = await import('@/components/ui/label')
    
    expect(dialogUI).toBeDefined()
    expect(selectUI).toBeDefined()
    expect(tabsUI).toBeDefined()
    expect(checkboxUI).toBeDefined()
    expect(labelUI).toBeDefined()
  })

  it('should import core React libraries without errors', async () => {
    const react = await import('react')
    const reactDom = await import('react-dom')
    const reactRouter = await import('react-router-dom')
    
    expect(react).toBeDefined()
    expect(reactDom).toBeDefined()
    expect(reactRouter).toBeDefined()
  })
})