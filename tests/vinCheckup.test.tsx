import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VinCheckup } from '../src/components/VinCheckup';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('VinCheckup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render VIN checkup form', () => {
    render(<VinCheckup />);
    
    expect(screen.getByText('VIN Checkup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter VIN (17 characters)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lookup/i })).toBeInTheDocument();
  });

  it('should validate VIN format', async () => {
    render(<VinCheckup />);
    
    const input = screen.getByPlaceholderText('Enter VIN (17 characters)');
    const button = screen.getByRole('button', { name: /lookup/i });
    
    // Test with invalid VIN (too short)
    fireEvent.change(input, { target: { value: 'SHORTVIN' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Invalid VIN',
        description: 'Please enter a valid 17-character VIN',
        variant: 'destructive'
      });
    });
  });

  it('should make API call with valid VIN', async () => {
    const mockVinData = {
      vin: 'KLACD266DFB048651',
      year: '2023',
      make: 'KIA',
      model: 'SOUL',
      trim: 'EX'
    };

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVinData
    });

    render(<VinCheckup />);
    
    const input = screen.getByPlaceholderText('Enter VIN (17 characters)');
    const button = screen.getByRole('button', { name: /lookup/i });
    
    // Test with valid VIN
    fireEvent.change(input, { target: { value: 'KLACD266DFB048651' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.vehicledatabases.com/vin-decode/KLACD266DFB048651?api_key=65fdaccc8bfa11f0bdf80242ac120002'
      );
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'VIN Lookup Successful',
        description: 'Found vehicle information for VIN: KLACD266DFB048651'
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    render(<VinCheckup />);
    
    const input = screen.getByPlaceholderText('Enter VIN (17 characters)');
    const button = screen.getByRole('button', { name: /lookup/i });
    
    fireEvent.change(input, { target: { value: 'KLACD266DFB048651' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'VIN Lookup Failed',
        description: 'API Error: 404 Not Found',
        variant: 'destructive'
      });
    });
  });

  it('should handle Enter key press for VIN lookup', async () => {
    render(<VinCheckup />);
    
    const input = screen.getByPlaceholderText('Enter VIN (17 characters)');
    
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Please enter a VIN number',
        variant: 'destructive'
      });
    });
  });

  it('should display vehicle information when VIN lookup succeeds', async () => {
    const mockVinData = {
      vin: 'KLACD266DFB048651',
      year: '2023',
      make: 'KIA',
      model: 'SOUL',
      trim: 'EX',
      fuel_type: 'Gasoline'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVinData
    });

    render(<VinCheckup />);
    
    const input = screen.getByPlaceholderText('Enter VIN (17 characters)');
    const button = screen.getByRole('button', { name: /lookup/i });
    
    fireEvent.change(input, { target: { value: 'KLACD266DFB048651' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Information Found')).toBeInTheDocument();
      expect(screen.getByText('KLACD266DFB048651')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('KIA')).toBeInTheDocument();
      expect(screen.getByText('SOUL')).toBeInTheDocument();
      expect(screen.getByText('EX')).toBeInTheDocument();
      expect(screen.getByText('Gasoline')).toBeInTheDocument();
    });
  });
});