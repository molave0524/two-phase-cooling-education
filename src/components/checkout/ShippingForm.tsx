'use client'

import React, { useState } from 'react'
import { OrderShippingAddress, OrderCustomer } from '@/lib/orders'

interface ShippingFormProps {
  onSubmit: (customer: OrderCustomer, shippingAddress: OrderShippingAddress) => void
  isLoading?: boolean
}

interface FormData {
  // Customer Info
  email: string
  firstName: string
  lastName: string
  phone: string

  // Shipping Address
  company: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  shippingPhone: string

  // Options
  billingAddressSameAsShipping: boolean
  subscribeToNewsletter: boolean
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

export const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    shippingPhone: '',
    billingAddressSameAsShipping: true,
    subscribeToNewsletter: false,
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // Required fields validation
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    if (!formData.addressLine1) newErrors.addressLine1 = 'Address is required'
    if (!formData.city) newErrors.city = 'City is required'
    if (!formData.state) newErrors.state = 'State is required'
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    const phoneRegex = /^[\d\s\-\(\)\+]+$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // ZIP code validation
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (formData.zipCode && !zipRegex.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code (12345 or 12345-6789)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const customer: OrderCustomer = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
    }

    const shippingAddress: OrderShippingAddress = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company || undefined,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2 || undefined,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
      phone: formData.shippingPhone || formData.phone || undefined,
    }

    onSubmit(customer, shippingAddress)
  }

  const inputClasses = (fieldName: keyof FormData) =>
    `mt-1 block w-full rounded-md border ${
      errors[fieldName] ? 'border-red-300' : 'border-gray-300'
    } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Contact & Shipping Information</h3>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Contact Information */}
        <div>
          <h4 className='text-md font-medium text-gray-900 mb-4'>Contact Information</h4>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <label htmlFor='firstName' className='block text-sm font-medium text-gray-700'>
                First Name *
              </label>
              <input
                type='text'
                id='firstName'
                name='firstName'
                value={formData.firstName}
                onChange={handleInputChange}
                className={inputClasses('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && <p className='mt-1 text-sm text-red-600'>{errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor='lastName' className='block text-sm font-medium text-gray-700'>
                Last Name *
              </label>
              <input
                type='text'
                id='lastName'
                name='lastName'
                value={formData.lastName}
                onChange={handleInputChange}
                className={inputClasses('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && <p className='mt-1 text-sm text-red-600'>{errors.lastName}</p>}
            </div>

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Email Address *
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                className={inputClasses('email')}
                disabled={isLoading}
              />
              {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor='phone' className='block text-sm font-medium text-gray-700'>
                Phone Number
              </label>
              <input
                type='tel'
                id='phone'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                className={inputClasses('phone')}
                disabled={isLoading}
              />
              {errors.phone && <p className='mt-1 text-sm text-red-600'>{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h4 className='text-md font-medium text-gray-900 mb-4'>Shipping Address</h4>
          <div className='space-y-4'>
            <div>
              <label htmlFor='company' className='block text-sm font-medium text-gray-700'>
                Company (Optional)
              </label>
              <input
                type='text'
                id='company'
                name='company'
                value={formData.company}
                onChange={handleInputChange}
                className={inputClasses('company')}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor='addressLine1' className='block text-sm font-medium text-gray-700'>
                Address Line 1 *
              </label>
              <input
                type='text'
                id='addressLine1'
                name='addressLine1'
                value={formData.addressLine1}
                onChange={handleInputChange}
                className={inputClasses('addressLine1')}
                disabled={isLoading}
              />
              {errors.addressLine1 && (
                <p className='mt-1 text-sm text-red-600'>{errors.addressLine1}</p>
              )}
            </div>

            <div>
              <label htmlFor='addressLine2' className='block text-sm font-medium text-gray-700'>
                Address Line 2 (Optional)
              </label>
              <input
                type='text'
                id='addressLine2'
                name='addressLine2'
                value={formData.addressLine2}
                onChange={handleInputChange}
                className={inputClasses('addressLine2')}
                disabled={isLoading}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div>
                <label htmlFor='city' className='block text-sm font-medium text-gray-700'>
                  City *
                </label>
                <input
                  type='text'
                  id='city'
                  name='city'
                  value={formData.city}
                  onChange={handleInputChange}
                  className={inputClasses('city')}
                  disabled={isLoading}
                />
                {errors.city && <p className='mt-1 text-sm text-red-600'>{errors.city}</p>}
              </div>

              <div>
                <label htmlFor='state' className='block text-sm font-medium text-gray-700'>
                  State *
                </label>
                <select
                  id='state'
                  name='state'
                  value={formData.state}
                  onChange={handleInputChange}
                  className={inputClasses('state')}
                  disabled={isLoading}
                >
                  <option value=''>Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {errors.state && <p className='mt-1 text-sm text-red-600'>{errors.state}</p>}
              </div>

              <div>
                <label htmlFor='zipCode' className='block text-sm font-medium text-gray-700'>
                  ZIP Code *
                </label>
                <input
                  type='text'
                  id='zipCode'
                  name='zipCode'
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className={inputClasses('zipCode')}
                  disabled={isLoading}
                />
                {errors.zipCode && <p className='mt-1 text-sm text-red-600'>{errors.zipCode}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className='space-y-3'>
          <div className='flex items-center'>
            <input
              id='subscribeToNewsletter'
              name='subscribeToNewsletter'
              type='checkbox'
              checked={formData.subscribeToNewsletter}
              onChange={handleInputChange}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              disabled={isLoading}
            />
            <label htmlFor='subscribeToNewsletter' className='ml-2 block text-sm text-gray-700'>
              Subscribe to our newsletter for product updates and cooling technology insights
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Processing...
            </div>
          ) : (
            'Continue to Payment'
          )}
        </button>
      </form>
    </div>
  )
}
