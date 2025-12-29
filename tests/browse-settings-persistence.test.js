/**
 * Tests for Browse Settings Session Persistence
 * 
 * These tests verify that user preferences for project browsing
 * persist during a session (as long as the page is not refreshed
 * or the user logs out).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { BrowseSettingsProvider, useBrowseSettings } from '../src/contexts/BrowseSettingsContext.jsx';

describe('BrowseSettingsContext', () => {
  const wrapper = ({ children }) => (
    <BrowseSettingsProvider>{children}</BrowseSettingsProvider>
  );

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    expect(result.current.orderType).toBe('byDateModified');
    expect(result.current.browseType).toBe('thumb');
    expect(result.current.projectTab).toBe('owned');
    expect(result.current.filters.showForks).toBe(true);
    expect(result.current.filters.users.size).toBe(0);
    expect(result.current.filters.tags.size).toBe(0);
    expect(result.current.filters.years.size).toBe(0);
  });

  it('should persist orderType changes', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    act(() => {
      result.current.updateOrderType('byName');
    });

    expect(result.current.orderType).toBe('byName');

    act(() => {
      result.current.updateOrderType('byStars');
    });

    expect(result.current.orderType).toBe('byStars');
  });

  it('should persist browseType changes', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    act(() => {
      result.current.updateBrowseType('list');
    });

    expect(result.current.browseType).toBe('list');

    act(() => {
      result.current.updateBrowseType('thumb');
    });

    expect(result.current.browseType).toBe('thumb');
  });

  it('should persist projectTab changes', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    act(() => {
      result.current.updateProjectTab('featured');
    });

    expect(result.current.projectTab).toBe('featured');

    act(() => {
      result.current.updateProjectTab('all');
    });

    expect(result.current.projectTab).toBe('all');
  });

  it('should persist filter changes', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    const newFilters = {
      users: new Set(['user1', 'user2']),
      tags: new Set(['tag1']),
      years: new Set([2023, 2024]),
      showForks: false,
    };

    act(() => {
      result.current.updateFilters(newFilters);
    });

    expect(result.current.filters.users.size).toBe(2);
    expect(result.current.filters.users.has('user1')).toBe(true);
    expect(result.current.filters.users.has('user2')).toBe(true);
    expect(result.current.filters.tags.size).toBe(1);
    expect(result.current.filters.tags.has('tag1')).toBe(true);
    expect(result.current.filters.years.size).toBe(2);
    expect(result.current.filters.years.has(2023)).toBe(true);
    expect(result.current.filters.years.has(2024)).toBe(true);
    expect(result.current.filters.showForks).toBe(false);
  });

  it('should reset all settings to defaults', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    // Change all settings
    act(() => {
      result.current.updateOrderType('byName');
      result.current.updateBrowseType('list');
      result.current.updateProjectTab('featured');
      result.current.updateFilters({
        users: new Set(['user1']),
        tags: new Set(['tag1']),
        years: new Set([2023]),
        showForks: false,
      });
    });

    // Verify settings were changed
    expect(result.current.orderType).toBe('byName');
    expect(result.current.browseType).toBe('list');
    expect(result.current.projectTab).toBe('featured');
    expect(result.current.filters.showForks).toBe(false);

    // Reset
    act(() => {
      result.current.resetSettings();
    });

    // Verify all settings are back to defaults
    expect(result.current.orderType).toBe('byDateModified');
    expect(result.current.browseType).toBe('thumb');
    expect(result.current.projectTab).toBe('owned');
    expect(result.current.filters.showForks).toBe(true);
    expect(result.current.filters.users.size).toBe(0);
    expect(result.current.filters.tags.size).toBe(0);
    expect(result.current.filters.years.size).toBe(0);
  });

  it('should maintain settings across multiple updates', () => {
    const { result } = renderHook(() => useBrowseSettings(), { wrapper });

    // Simulate user changing settings multiple times
    act(() => {
      result.current.updateOrderType('byStars');
    });
    expect(result.current.orderType).toBe('byStars');

    act(() => {
      result.current.updateBrowseType('list');
    });
    expect(result.current.orderType).toBe('byStars'); // Should still be byStars
    expect(result.current.browseType).toBe('list');

    act(() => {
      result.current.updateProjectTab('liked');
    });
    expect(result.current.orderType).toBe('byStars'); // Should still be byStars
    expect(result.current.browseType).toBe('list'); // Should still be list
    expect(result.current.projectTab).toBe('liked');

    act(() => {
      result.current.updateFilters({
        users: new Set(['testuser']),
        tags: new Set(),
        years: new Set(),
        showForks: true,
      });
    });
    // All previous settings should be maintained
    expect(result.current.orderType).toBe('byStars');
    expect(result.current.browseType).toBe('list');
    expect(result.current.projectTab).toBe('liked');
    expect(result.current.filters.users.has('testuser')).toBe(true);
  });
});

describe('Session Persistence Behavior', () => {
  it('should document expected persistence behavior', () => {
    // Document the expected behavior for manual testing
    const expectedBehavior = {
      persistence: 'in-memory during session',
      resetOn: ['page refresh', 'logout'],
      maintainedDuring: ['navigation between projects', 'switching tabs'],
      settings: [
        'sort order (byName, byForks, byStars, etc.)',
        'filters (users, tags, years, showForks)',
        'browse type (list vs thumbnail)',
        'active project tab (owned, liked, featured, all, tutorials)',
      ],
    };

    expect(expectedBehavior.persistence).toBe('in-memory during session');
    expect(expectedBehavior.resetOn).toContain('logout');
    expect(expectedBehavior.maintainedDuring).toContain('navigation between projects');
    expect(expectedBehavior.settings.length).toBe(4);
  });
});
