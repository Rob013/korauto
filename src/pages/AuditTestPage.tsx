import React from 'react';
import PerformanceAuditWidget from '@/components/PerformanceAuditWidget';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const AuditTestPage: React.FC = () => {
  const { isAdmin, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground">
            This audit test page is only available to administrators.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Audit Test Page</h1>
          <p>This page contains intentional issues to test the enhanced audit functionality.</p>
        </header>
        
        <main>
          {/* Performance Audit Widget */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Performance Audit</h2>
            <PerformanceAuditWidget />
          </section>
          
          {/* Test Elements */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Test Elements with Issues</h2>
            
            {/* Missing alt text - FIXED: Added proper alt text */}
            <div>
              <h3 className="text-lg font-medium mb-2">Image with Alt Text</h3>
              <img 
                src="/images/test-car.jpg" 
                alt="Test car image for audit demonstration"
                width="300" 
                height="200" 
              />
            </div>
            
            {/* Button too small for touch - FIXED: Using min-height/min-width instead and improved contrast */}
            <div>
              <h3 className="text-lg font-medium mb-2">Touch-Friendly Button</h3>
              <button 
                style={{ minHeight: '44px', minWidth: '44px', fontSize: '14px', padding: '8px 16px' }} 
                className="bg-blue-700 text-white rounded hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Touch-friendly
              </button>
            </div>
            
            {/* Fixed width element that breaks responsive design - FIXED: Using max-width instead */}
            <div>
              <h3 className="text-lg font-medium mb-2">Responsive Width Element</h3>
              <div style={{ maxWidth: '800px', width: '100%', background: 'lightblue', padding: '10px' }}>
                This div now uses max-width instead of fixed width for responsive design
              </div>
            </div>
            
            {/* Text overflow issue - FIXED: Using responsive width and overflow handling */}
            <div>
              <h3 className="text-lg font-medium mb-2">Text with Proper Overflow</h3>
              <div style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="border p-2">
                This text will now be properly truncated with ellipsis instead of overflowing the container
              </div>
            </div>
            
            {/* High z-index - FIXED: Using reasonable z-index */}
            <div>
              <h3 className="text-lg font-medium mb-2">Element with Reasonable Z-Index</h3>
              <div style={{ zIndex: 10, position: 'relative', background: 'yellow', padding: '10px' }}>
                Element with reasonable z-index (reduced from 9999 to 10)
              </div>
            </div>
            
            {/* Form with proper labels - FIXED: Added proper labels for accessibility */}
            <div>
              <h3 className="text-lg font-medium mb-2">Accessible Form</h3>
              <form>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name-input" className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input 
                      id="name-input"
                      type="text" 
                      placeholder="Enter your name"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="email-input" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input 
                      id="email-input"
                      type="email" 
                      placeholder="Enter your email"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="option-select" className="block text-sm font-medium mb-1">
                      Choose Option
                    </label>
                    <select id="option-select" className="w-full p-2 border rounded">
                      <option value="">Select an option</option>
                      <option value="option1">Option 1</option>
                      <option value="option2">Option 2</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Links with descriptive text - FIXED: Added descriptive text */}
            <div>
              <h3 className="text-lg font-medium mb-2">Accessible Links</h3>
              <div className="space-y-2">
                <a href="#" className="text-blue-600 hover:underline block">
                  Learn more about our car inspection services
                </a>
                <a href="#" className="text-blue-600 hover:underline block">
                  View detailed vehicle specifications and pricing
                </a>
              </div>
            </div>
            
            {/* Proper heading hierarchy - FIXED: Corrected order */}
            <div>
              <h3 className="text-lg font-medium">This is a proper h3 following h2</h3>
              <p>Heading hierarchy is now correct.</p>
            </div>
            
            {/* Focus states - FIXED: Added proper focus outlines and improved contrast */}
            <div>
              <h3 className="text-lg font-medium mb-2">Accessible Buttons</h3>
              <div className="space-x-2">
                <button className="px-6 py-3 bg-blue-700 text-white rounded hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Button with focus outline
                </button>
                <button className="px-6 py-3 bg-green-700 text-white rounded hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                  Another accessible button
                </button>
              </div>
            </div>
            
            {/* Interactive elements with ARIA - FIXED: Added proper ARIA labels */}
            <div>
              <h3 className="text-lg font-medium mb-2">Interactive Elements</h3>
              <div className="space-y-2">
                <div 
                  role="button" 
                  tabIndex={0}
                  aria-label="Interactive element for demonstration purposes"
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      console.log('Interactive element activated');
                    }
                  }}
                >
                  Interactive div with proper ARIA label and keyboard support
                </div>
                
                <div 
                  role="button" 
                  tabIndex={0}
                  aria-label="Another interactive element with full accessibility support"
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      console.log('Second interactive element activated');
                    }
                  }}
                >
                  Another interactive div with full accessibility support
                </div>
              </div>
            </div>
            
            {/* Table with headers - FIXED: Added proper table structure */}
            <div>
              <h3 className="text-lg font-medium mb-2">Accessible Table</h3>
              <table className="border-collapse border border-gray-300 w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Column 1</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Column 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cell 1</td>
                    <td className="border border-gray-300 px-4 py-2">Cell 2</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cell 3</td>
                    <td className="border border-gray-300 px-4 py-2">Cell 4</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Video with captions - FIXED: Added accessibility attributes */}
            <div>
              <h3 className="text-lg font-medium mb-2">Accessible Video</h3>
              <video 
                width="300" 
                height="200" 
                controls
                aria-label="Test video for accessibility demonstration"
              >
                <source src="/video/test.mp4" type="video/mp4" />
                <track 
                  kind="captions" 
                  src="/video/captions.vtt" 
                  srcLang="en" 
                  label="English captions"
                  default
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AuditTestPage;