'use client'

import React, { useState } from 'react'
import { OrderShippingAddress, OrderCustomer } from '@/lib/orders'
import styles from './ShippingForm.module.css'

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
      phone: formData.phone || '',
    }

    const shippingAddress: OrderShippingAddress = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company || '',
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2 || '',
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
      phone: formData.shippingPhone || formData.phone || '',
    }

    onSubmit(customer, shippingAddress)
  }

  const getFieldClasses = (fieldName: keyof FormData, isSelect = false) => {
    const baseClass = isSelect ? styles.fieldSelect : styles.fieldInput
    const errorClass = isSelect ? styles.fieldSelectError : styles.fieldInputError
    return errors[fieldName] ? `${baseClass} ${errorClass}` : baseClass
  }

  return (
    <div className={styles.shippingContainer}>
      <h3 className={styles.title}>Contact & Shipping Information</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Contact Information */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionHeader}>Contact Information</h4>
          <div className={styles.gridTwoColumns}>
            <div className={styles.fieldWrapper}>
              <label htmlFor='firstName' className={styles.fieldLabel}>
                First Name *
              </label>
              <input
                type='text'
                id='firstName'
                name='firstName'
                value={formData.firstName}
                onChange={handleInputChange}
                className={getFieldClasses('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && <p className={styles.fieldError}>{errors.firstName}</p>}
            </div>

            <div className={styles.fieldWrapper}>
              <label htmlFor='lastName' className={styles.fieldLabel}>
                Last Name *
              </label>
              <input
                type='text'
                id='lastName'
                name='lastName'
                value={formData.lastName}
                onChange={handleInputChange}
                className={getFieldClasses('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && <p className={styles.fieldError}>{errors.lastName}</p>}
            </div>

            <div className={styles.fieldWrapper}>
              <label htmlFor='email' className={styles.fieldLabel}>
                Email Address *
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                className={getFieldClasses('email')}
                disabled={isLoading}
              />
              {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
            </div>

            <div className={styles.fieldWrapper}>
              <label htmlFor='phone' className={styles.fieldLabel}>
                Phone Number
              </label>
              <input
                type='tel'
                id='phone'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                className={getFieldClasses('phone')}
                disabled={isLoading}
              />
              {errors.phone && <p className={styles.fieldError}>{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionHeader}>Shipping Address</h4>
          <div className={styles.formSection}>
            <div className={styles.fieldWrapper}>
              <label htmlFor='company' className={styles.fieldLabel}>
                Company (Optional)
              </label>
              <input
                type='text'
                id='company'
                name='company'
                value={formData.company}
                onChange={handleInputChange}
                className={getFieldClasses('company')}
                disabled={isLoading}
              />
            </div>

            <div className={styles.fieldWrapper}>
              <label htmlFor='addressLine1' className={styles.fieldLabel}>
                Address Line 1 *
              </label>
              <input
                type='text'
                id='addressLine1'
                name='addressLine1'
                value={formData.addressLine1}
                onChange={handleInputChange}
                className={getFieldClasses('addressLine1')}
                disabled={isLoading}
              />
              {errors.addressLine1 && <p className={styles.fieldError}>{errors.addressLine1}</p>}
            </div>

            <div className={styles.fieldWrapper}>
              <label htmlFor='addressLine2' className={styles.fieldLabel}>
                Address Line 2 (Optional)
              </label>
              <input
                type='text'
                id='addressLine2'
                name='addressLine2'
                value={formData.addressLine2}
                onChange={handleInputChange}
                className={getFieldClasses('addressLine2')}
                disabled={isLoading}
              />
            </div>

            <div className={styles.gridThreeColumns}>
              <div className={styles.fieldWrapper}>
                <label htmlFor='city' className={styles.fieldLabel}>
                  City *
                </label>
                <input
                  type='text'
                  id='city'
                  name='city'
                  value={formData.city}
                  onChange={handleInputChange}
                  className={getFieldClasses('city')}
                  disabled={isLoading}
                />
                {errors.city && <p className={styles.fieldError}>{errors.city}</p>}
              </div>

              <div className={styles.fieldWrapper}>
                <label htmlFor='state' className={styles.fieldLabel}>
                  State *
                </label>
                <select
                  id='state'
                  name='state'
                  value={formData.state}
                  onChange={handleInputChange}
                  className={getFieldClasses('state', true)}
                  disabled={isLoading}
                >
                  <option value=''>Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {errors.state && <p className={styles.fieldError}>{errors.state}</p>}
              </div>

              <div className={styles.fieldWrapper}>
                <label htmlFor='zipCode' className={styles.fieldLabel}>
                  ZIP Code *
                </label>
                <input
                  type='text'
                  id='zipCode'
                  name='zipCode'
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className={getFieldClasses('zipCode')}
                  disabled={isLoading}
                />
                {errors.zipCode && <p className={styles.fieldError}>{errors.zipCode}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className={styles.optionsSection}>
          <div className={styles.checkboxWrapper}>
            <input
              id='subscribeToNewsletter'
              name='subscribeToNewsletter'
              type='checkbox'
              checked={formData.subscribeToNewsletter}
              onChange={handleInputChange}
              className={styles.checkbox}
              disabled={isLoading}
            />
            <label htmlFor='subscribeToNewsletter' className={styles.checkboxLabel}>
              Subscribe to our newsletter for product updates and cooling technology insights
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isLoading}
          className={`${styles.submitButton} ${
            isLoading ? styles.submitButtonDisabled : styles.submitButtonEnabled
          }`}
        >
          {isLoading ? (
            <div className={styles.submitButtonContent}>
              <svg
                className={styles.loadingSpinner}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className={styles.spinnerCircle}
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className={styles.spinnerPath}
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
