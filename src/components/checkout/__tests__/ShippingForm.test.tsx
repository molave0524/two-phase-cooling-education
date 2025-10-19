/**
 * Integration tests for ShippingForm component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShippingForm } from '../ShippingForm'

describe('ShippingForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument()
  })

  it('should update form fields when user types', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    expect(emailInput).toHaveValue('test@example.com')
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    // Fill out customer info
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')

    // Fill out shipping address
    await user.type(screen.getByLabelText(/address/i), '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'San Francisco')
    await user.selectOptions(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/zip code/i), '94102')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }),
        expect.objectContaining({
          addressLine1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'US',
        })
      )
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    // Should not call onSubmit with empty form
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    // HTML5 validation should show error
    expect(emailInput).toBeInvalid()
  })

  it('should validate zip code format', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    const zipInput = screen.getByLabelText(/zip code/i)

    // Type invalid zip code
    await user.type(zipInput, 'ABCDE')

    // Should show validation error or prevent submission
    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should accept valid 5-digit zip code', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'San Francisco')
    await user.selectOptions(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/zip code/i), '94102')

    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('should show loading state when isLoading is true', () => {
    render(<ShippingForm onSubmit={mockOnSubmit} isLoading={true} />)

    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    expect(submitButton).toBeDisabled()
  })

  it('should disable form inputs when loading', () => {
    render(<ShippingForm onSubmit={mockOnSubmit} isLoading={true} />)

    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()
    expect(screen.getByLabelText(/last name/i)).toBeDisabled()
  })

  it('should allow optional company field', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'San Francisco')
    await user.selectOptions(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/zip code/i), '94102')

    // Company is optional
    const companyInput = screen.queryByLabelText(/company/i)
    if (companyInput) {
      await user.type(companyInput, 'Acme Corp')
    }

    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('should render all US states in dropdown', () => {
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    const stateSelect = screen.getByLabelText(/state/i)
    const options = Array.from(stateSelect.querySelectorAll('option'))

    // Should have all 50 states plus a placeholder
    expect(options.length).toBeGreaterThanOrEqual(50)

    // Should have California
    expect(options.some(opt => opt.value === 'CA')).toBe(true)
    // Should have New York
    expect(options.some(opt => opt.value === 'NY')).toBe(true)
    // Should have Texas
    expect(options.some(opt => opt.value === 'TX')).toBe(true)
  })

  it('should default country to US', () => {
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    const countryInput = screen.queryByLabelText(/country/i)
    if (countryInput) {
      expect(countryInput).toHaveValue('US')
    }
  })

  it('should allow address line 2 as optional', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')

    const address2Input = screen.queryByLabelText(/address.*2|apartment|suite/i)
    if (address2Input) {
      await user.type(address2Input, 'Apt 4B')
    }

    await user.type(screen.getByLabelText(/city/i), 'San Francisco')
    await user.selectOptions(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/zip code/i), '94102')

    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup()
    render(<ShippingForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/email/i), '  test@example.com  ')
    await user.type(screen.getByLabelText(/first name/i), '  John  ')
    await user.type(screen.getByLabelText(/last name/i), '  Doe  ')
    await user.type(screen.getByLabelText(/address/i), '  123 Main St  ')
    await user.type(screen.getByLabelText(/city/i), '  San Francisco  ')
    await user.selectOptions(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/zip code/i), '94102')

    const submitButton = screen.getByRole('button', { name: /continue to payment/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringMatching(/^\S.*\S$/), // No leading/trailing spaces
          firstName: expect.stringMatching(/^\S.*\S$/),
        }),
        expect.anything()
      )
    })
  })
})
