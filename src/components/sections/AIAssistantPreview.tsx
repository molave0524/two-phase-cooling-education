'use client'

import React, { useState, useEffect } from 'react'
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UserCircleIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon as RobotIcon } from '@heroicons/react/24/solid'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  type?: 'text' | 'suggestion' | 'configuration'
}

// interface ConfigSuggestion {
//   component: string
//   reason: string
//   confidence: number
// }

interface AssistantCapability {
  icon: React.ReactNode
  title: string
  description: string
  examples: string[]
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_CONVERSATION: ChatMessage[] = [
  {
    id: '1',
    content:
      "I'm building a high-end gaming rig with an RTX 4090 and i9-13900K. Will two-phase cooling handle this setup?",
    sender: 'user',
    timestamp: new Date(),
  },
  {
    id: '2',
    content:
      "Absolutely! That's a powerful combination generating up to 850W of heat. Two-phase cooling excels here with 96.5% thermal efficiency. Based on your components, I recommend the Pro case with enhanced circulation. The RTX 4090 will run 40°C cooler than traditional air cooling, and the i9-13900K will maintain boost clocks consistently. Would you like me to help configure the optimal setup?",
    sender: 'assistant',
    timestamp: new Date(),
  },
  {
    id: '3',
    content: 'That sounds perfect! What about noise levels during intensive gaming sessions?',
    sender: 'user',
    timestamp: new Date(),
  },
  {
    id: '4',
    content:
      "Excellent question! Two-phase cooling operates at whisper-quiet 18-21 dB under full load - quieter than most traditional systems at idle. No fans needed for the cooling fluid circulation, just a silent pump. You'll actually hear your mechanical keyboard more than the cooling system. Perfect for streaming or late-night gaming sessions.",
    sender: 'assistant',
    timestamp: new Date(),
  },
]

const ASSISTANT_CAPABILITIES: AssistantCapability[] = [
  {
    icon: <CpuChipIcon className='w-6 h-6' />,
    title: 'Hardware Compatibility',
    description: 'Analyzes your components for optimal cooling configuration',
    examples: [
      'Component thermal requirements',
      'Case compatibility checking',
      'Performance bottleneck identification',
    ],
  },
  {
    icon: <SparklesIcon className='w-6 h-6' />,
    title: 'Performance Optimization',
    description: 'Provides data-driven recommendations for maximum efficiency',
    examples: [
      'Thermal performance predictions',
      'Overclocking safety margins',
      'Power consumption optimization',
    ],
  },
  {
    icon: <QuestionMarkCircleIcon className='w-6 h-6' />,
    title: 'Technical Education',
    description: 'Explains complex thermal concepts in accessible terms',
    examples: [
      'Two-phase physics principles',
      'Environmental impact explanations',
      'Maintenance best practices',
    ],
  },
]

const SUGGESTED_QUESTIONS = [
  'How does two-phase cooling compare to liquid cooling?',
  "What's the environmental impact of your cooling fluid?",
  'Can I upgrade my existing system to two-phase cooling?',
  'How much quieter is two-phase vs traditional cooling?',
]

// ============================================================================
// AI ASSISTANT PREVIEW COMPONENT
// ============================================================================

export const AIAssistantPreview: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([])
  const [selectedCapability, setSelectedCapability] = useState<number>(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // Auto-play conversation demo
  useEffect(() => {
    if (!autoPlay || currentMessageIndex >= SAMPLE_CONVERSATION.length) return

    const timer = setTimeout(
      () => {
        if (SAMPLE_CONVERSATION[currentMessageIndex]?.sender === 'assistant') {
          setIsTyping(true)
          setTimeout(() => {
            const message = SAMPLE_CONVERSATION[currentMessageIndex]
            if (message) {
              setDisplayedMessages(prev => [...prev, message])
            }
            setIsTyping(false)
            setCurrentMessageIndex(prev => prev + 1)
          }, 2000)
        } else {
          const message = SAMPLE_CONVERSATION[currentMessageIndex]
          if (message) {
            setDisplayedMessages(prev => [...prev, message])
          }
          setCurrentMessageIndex(prev => prev + 1)
        }
      },
      currentMessageIndex === 0 ? 1000 : 3000
    )

    return () => clearTimeout(timer)
  }, [currentMessageIndex, autoPlay])

  // Cycle through capabilities
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedCapability(prev => (prev + 1) % ASSISTANT_CAPABILITIES.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const resetDemo = () => {
    setCurrentMessageIndex(0)
    setDisplayedMessages([])
    setIsTyping(false)
    setAutoPlay(true)
  }

  const pauseDemo = () => {
    setAutoPlay(false)
  }

  return (
    <div
      style={{
        backgroundColor: '#e2e8f0',
        paddingTop: '1.5rem',
        paddingBottom: '1rem',
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        borderTop: '12px solid white',
      }}
    >
      <div className='max-w-6xl mx-auto px-6'>
        <div className='space-y-12'>
          {/* Section Header */}
          <div className='text-center space-y-4'>
            <div className='flex items-center justify-center gap-2'>
              <ChatBubbleLeftRightIcon className='w-8 h-8 text-primary-600' />
              <h2
                id='ai-assistant-heading'
                className='section-title text-3xl font-bold text-secondary-900'
              >
                AI Technical Assistant
              </h2>
            </div>
            <p className='text-lg text-secondary-600 max-w-3xl mx-auto'>
              Get instant expert guidance on two-phase cooling technology. Our AI assistant helps
              with technical questions, configuration advice, and educational support.
            </p>
          </div>

          <div className='grid lg:grid-cols-2 gap-12 items-start'>
            {/* Interactive Chat Demo */}
            <div className='space-y-6'>
              <div className='bg-white rounded-equipment shadow-glass border border-secondary-200 overflow-hidden'>
                {/* Chat Header */}
                <div className='bg-gradient-to-r from-primary-500 to-primary-600 p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                        <RobotIcon className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-white'>Thermal AI Assistant</h3>
                        <div className='text-xs text-primary-100'>Online • Ready to help</div>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={pauseDemo}
                        className='px-3 py-1 bg-white/20 text-white text-xs rounded-technical hover:bg-white/30 transition-colors'
                      >
                        Pause
                      </button>
                      <button
                        onClick={resetDemo}
                        className='px-3 py-1 bg-white/20 text-white text-xs rounded-technical hover:bg-white/30 transition-colors'
                      >
                        Restart
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className='h-80 overflow-y-auto p-4 space-y-4 bg-secondary-50'>
                  {displayedMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      {message.sender === 'assistant' && (
                        <div className='w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0'>
                          <RobotIcon className='w-5 h-5 text-white' />
                        </div>
                      )}

                      <div
                        className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-equipment text-sm ${
                          message.sender === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-secondary-900 shadow-sm border border-secondary-200'
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.sender === 'user' && (
                        <div className='w-8 h-8 bg-secondary-400 rounded-full flex items-center justify-center flex-shrink-0'>
                          <UserCircleIcon className='w-5 h-5 text-white' />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className='flex items-start gap-3'>
                      <div className='w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0'>
                        <RobotIcon className='w-5 h-5 text-white' />
                      </div>
                      <div className='bg-white px-4 py-3 rounded-equipment border border-secondary-200'>
                        <div className='flex space-x-1'>
                          <div className='w-2 h-2 bg-secondary-400 rounded-full animate-bounce' />
                          <div className='w-2 h-2 bg-secondary-400 rounded-full animate-bounce animate-bounce-delay-1' />
                          <div className='w-2 h-2 bg-secondary-400 rounded-full animate-bounce animate-bounce-delay-2' />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className='p-4 border-t border-secondary-200 bg-white'>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      placeholder='Ask about two-phase cooling technology...'
                      className='flex-1 input text-sm'
                      disabled
                    />
                    <button className='btn-primary px-4 py-2' disabled>
                      <ArrowRightIcon className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-secondary-900'>Try asking:</h4>
                <div className='grid grid-cols-1 gap-2'>
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      className='text-left p-3 bg-white rounded-technical border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm text-secondary-700'
                    >
                      &ldquo;{question}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Capabilities Overview */}
            <div className='space-y-8'>
              <div className='space-y-6'>
                <h3 className='text-2xl font-bold text-secondary-900'>Assistant Capabilities</h3>

                <div className='space-y-4'>
                  {ASSISTANT_CAPABILITIES.map((capability, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-equipment border-2 transition-all cursor-pointer ${
                        selectedCapability === index
                          ? 'border-primary-300 bg-primary-50 shadow-lg'
                          : 'border-secondary-200 bg-white hover:border-primary-200'
                      }`}
                      onClick={() => setSelectedCapability(index)}
                    >
                      <div className='flex items-start gap-4'>
                        <div
                          className={`p-3 rounded-technical ${
                            selectedCapability === index
                              ? 'bg-primary-600 text-white'
                              : 'bg-secondary-100 text-secondary-600'
                          }`}
                        >
                          {capability.icon}
                        </div>
                        <div className='flex-1 space-y-3'>
                          <div>
                            <h4 className='font-semibold text-secondary-900'>{capability.title}</h4>
                            <p className='text-sm text-secondary-600 mt-1'>
                              {capability.description}
                            </p>
                          </div>

                          <div className='space-y-2'>
                            <div className='text-xs font-medium text-secondary-700'>Examples:</div>
                            <ul className='space-y-1'>
                              {capability.examples.map((example, exampleIndex) => (
                                <li
                                  key={exampleIndex}
                                  className='flex items-center gap-2 text-xs text-secondary-600'
                                >
                                  <CheckCircleIcon className='w-3 h-3 text-success-600' />
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div className='bg-gradient-to-br from-secondary-50 to-primary-50 rounded-equipment p-6'>
                <h4 className='font-semibold text-secondary-900 mb-4 flex items-center gap-2'>
                  <LightBulbIcon className='w-5 h-5 text-accent-600' />
                  Why Our AI Assistant?
                </h4>
                <ul className='space-y-3'>
                  <li className='flex items-start gap-3'>
                    <CheckCircleIcon className='w-5 h-5 text-success-600 mt-0.5 flex-shrink-0' />
                    <div>
                      <div className='font-medium text-secondary-900'>Expert Knowledge Base</div>
                      <div className='text-sm text-secondary-600'>
                        Trained on comprehensive thermal dynamics and cooling system data
                      </div>
                    </div>
                  </li>
                  <li className='flex items-start gap-3'>
                    <CheckCircleIcon className='w-5 h-5 text-success-600 mt-0.5 flex-shrink-0' />
                    <div>
                      <div className='font-medium text-secondary-900'>Real-Time Calculations</div>
                      <div className='text-sm text-secondary-600'>
                        Instant thermal analysis and performance predictions
                      </div>
                    </div>
                  </li>
                  <li className='flex items-start gap-3'>
                    <CheckCircleIcon className='w-5 h-5 text-success-600 mt-0.5 flex-shrink-0' />
                    <div>
                      <div className='font-medium text-secondary-900'>
                        Personalized Recommendations
                      </div>
                      <div className='text-sm text-secondary-600'>
                        Tailored advice based on your specific hardware and use case
                      </div>
                    </div>
                  </li>
                  <li className='flex items-start gap-3'>
                    <CheckCircleIcon className='w-5 h-5 text-success-600 mt-0.5 flex-shrink-0' />
                    <div>
                      <div className='font-medium text-secondary-900'>24/7 Availability</div>
                      <div className='text-sm text-secondary-600'>
                        Always ready to help with technical questions and support
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className='text-center'>
                <button className='btn-primary btn-lg flex items-center gap-2 mx-auto'>
                  <ChatBubbleLeftRightIcon className='w-5 h-5' />
                  Start Conversation
                </button>
                <p className='text-xs text-secondary-500 mt-2'>
                  Free technical consultation • No signup required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistantPreview
