/**
 * Integration tests for ProfileSection component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import ProfileSection from '../ProfileSection'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

global.fetch = jest.fn()

describe('ProfileSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<ProfileSection />)

    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('should load and display user profile', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      }),
    })

    render(<ProfileSection />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })
  })

  it('should update profile when form is submitted', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock GET profile
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      }),
    })

    render(<ProfileSection />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Mock PATCH profile
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Profile updated successfully' }),
    })

    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    const saveButton = screen.getByText('Update Profile')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/account/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Updated Name'),
        })
      )
    })
  })

  it('should handle profile update errors', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock GET profile
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      }),
    })

    render(<ProfileSection />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Mock PATCH profile failure
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to update profile' }),
    })

    const saveButton = screen.getByText('Update Profile')
    fireEvent.click(saveButton)

    await waitFor(() => {
      const toast = require('react-hot-toast').default
      expect(toast.error).toHaveBeenCalled()
    })
  })
})
