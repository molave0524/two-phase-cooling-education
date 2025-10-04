/**
 * Integration tests for GuestConversionModal component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import GuestConversionModal from '../GuestConversionModal'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('next-auth/react')
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

global.fetch = jest.fn()

describe('GuestConversionModal', () => {
  const mockOnClose = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
  })

  it('should render modal when open', () => {
    render(<GuestConversionModal isOpen={true} onClose={mockOnClose} email='test@example.com' />)

    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    render(<GuestConversionModal isOpen={false} onClose={mockOnClose} email='test@example.com' />)

    expect(screen.queryByText('Create Your Account')).not.toBeInTheDocument()
  })

  it('should validate password match before submission', async () => {
    render(<GuestConversionModal isOpen={true} onClose={mockOnClose} email='test@example.com' />)

    const nameInput = screen.getByLabelText('Name')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByText('Create Account')

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const toast = require('react-hot-toast').default
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match')
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should create account and sign in on successful submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Account created successfully',
        ordersLinked: 2,
      }),
    })

    mockSignIn.mockResolvedValueOnce({
      ok: true,
      error: null,
      status: 200,
      url: null,
    })

    render(<GuestConversionModal isOpen={true} onClose={mockOnClose} email='test@example.com' />)

    const nameInput = screen.getByLabelText('Name')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByText('Create Account')

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/account/convert-guest',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test User'),
        })
      )
    })

    await waitFor(() => {
      const toast = require('react-hot-toast').default
      expect(toast.success).toHaveBeenCalledWith('Account created! 2 order(s) linked.')
    })

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'TestPassword123',
      redirect: false,
    })

    expect(mockPush).toHaveBeenCalledWith('/account')
  })

  it('should handle account creation errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already registered' }),
    })

    render(<GuestConversionModal isOpen={true} onClose={mockOnClose} email='test@example.com' />)

    const nameInput = screen.getByLabelText('Name')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByText('Create Account')

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const toast = require('react-hot-toast').default
      expect(toast.error).toHaveBeenCalledWith('Email already registered')
    })

    expect(mockSignIn).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should close modal when Skip button is clicked', () => {
    render(<GuestConversionModal isOpen={true} onClose={mockOnClose} email='test@example.com' />)

    const skipButton = screen.getByText('Skip')
    fireEvent.click(skipButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
