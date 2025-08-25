import React from 'react';
import PerformanceAuditWidget from '@/components/PerformanceAuditWidget';

const AuditTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold">Audit Test Page</h1>
        <p>This page contains intentional issues to test the enhanced audit functionality.</p>
        
        {/* Performance Audit Widget */}
        <div className="mb-8">
          <PerformanceAuditWidget />
        </div>
        
        {/* Intentional Layout Issues */}
        <div className="space-y-6">
          <h2>Test Elements with Issues</h2>
          
          {/* Missing alt text */}
          <img src="/images/test-car.jpg" width="300" height="200" />
          
          {/* Button too small for touch */}
          <button style={{ width: '30px', height: '20px', fontSize: '10px' }}>
            Small
          </button>
          
          {/* Fixed width element that breaks responsive design */}
          <div style={{ width: '800px', background: 'lightblue', padding: '10px' }}>
            This div has a fixed width of 800px which will cause issues on mobile
          </div>
          
          {/* Text overflow issue */}
          <div style={{ width: '100px', overflow: 'visible', whiteSpace: 'nowrap' }}>
            This is a very long text that will overflow the container and cause layout issues
          </div>
          
          {/* High z-index */}
          <div style={{ zIndex: 9999, position: 'relative', background: 'yellow', padding: '10px' }}>
            Element with extremely high z-index
          </div>
          
          {/* Form without labels */}
          <form>
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <select>
              <option>Choose option</option>
            </select>
          </form>
          
          {/* Links without descriptive text */}
          <a href="#" style={{ color: 'blue' }}>Click here</a>
          <br />
          <a href="#" style={{ color: 'blue' }}>More</a>
          
          {/* Poor heading hierarchy */}
          <h4>This h4 comes before h2 and h3</h4>
          
          {/* Missing focus states */}
          <button style={{ outline: 'none' }}>Button without focus outline</button>
          
          {/* Table without headers */}
          <table border={1}>
            <tbody>
              <tr>
                <td>Cell 1</td>
                <td>Cell 2</td>
              </tr>
              <tr>
                <td>Cell 3</td>
                <td>Cell 4</td>
              </tr>
            </tbody>
          </table>
          
          {/* Video without captions */}
          <video width="300" height="200" controls>
            <source src="/video/test.mp4" type="video/mp4" />
          </video>
          
          {/* Interactive element without ARIA label */}
          <div 
            role="button" 
            tabIndex={0}
            style={{ background: 'lightgray', padding: '10px', cursor: 'pointer' }}
          >
            Interactive div without ARIA label
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTestPage;