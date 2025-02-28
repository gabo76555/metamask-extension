import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SamplePetnamesForm } from './sample-petnames-form';
import { usePetnames } from '../../../ducks/metamask/sample-petnames-duck';
import { useSamplePetnamesMetrics } from '../hooks/useSamplePetnamesMetrics';

// Mock the hooks
jest.mock('../../../ducks/metamask/sample-petnames-duck');
jest.mock('../hooks/useSamplePetnamesMetrics');

describe('SamplePetnamesForm', () => {
  const mockAssignPetname = jest.fn().mockResolvedValue(undefined);
  let mockStore: ReturnType<typeof configureStore>;
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock store for each test
    mockStore = configureStore([]);
    store = mockStore({
      metamask: {
        samplePetnamesByChainIdAndAddress: {},
      },
    });

    // Mock the usePetnames hook
    (usePetnames as jest.Mock).mockReturnValue({
      namesForCurrentChain: {},
      assignPetname: mockAssignPetname,
    });

    // Mock the useSamplePetnamesMetrics hook
    (useSamplePetnamesMetrics as jest.Mock).mockReturnValue({
      trackPetnamesFormViewed: jest.fn(),
      trackPetnameAdded: jest.fn(),
      trackFormValidationError: jest.fn(),
      trackFormSubmissionError: jest.fn(),
      trackFormInteraction: jest.fn(),
    });
  });

  it('renders with empty state when no pet names exist', () => {
    renderWithProvider(<SamplePetnamesForm />, store);

    expect(screen.getByText('Pet Names on this network')).toBeInTheDocument();
    expect(screen.getByText('No pet names added yet')).toBeInTheDocument();

    // Form elements should be present
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add Pet Name' }),
    ).toBeInTheDocument();
  });

  it('renders pet names when they exist', () => {
    const mockNames = {
      '0x1234567890abcdef1234567890abcdef12345678': 'TestName1',
      '0xabcdef1234567890abcdef1234567890abcdef12': 'TestName2',
    };

    (usePetnames as jest.Mock).mockReturnValue({
      namesForCurrentChain: mockNames,
      assignPetname: mockAssignPetname,
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    expect(screen.getByText('Pet Names on this network')).toBeInTheDocument();
    expect(screen.getByText('TestName1')).toBeInTheDocument();
    expect(screen.getByText('TestName2')).toBeInTheDocument();
    expect(
      screen.queryByText('No pet names added yet'),
    ).not.toBeInTheDocument();
  });

  it('disables submit button with invalid inputs', () => {
    renderWithProvider(<SamplePetnamesForm />, store);

    const addressInput = screen.getByLabelText('Address');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });

    // Initial state - button should be disabled
    expect(submitButton).toBeDisabled();

    // Enter invalid address
    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Button should still be disabled with invalid address
    expect(submitButton).toBeDisabled();

    // Enter valid address but no name
    fireEvent.change(addressInput, {
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    fireEvent.change(nameInput, { target: { value: '' } });

    // Button should still be disabled with no name
    expect(submitButton).toBeDisabled();

    // Enter valid address and name
    fireEvent.change(addressInput, {
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Button should be enabled with valid inputs
    expect(submitButton).not.toBeDisabled();
  });

  it('submits form with valid inputs', async () => {
    (usePetnames as jest.Mock).mockImplementation(() => ({
      namesForCurrentChain: {},
      assignPetname: mockAssignPetname,
    }));

    renderWithProvider(<SamplePetnamesForm />, store);

    const addressInput = screen.getByLabelText('Address');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });

    // Enter valid inputs
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const validName = 'Valid Name';

    fireEvent.change(addressInput, { target: { value: validAddress } });
    fireEvent.change(nameInput, { target: { value: validName } });

    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAssignPetname).toHaveBeenCalledWith(
        validAddress as Hex,
        validName,
      );
    });
  });

  it('handles submission error', async () => {
    const errorMessage = 'Something went wrong';

    // Mock the component to show error message
    (usePetnames as jest.Mock).mockImplementation(() => ({
      namesForCurrentChain: {},
      assignPetname: () => {
        return Promise.reject(new Error(errorMessage));
      },
    }));

    renderWithProvider(<SamplePetnamesForm />, store);

    const addressInput = screen.getByLabelText('Address');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });

    // Enter valid inputs
    fireEvent.change(addressInput, {
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for any state updates to complete after the error
    await waitFor(() => {
      expect(
        (useSamplePetnamesMetrics as jest.Mock).mock.results[0].value
          .trackFormSubmissionError,
      ).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should track form view on component mount', () => {
    renderWithProvider(<SamplePetnamesForm />, store);

    expect(
      (useSamplePetnamesMetrics as jest.Mock).mock.results[0].value
        .trackPetnamesFormViewed,
    ).toHaveBeenCalledTimes(1);
  });

  it('should track input interaction when fields change', () => {
    renderWithProvider(<SamplePetnamesForm />, store);

    const addressField = screen.getByLabelText('Address');
    fireEvent.change(addressField, { target: { value: '0x123' } });

    expect(
      (useSamplePetnamesMetrics as jest.Mock).mock.results[0].value
        .trackFormInteraction,
    ).toHaveBeenCalledWith('input_change');
  });

  it('should track validation errors on form submission', async () => {
    // More direct approach to test validation errors
    const trackFormValidationErrorMock = jest.fn();

    // Override the metrics mock for this test
    (useSamplePetnamesMetrics as jest.Mock).mockReturnValue({
      trackPetnamesFormViewed: jest.fn(),
      trackPetnameAdded: jest.fn(),
      trackFormValidationError: trackFormValidationErrorMock,
      trackFormSubmissionError: jest.fn(),
      trackFormInteraction: jest.fn(),
    });

    const { container } = renderWithProvider(<SamplePetnamesForm />, store);

    // Add invalid values
    const addressField = screen.getByLabelText('Address');
    const nameField = screen.getByLabelText('Name');

    fireEvent.change(addressField, { target: { value: 'invalid-address' } });
    fireEvent.change(nameField, { target: { value: '' } });

    // Submit the form directly by finding and submitting the form element
    const form = container.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    // Wait for state updates
    await waitFor(() => {
      expect(trackFormValidationErrorMock).toHaveBeenCalledWith({
        addressError: true,
        nameError: true,
      });
    });
  });

  it('should track successful petname addition', async () => {
    // Mock successful assignment
    mockAssignPetname.mockResolvedValue(undefined);

    renderWithProvider(<SamplePetnamesForm />, store);

    // Add valid values
    const addressField = screen.getByLabelText('Address');
    const nameField = screen.getByLabelText('Name');

    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const validName = 'Test Name';

    fireEvent.change(addressField, { target: { value: validAddress } });
    fireEvent.change(nameField, { target: { value: validName } });

    // Submit the form
    const submitButton = screen.getByText('Add Pet Name');
    fireEvent.click(submitButton);

    // Wait for the async action to complete
    await waitFor(() => {
      expect(mockAssignPetname).toHaveBeenCalledWith(validAddress, validName);
      expect(
        (useSamplePetnamesMetrics as jest.Mock).mock.results[0].value
          .trackPetnameAdded,
      ).toHaveBeenCalled();
    });
  });

  it('should track submission errors', async () => {
    // Mock failed assignment
    const errorMessage = 'Failed to add petname';
    mockAssignPetname.mockRejectedValue(new Error(errorMessage));

    renderWithProvider(<SamplePetnamesForm />, store);

    // Add valid values
    const addressField = screen.getByLabelText('Address');
    const nameField = screen.getByLabelText('Name');

    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const validName = 'Test Name';

    fireEvent.change(addressField, { target: { value: validAddress } });
    fireEvent.change(nameField, { target: { value: validName } });

    // Submit the form
    const submitButton = screen.getByText('Add Pet Name');
    fireEvent.click(submitButton);

    // Wait for the async action to complete
    await new Promise(process.nextTick);

    expect(
      (useSamplePetnamesMetrics as jest.Mock).mock.results[0].value
        .trackFormSubmissionError,
    ).toHaveBeenCalledWith(errorMessage);
  });
});
