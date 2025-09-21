'use client'

import React from 'react'
import Link from 'next/link'
import {
  BeakerIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  PlayCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

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

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Learn',
    links: [
      {
        label: 'Video Demonstrations',
        href: '#demonstrations',
        icon: <PlayCircleIcon className="w-4 h-4" />,
        description: 'Watch two-phase cooling in action'
      },
      {
        label: 'Technology Overview',
        href: '#technology',
        icon: <BeakerIcon className="w-4 h-4" />,
        description: 'Understand the science'
      },
      {
        label: 'Performance Data',
        href: '#performance',
        description: 'Real-world testing results'
      },
      {
        label: 'Educational Resources',
        href: '/education',
        icon: <BookOpenIcon className="w-4 h-4" />,
        description: 'Courses and guides'
      }
    ]
  },
  {
    title: 'Products & Services',
    links: [
      {
        label: 'Computer Cases',
        href: '#products',
        icon: <ShoppingBagIcon className="w-4 h-4" />
      },
      {
        label: 'Educational Kits',
        href: '/products/education'
      },
      {
        label: 'AI Assistant',
        href: '#ai-assistant',
        icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />
      },
      {
        label: 'Technical Support',
        href: '/support'
      },
      {
        label: 'Installation Guide',
        href: '/installation'
      }
    ]
  },
  {
    title: 'Company',
    links: [
      {
        label: 'About Us',
        href: '/about'
      },
      {
        label: 'Research & Development',
        href: '/research'
      },
      {
        label: 'Sustainability',
        href: '/sustainability'
      },
      {
        label: 'Careers',
        href: '/careers'
      },
      {
        label: 'Press & Media',
        href: '/press'
      }
    ]
  },
  {
    title: 'Support',
    links: [
      {
        label: 'Contact Us',
        href: '/contact',
        icon: <EnvelopeIcon className="w-4 h-4" />
      },
      {
        label: 'Help Center',
        href: '/help'
      },
      {
        label: 'Documentation',
        href: '/docs',
        icon: <ArrowTopRightOnSquareIcon className="w-4 h-4" />,
        external: true
      },
      {
        label: 'Community Forum',
        href: '/community',
        external: true
      },
      {
        label: 'Warranty',
        href: '/warranty'
      }
    ]
  }
]

const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'YouTube',
    href: 'https://youtube.com/thermaledcenter',
    icon: '📺'
  },
  {
    platform: 'Twitter',
    href: 'https://twitter.com/thermaledcenter',
    icon: '🐦'
  },
  {
    platform: 'LinkedIn',
    href: 'https://linkedin.com/company/thermal-ed-center',
    icon: '💼'
  },
  {
    platform: 'GitHub',
    href: 'https://github.com/thermal-ed-center',
    icon: '💻'
  }
]

const CONTACT_INFO = {
  email: 'info@thermaledcenter.com',
  phone: '+1 (555) 123-4567',
  address: {
    street: '123 Innovation Drive',
    city: 'Tech Valley',
    state: 'CA',
    zip: '94043',
    country: 'USA'
  }
}

const CERTIFICATIONS = [
  { name: 'ISO 14001', description: 'Environmental Management' },
  { name: 'ENERGY STAR', description: 'Energy Efficiency' },
  { name: 'RoHS Compliant', description: 'Hazardous Substances' },
  { name: 'CE Marked', description: 'European Conformity' }
]

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary-900 text-white">
      {/* Main Footer Content */}
      <div className="container-max py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-equipment flex items-center justify-center">
                  <BeakerIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Thermal Ed Center</div>
                  <div className="text-xs text-secondary-400">Two-Phase Cooling Innovation</div>
                </div>
              </Link>

              {/* Mission Statement */}
              <p className="text-sm text-secondary-300 leading-relaxed">
                Advancing thermal management through innovative two-phase cooling technology,
                educational excellence, and environmental responsibility.
              </p>

              {/* Environmental Impact */}
              <div className="bg-secondary-800 rounded-equipment p-4">
                <h4 className="font-semibold text-success-400 mb-2">Environmental Impact</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-medium text-white">GWP 20</div>
                    <div className="text-secondary-400">vs 1400 traditional</div>
                  </div>
                  <div>
                    <div className="font-medium text-white">Zero ODP</div>
                    <div className="text-secondary-400">Ozone safe</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          <div className="lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="font-semibold text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-sm text-secondary-300 hover:text-primary-400 transition-colors"
                        {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                      >
                        {link.icon}
                        <span className="group-hover:underline">{link.label}</span>
                        {link.external && <ArrowTopRightOnSquareIcon className="w-3 h-3" />}
                      </Link>
                      {link.description && (
                        <p className="text-xs text-secondary-500 mt-1 ml-6">
                          {link.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact & Social */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                  <Link
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="text-secondary-300 hover:text-primary-400 transition-colors"
                  >
                    {CONTACT_INFO.email}
                  </Link>
                </div>
                <div className="flex items-start gap-2">
                  <PhoneIcon className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                  <Link
                    href={`tel:${CONTACT_INFO.phone}`}
                    className="text-secondary-300 hover:text-primary-400 transition-colors"
                  >
                    {CONTACT_INFO.phone}
                  </Link>
                </div>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div className="text-secondary-300">
                    <div>{CONTACT_INFO.address.street}</div>
                    <div>
                      {CONTACT_INFO.address.city}, {CONTACT_INFO.address.state} {CONTACT_INFO.address.zip}
                    </div>
                    <div>{CONTACT_INFO.address.country}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Follow Us</h3>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <Link
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-secondary-800 hover:bg-primary-600 rounded-equipment flex items-center justify-center transition-colors group"
                    title={social.platform}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {social.icon}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Stay Updated</h3>
              <Link
                href="#newsletter"
                className="btn-primary btn-sm w-full justify-center"
              >
                Subscribe to Newsletter
              </Link>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-12 pt-8 border-t border-secondary-800">
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-center">Certifications & Compliance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CERTIFICATIONS.map((cert) => (
                <div key={cert.name} className="text-center">
                  <div className="w-16 h-16 bg-secondary-800 rounded-equipment mx-auto mb-2 flex items-center justify-center">
                    <BeakerIcon className="w-8 h-8 text-primary-400" />
                  </div>
                  <div className="text-sm font-medium text-white">{cert.name}</div>
                  <div className="text-xs text-secondary-400">{cert.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-800">
        <div className="container-max py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-secondary-400">
              © {currentYear} Thermal Education Center. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="#privacy"
                className="text-secondary-400 hover:text-primary-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#terms"
                className="text-secondary-400 hover:text-primary-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#cookies"
                className="text-secondary-400 hover:text-primary-400 transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="#accessibility"
                className="text-secondary-400 hover:text-primary-400 transition-colors"
              >
                Accessibility
              </Link>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-secondary-500">
              Built with Next.js • Powered by Two-Phase Innovation
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}