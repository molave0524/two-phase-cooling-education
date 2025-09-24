import React from 'react'
import { ProductSpecifications as SpecType } from '@/types/product'
import {
  CpuChipIcon,
  BoltIcon,
  GlobeAltIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

interface ProductSpecificationsProps {
  specifications: SpecType
}

export default function ProductSpecifications({ specifications }: ProductSpecificationsProps) {
  const specSections = [
    {
      title: 'Cooling Performance',
      icon: CpuChipIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      specs: [
        { label: 'Cooling Capacity', value: specifications.cooling.capacity },
        { label: 'Heat Transfer Efficiency', value: specifications.cooling.efficiency },
        {
          label: 'Operating Temperature Range',
          value: `${specifications.cooling.operatingRange.min}°C to ${specifications.cooling.operatingRange.max}°C`,
        },
        {
          label: 'Optimal Temperature',
          value: `${specifications.cooling.operatingRange.optimal}°C`,
        },
        { label: 'Cooling Fluid', value: specifications.cooling.fluidType },
        { label: 'Fluid Volume', value: specifications.cooling.fluidVolume },
      ],
    },
    {
      title: 'System Compatibility',
      icon: CogIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      specs: [
        { label: 'CPU Socket Support', value: specifications.compatibility.cpuSockets.join(', ') },
        { label: 'GPU Compatibility', value: specifications.compatibility.gpuSupport.join(', ') },
        { label: 'Case Compatibility', value: specifications.compatibility.caseCompatibility },
        { label: 'Motherboard Support', value: specifications.compatibility.motherboardClearance },
      ],
    },
    {
      title: 'Performance Metrics',
      icon: BoltIcon,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
      specs: [
        { label: 'Noise Level', value: specifications.performance.noiseLevel },
        { label: 'Pump Speed', value: specifications.performance.pumpSpeed },
        { label: 'Fan Speed', value: specifications.performance.fanSpeed || 'Fanless design' },
        { label: 'Thermal Resistance', value: specifications.performance.thermalResistance },
      ],
    },
    {
      title: 'Physical Dimensions',
      icon: WrenchScrewdriverIcon,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      specs: [
        {
          label: 'Length',
          value: `${specifications.dimensions.length} ${specifications.dimensions.unit}`,
        },
        {
          label: 'Width',
          value: `${specifications.dimensions.width} ${specifications.dimensions.unit}`,
        },
        {
          label: 'Height',
          value: `${specifications.dimensions.height} ${specifications.dimensions.unit}`,
        },
        {
          label: 'Weight',
          value: `${specifications.dimensions.weight} ${specifications.dimensions.weightUnit}`,
        },
      ],
    },
    {
      title: 'Environmental Impact',
      icon: GlobeAltIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      specs: [
        {
          label: 'Global Warming Potential (GWP)',
          value: `${specifications.environmental.gwp} (Ultra-low)`,
        },
        {
          label: 'Ozone Depletion Potential (ODP)',
          value: `${specifications.environmental.odp} (Ozone-safe)`,
        },
        {
          label: 'Recyclability',
          value: specifications.environmental.recyclable
            ? 'Fully recyclable'
            : 'Partially recyclable',
        },
        { label: 'Energy Efficiency Rating', value: specifications.environmental.energyEfficiency },
      ],
    },
    {
      title: 'Construction Materials',
      icon: WrenchScrewdriverIcon,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      specs: [
        { label: 'Case Construction', value: specifications.materials.caseConstruction },
        { label: 'Tubing Material', value: specifications.materials.tubingMaterial },
        { label: 'Pump Construction', value: specifications.materials.pumpMaterial },
      ],
    },
    {
      title: 'Warranty & Support',
      icon: ShieldCheckIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      specs: [
        { label: 'Warranty Duration', value: specifications.warranty.duration },
        { label: 'Warranty Coverage', value: specifications.warranty.coverage },
        { label: 'Technical Support', value: specifications.warranty.support },
      ],
    },
  ]

  return (
    <section>
      <div className='mb-8'>
        <h2 className='text-3xl font-bold text-secondary-900 mb-4'>Technical Specifications</h2>
        <p className='text-lg text-secondary-600'>
          Detailed technical information about performance, compatibility, and construction.
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-2'>
        {specSections.map((section, index) => (
          <div
            key={index}
            className='bg-white rounded-equipment border border-secondary-200 overflow-hidden'
          >
            {/* Section Header */}
            <div className={`${section.bgColor} px-6 py-4 border-b border-secondary-200`}>
              <div className='flex items-center gap-3'>
                <div className={`${section.color} p-2 rounded-lg bg-white/50`}>
                  <section.icon className='w-6 h-6' />
                </div>
                <h3 className={`text-xl font-semibold ${section.color}`}>{section.title}</h3>
              </div>
            </div>

            {/* Specifications List */}
            <div className='px-6 py-4'>
              <dl className='space-y-3'>
                {section.specs.map((spec, specIndex) => (
                  <div
                    key={specIndex}
                    className='flex flex-col sm:flex-row sm:justify-between gap-2'
                  >
                    <dt className='text-sm font-medium text-secondary-700 flex-shrink-0 sm:w-1/2'>
                      {spec.label}
                    </dt>
                    <dd className='text-sm text-secondary-900 font-mono bg-secondary-50 px-2 py-1 rounded'>
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>

      {/* Key Highlights */}
      <div className='mt-12 p-6 bg-gradient-to-r from-primary-50 to-success-50 rounded-equipment border border-primary-200'>
        <h3 className='text-2xl font-bold text-secondary-900 mb-4'>Performance Highlights</h3>
        <div className='grid md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-primary-600 mb-1'>
              {specifications.cooling.efficiency}
            </div>
            <p className='text-sm text-secondary-600'>Heat Transfer Efficiency</p>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-success-600 mb-1'>
              GWP: {specifications.environmental.gwp}
            </div>
            <p className='text-sm text-secondary-600'>Ultra-Low Environmental Impact</p>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-accent-600 mb-1'>
              {specifications.performance.noiseLevel}
            </div>
            <p className='text-sm text-secondary-600'>Whisper-Quiet Operation</p>
          </div>
        </div>
      </div>
    </section>
  )
}
