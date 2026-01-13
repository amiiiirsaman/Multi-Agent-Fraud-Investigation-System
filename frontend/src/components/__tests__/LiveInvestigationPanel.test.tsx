/**
 * Unit tests for LiveInvestigationPanel component.
 * 
 * The panel has been simplified - it only contains the form.
 * Investigation results are now displayed in the Multi-Agent Analysis section.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveInvestigationPanel } from '../LiveInvestigationPanel';

const defaultProps = {
  onInvestigate: vi.fn(),
  isInvestigating: false,
  onReset: vi.fn(),
};

describe('LiveInvestigationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in collapsed state by default', () => {
    render(<LiveInvestigationPanel {...defaultProps} />);
    
    expect(screen.getByText(/live investigation/i)).toBeInTheDocument();
    // Form should not be visible when collapsed
    expect(screen.queryByLabelText(/from account/i)).not.toBeInTheDocument();
  });

  it('expands form when header is clicked', async () => {
    render(<LiveInvestigationPanel {...defaultProps} />);
    
    // Click the header to expand
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) {
      fireEvent.click(header);
    }
    
    // Form fields should now be visible
    await waitFor(() => {
      expect(screen.getByText(/from account/i)).toBeInTheDocument();
    });
  });

  it('renders all form fields when expanded', async () => {
    render(<LiveInvestigationPanel {...defaultProps} />);
    
    // Expand the panel by clicking header
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByText(/from account/i)).toBeInTheDocument();
    });
    
    // Check for all form fields (using getAllByText for fields that may match labels and options)
    expect(screen.getByText(/to account/i)).toBeInTheDocument();
    expect(screen.getByText(/^amount/i)).toBeInTheDocument();
    expect(screen.getByText(/merchant category/i)).toBeInTheDocument();
    expect(screen.getAllByText(/location/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/device id/i)).toBeInTheDocument();
  });

  it('calls onInvestigate with transaction data when form is submitted', async () => {
    const mockInvestigate = vi.fn();
    render(<LiveInvestigationPanel {...defaultProps} onInvestigate={mockInvestigate} />);
    
    // Expand the panel
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., ACC-12345/i)).toBeInTheDocument();
    });
    
    // Fill out required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g., ACC-12345/i), { target: { value: 'ACC-001' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g., ACC-67890/i), { target: { value: 'ACC-002' } });
    fireEvent.change(screen.getByPlaceholderText(/enter amount/i), { target: { value: '1000' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /run investigation/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockInvestigate).toHaveBeenCalledWith(
        expect.objectContaining({
          from_account: 'ACC-001',
          to_account: 'ACC-002',
          amount: 1000,
        })
      );
    });
  });

  it('collapses panel after form submission', async () => {
    const mockInvestigate = vi.fn();
    render(<LiveInvestigationPanel {...defaultProps} onInvestigate={mockInvestigate} />);
    
    // Expand the panel
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., ACC-12345/i)).toBeInTheDocument();
    });
    
    // Fill out required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g., ACC-12345/i), { target: { value: 'ACC-001' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g., ACC-67890/i), { target: { value: 'ACC-002' } });
    fireEvent.change(screen.getByPlaceholderText(/enter amount/i), { target: { value: '1000' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /run investigation/i });
    fireEvent.click(submitButton);
    
    // Panel should collapse - form should no longer be visible
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/e.g., ACC-12345/i)).not.toBeInTheDocument();
    });
  });

  it('collapses panel when forceCollapse prop is true', async () => {
    const { rerender } = render(<LiveInvestigationPanel {...defaultProps} />);
    
    // Expand the panel
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., ACC-12345/i)).toBeInTheDocument();
    });
    
    // Force collapse via prop
    rerender(<LiveInvestigationPanel {...defaultProps} forceCollapse={true} />);
    
    // Panel should collapse
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/e.g., ACC-12345/i)).not.toBeInTheDocument();
    });
  });

  it('shows processing indicator when isInvestigating is true', () => {
    render(<LiveInvestigationPanel {...defaultProps} isInvestigating={true} />);
    
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('disables form inputs when isInvestigating is true', async () => {
    render(<LiveInvestigationPanel {...defaultProps} isInvestigating={true} />);
    
    // Expand the panel
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      expect(amountInput).toBeDisabled();
    });
  });

  it('does not display results in the panel (results moved to Multi-Agent Analysis)', async () => {
    render(<LiveInvestigationPanel {...defaultProps} />);
    
    // Expand the panel
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., ACC-12345/i)).toBeInTheDocument();
    });
    
    // There should be no AgentPanel component rendered in this panel
    // (AgentPanel renders with specific agent names like "Risk Analyst")
    expect(screen.queryByText(/risk analyst/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fraud investigator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/compliance officer/i)).not.toBeInTheDocument();
    
    // There should be no Timeline component (it shows timestamps with specific format)
    expect(screen.queryByText(/investigation timeline/i)).not.toBeInTheDocument();
    
    // Instead, there should be a note about where results appear
    expect(screen.getByText(/multi-agent analysis section below/i)).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', async () => {
    const mockReset = vi.fn();
    render(<LiveInvestigationPanel {...defaultProps} onReset={mockReset} />);
    
    // Expand the panel
    const header = screen.getByText(/live investigation/i).closest('.livePanelHeader');
    if (header) fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
    
    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    
    expect(mockReset).toHaveBeenCalled();
  });
});
