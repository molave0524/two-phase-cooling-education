'use client'

import React from 'react'
import Link from 'next/link'
import {
  BeakerIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { COMPANY_INFO, SOCIAL_MEDIA, TECHNICAL_SPECS } from '@/constants'
import styles from './Footer.module.css'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterLink {
  label: string
  href: string
  icon?: React.ReactNode
  external?: boolean
  description?: string
}

interface SocialLink {
  platform: string
  href: string
  icon: string
}

// ============================================================================
// FOOTER DATA
// ============================================================================

// Navigation links moved to header - keeping footer minimal
const FOOTER_SECTIONS: FooterSection[] = []

const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'YouTube',
    href: `https://youtube.com/${SOCIAL_MEDIA.YOUTUBE}`,
    icon: '📺',
  },
  {
    platform: 'Twitter',
    href: `https://twitter.com/${SOCIAL_MEDIA.TWITTER}`,
    icon: '🐦',
  },
]

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-secondary-900 text-white'>
      {/* Main Footer Content */}
      <div className='container-max py-12'>
        <div className='grid lg:grid-cols-5 gap-8'>
          {/* Company Info */}
          <div className='lg:col-span-1 space-y-6'>
            <div className='space-y-4'>
              {/* Logo */}
              <Link
                href='/'
                className='flex items-center gap-3 hover:opacity-80 transition-opacity'
              >
                <div className={styles.logoContainer}>
                  <BeakerIcon className={styles.logoIcon} />
                </div>
                <div>
                  <div className='font-bold text-lg'>{COMPANY_INFO.NAME}</div>
                  <div className='text-xs text-secondary-400'>Two-Phase Cooling Innovation</div>
                </div>
              </Link>

              {/* Mission Statement */}
              <p className='text-sm text-secondary-300 leading-relaxed'>
                Advancing thermal management through innovative two-phase cooling technology,
                educational excellence, and environmental responsibility.
              </p>

              {/* Environmental Impact */}
              <div className='bg-secondary-800 rounded-equipment p-4'>
                <h4 className='font-semibold text-success-400 mb-2'>Environmental Impact</h4>
                <div className='grid grid-cols-2 gap-3 text-xs'>
                  <div>
                    <div className='font-medium text-white'>GWP {TECHNICAL_SPECS.GWP_RATING}</div>
                    <div className='text-secondary-400'>vs 1400 traditional</div>
                  </div>
                  <div>
                    <div className='font-medium text-white'>Zero ODP</div>
                    <div className='text-secondary-400'>Ozone safe</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          <div className='lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {FOOTER_SECTIONS.map(section => (
              <div key={section.title} className='space-y-4'>
                <h3 className='font-semibold text-white'>{section.title}</h3>
                <ul className='space-y-3'>
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className='group flex items-center gap-2 text-sm text-secondary-300 hover:text-primary-400 transition-colors'
                        {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                      >
                        {link.icon}
                        <span className='group-hover:underline'>{link.label}</span>
                        {link.external && <ArrowTopRightOnSquareIcon className='w-3 h-3' />}
                      </Link>
                      {link.description && (
                        <p className='text-xs text-secondary-500 mt-1 ml-6'>{link.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact & Social */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Contact Information */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-white'>Contact</h3>
              <div className='space-y-3 text-sm'>
                <div className='flex items-start gap-2'>
                  <EnvelopeIcon className={styles.contactIcon} />
                  <Link
                    href={`mailto:${COMPANY_INFO.EMAIL}`}
                    className='text-secondary-300 hover:text-primary-400 transition-colors'
                  >
                    {COMPANY_INFO.EMAIL}
                  </Link>
                </div>
                <div className='flex items-start gap-2'>
                  <PhoneIcon className={styles.contactIcon} />
                  <Link
                    href={`tel:${COMPANY_INFO.PHONE}`}
                    className='text-secondary-300 hover:text-primary-400 transition-colors'
                  >
                    {COMPANY_INFO.PHONE}
                  </Link>
                </div>
                {/* Address section removed for simplicity */}
              </div>
            </div>

            {/* Social Links */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-white'>Follow Us</h3>
              <div className='flex gap-3'>
                {SOCIAL_LINKS.map(social => (
                  <Link
                    key={social.platform}
                    href={social.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.socialContainer}
                    title={social.platform}
                  >
                    <span className='text-lg group-hover:scale-110 transition-transform'>
                      {social.icon}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className='space-y-3'>
              <h3 className='font-semibold text-white'>Stay Updated</h3>
              <Link href='#newsletter' className='btn-primary btn-sm w-full justify-center'>
                Subscribe to Newsletter
              </Link>
            </div>
          </div>
        </div>

        {/* Certifications section removed for simplicity */}
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-secondary-800'>
        <div className='container-max py-6'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            {/* Copyright */}
            <div className='text-sm text-secondary-400'>
              © {currentYear} {COMPANY_INFO.NAME}. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className='flex items-center gap-6 text-sm'>
              <Link
                href='#privacy'
                className='text-secondary-400 hover:text-primary-400 transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                href='#terms'
                className='text-secondary-400 hover:text-primary-400 transition-colors'
              >
                Terms of Service
              </Link>
              <Link
                href='#cookies'
                className='text-secondary-400 hover:text-primary-400 transition-colors'
              >
                Cookie Policy
              </Link>
              <Link
                href='#accessibility'
                className='text-secondary-400 hover:text-primary-400 transition-colors'
              >
                Accessibility
              </Link>
            </div>

            {/* Additional Info */}
            <div className='text-xs text-secondary-500'>
              Built with Next.js • Powered by Two-Phase Innovation
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
