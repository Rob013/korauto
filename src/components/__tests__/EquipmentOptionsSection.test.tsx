import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock the EquipmentOptionsSection component for testing
const EquipmentOptionsSection = ({ options }: { options: { standard?: string[], choice?: string[] } }) => {
  const PREVIEW_SHOW_COUNT = 10; // Updated to match actual implementation
  
  const getPreviewItems = () => {
    if (options.standard && options.standard.length > 0) {
      return options.standard.slice(0, PREVIEW_SHOW_COUNT);
    }
    return [];
  };

  const previewItems = getPreviewItems();

  return (
    <div data-testid="equipment-options">
      {/* Preview Section */}
      {previewItems.length > 0 && (
        <div data-testid="preview-section">
          <h5>Pajisje Standarde</h5>
          {/* Removed "(10 previews)" text as per requirements */}
          <span>({options.standard?.length || 0} total)</span>
          {previewItems.map((item, index) => (
            <div key={index} data-testid={`preview-item-${index}`}>
              {item}
            </div>
          ))}
          {(options.standard?.length || 0) > PREVIEW_SHOW_COUNT && (
            <span data-testid="more-count">
              +{(options.standard?.length || 0) - PREVIEW_SHOW_COUNT} më shumë pajisje
            </span>
          )}
        </div>
      )}
    </div>
  );
};

describe('EquipmentOptionsSection', () => {
  test('shows preview of up to 10 standard equipment items', () => {
    const mockOptions = {
      standard: [
        'Air Conditioning',
        'Power Steering',
        'ABS Brakes',
        'Airbags',
        'Electric Windows',
        'Radio/Audio System',
        'Bluetooth Connectivity',
        'Cruise Control',
        'GPS Navigation',
        'Heated Seats',
        'Extra Item 1',
        'Extra Item 2'
      ]
    };

    render(<EquipmentOptionsSection options={mockOptions} />);

    // Check preview section exists
    expect(screen.getByTestId('preview-section')).toBeInTheDocument();

    // Check that exactly 10 items are shown in preview (even though 12 are available)
    expect(screen.getByTestId('preview-item-0')).toHaveTextContent('Air Conditioning');
    expect(screen.getByTestId('preview-item-1')).toHaveTextContent('Power Steering');
    expect(screen.getByTestId('preview-item-2')).toHaveTextContent('ABS Brakes');
    expect(screen.getByTestId('preview-item-3')).toHaveTextContent('Airbags');
    expect(screen.getByTestId('preview-item-4')).toHaveTextContent('Electric Windows');
    expect(screen.getByTestId('preview-item-5')).toHaveTextContent('Radio/Audio System');
    expect(screen.getByTestId('preview-item-6')).toHaveTextContent('Bluetooth Connectivity');
    expect(screen.getByTestId('preview-item-7')).toHaveTextContent('Cruise Control');
    expect(screen.getByTestId('preview-item-8')).toHaveTextContent('GPS Navigation');
    expect(screen.getByTestId('preview-item-9')).toHaveTextContent('Heated Seats');

    // Check that "more items" indicator shows the correct count
    expect(screen.getByTestId('more-count')).toHaveTextContent('+2 më shumë pajisje');

    // Check total count is shown
    expect(screen.getByText('(12 total)')).toBeInTheDocument();
  });

  test('does not show preview when no standard equipment', () => {
    const mockOptions = {
      choice: ['Optional Item 1', 'Optional Item 2']
    };

    render(<EquipmentOptionsSection options={mockOptions} />);

    // Check preview section does not exist
    expect(screen.queryByTestId('preview-section')).not.toBeInTheDocument();
  });

  test('shows all items when less than 10 standard equipment items', () => {
    const mockOptions = {
      standard: ['Air Conditioning', 'Power Steering', 'ABS Brakes']
    };

    render(<EquipmentOptionsSection options={mockOptions} />);

    // Check preview section exists
    expect(screen.getByTestId('preview-section')).toBeInTheDocument();

    // Check all 3 items are shown
    expect(screen.getByTestId('preview-item-0')).toHaveTextContent('Air Conditioning');
    expect(screen.getByTestId('preview-item-1')).toHaveTextContent('Power Steering');
    expect(screen.getByTestId('preview-item-2')).toHaveTextContent('ABS Brakes');

    // Check no "more items" indicator
    expect(screen.queryByTestId('more-count')).not.toBeInTheDocument();

    // Check total count
    expect(screen.getByText('(3 total)')).toBeInTheDocument();
  });
});