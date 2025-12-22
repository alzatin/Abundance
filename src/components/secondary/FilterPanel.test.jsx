import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from './FilterPanel';

describe('FilterPanel', () => {
  const mockProjects = [
    {
      owner: 'user1',
      topics: ['tag1', 'tag2'],
      dateCreated: '2023-01-15T00:00:00Z',
      repoName: 'project1',
    },
    {
      owner: 'user2',
      topics: ['tag2', 'tag3'],
      dateCreated: '2024-03-20T00:00:00Z',
      repoName: 'project2',
    },
    {
      owner: 'user1',
      topics: ['tag1', 'abundance-tool'],
      dateCreated: '2024-06-10T00:00:00Z',
      repoName: 'project3',
    },
  ];

  it('should render filter panel with sections', () => {
    const mockOnFilterChange = vi.fn();
    render(<FilterPanel projects={mockProjects} onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByText(/Filters/i)).toBeDefined();
    expect(screen.getByText(/Users/i)).toBeDefined();
    expect(screen.getByText(/Tags/i)).toBeDefined();
    expect(screen.getByText(/Years/i)).toBeDefined();
  });

  it('should extract unique users from projects', () => {
    const mockOnFilterChange = vi.fn();
    render(<FilterPanel projects={mockProjects} onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByText('user1')).toBeDefined();
    expect(screen.getByText('user2')).toBeDefined();
  });

  it('should extract unique tags excluding abundance-tool', () => {
    const mockOnFilterChange = vi.fn();
    render(<FilterPanel projects={mockProjects} onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByText('tag1')).toBeDefined();
    expect(screen.getByText('tag2')).toBeDefined();
    expect(screen.getByText('tag3')).toBeDefined();
    // abundance-tool should be filtered out
    expect(screen.queryByText('abundance-tool')).toBeNull();
  });

  it('should call onFilterChange when checkbox is clicked', () => {
    const mockOnFilterChange = vi.fn();
    render(<FilterPanel projects={mockProjects} onFilterChange={mockOnFilterChange} />);
    
    const userCheckbox = screen.getByLabelText(/user1/i);
    fireEvent.click(userCheckbox);
    
    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('should show clear all button when filters are active', () => {
    const mockOnFilterChange = vi.fn();
    render(<FilterPanel projects={mockProjects} onFilterChange={mockOnFilterChange} />);
    
    // Initially no clear button
    expect(screen.queryByText('Clear All')).toBeNull();
    
    // Click a checkbox
    const userCheckbox = screen.getByLabelText(/user1/i);
    fireEvent.click(userCheckbox);
    
    // Now clear button should appear
    expect(screen.getByText('Clear All')).toBeDefined();
  });
});
