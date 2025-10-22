'use client'

import React from 'react'
import Link from 'next/link'
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { COMPANY_INFO, SOCIAL_MEDIA } from '@/constants'

// ============================================================================
// FOOTER DATA
// ============================================================================

interface SocialLink {
  platform: string
  href: string
  icon: string
}

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
    <footer className='bg-secondary-50 text-secondary-600 border-t border-secondary-200'>
      {/* Main Footer Content - Compact */}
      <div className='container-max py-6'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4 text-sm'>
          {/* Contact Information - Minimal */}
          <div className='flex items-center gap-6'>
            <Link
              href={`mailto:${COMPANY_INFO.EMAIL}`}
              className='flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors'
            >
              <EnvelopeIcon style={{ width: '16px', height: '16px' }} />
              <span>{COMPANY_INFO.EMAIL}</span>
            </Link>
            <Link
              href={`tel:${COMPANY_INFO.PHONE}`}
              className='flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors'
            >
              <PhoneIcon style={{ width: '16px', height: '16px' }} />
              <span>{COMPANY_INFO.PHONE}</span>
            </Link>
          </div>

          {/* Social Links - Minimal */}
          <div className='flex items-center gap-3'>
            {SOCIAL_LINKS.map(social => (
              <Link
                key={social.platform}
                href={social.href}
                target='_blank'
                rel='noopener noreferrer'
                className='text-secondary-600 hover:text-primary-600 transition-colors text-lg'
                title={social.platform}
              >
                {social.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Very Compact */}
      <div className='border-t border-secondary-200 bg-secondary-100/50'>
        <div className='container-max py-3'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-secondary-500'>
            {/* Copyright */}
            <div>
              © {currentYear} {COMPANY_INFO.NAME}. All rights reserved.
            </div>

            {/* Legal Links - Inline */}
            <div className='flex items-center gap-4'>
              <Link href='#privacy' className='hover:text-secondary-700 transition-colors'>
                Privacy Policy
              </Link>
              <Link href='#terms' className='hover:text-secondary-700 transition-colors'>
                Terms of Service
              </Link>
              <Link href='#cookies' className='hover:text-secondary-700 transition-colors'>
                Cookie Policy
              </Link>
              <Link href='#accessibility' className='hover:text-secondary-700 transition-colors'>
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
