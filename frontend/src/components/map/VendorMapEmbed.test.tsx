/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import VendorMapEmbed from './VendorMapEmbed';

describe('VendorMapEmbed', () => {
  it('renders iframe with correct src', () => {
    render(<VendorMapEmbed lat={12.34} lng={56.78} label="Test Shop" />);
    const iframe = screen.getByTitle(/map for/i) as HTMLIFrameElement;
  expect(iframe).toBeInTheDocument();
    // ensure coordinates exist in src and label encoded
    expect(iframe.src).toContain('12.34,56.78');
    expect(iframe.src).toMatch(/Test%20Shop|Test%2520Shop/); // double-encoding resilience
  });

  it('has Get Directions link with correct URL', () => {
    render(<VendorMapEmbed lat={1} lng={2} label="X" />);
    const links = screen.getAllByRole('link', { name: /get directions/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=1,2');
  });

  it('shows fallback when invalid coordinates', () => {
    render(<VendorMapEmbed lat={999} lng={2} label="Bad Shop" />);
  expect(screen.getByText(/invalid coordinates/i)).toBeInTheDocument();
  const searchLink = screen.getByRole('link', { name: /open google maps search/i });
  expect(searchLink).toHaveAttribute('href', expect.stringContaining('Bad%20Shop'));
  });

  it('calls onMapLoad when iframe load is triggered', () => {
    const onMapLoad = vi.fn();
    render(<VendorMapEmbed lat={10} lng={20} label="Load" onMapLoad={onMapLoad} />);
    const iframes = screen.getAllByTitle(/map for/i) as HTMLIFrameElement[];
    expect(iframes).toHaveLength(1);
    iframes[0].dispatchEvent(new Event('load'));
    expect(onMapLoad).toHaveBeenCalledTimes(1);
  });
});
