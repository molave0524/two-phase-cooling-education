'use client'

import React, { useState, useEffect } from 'react'
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UserCircleIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon as RobotIcon } from '@heroicons/react/24/solid'
import styles from './AIAssistantPreview.module.css'

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
    icon: <CpuChipIcon />,
    title: 'Hardware Compatibility',
    description: 'Analyzes your components for optimal cooling configuration',
    examples: [
      'Component thermal requirements',
      'Case compatibility checking',
      'Performance bottleneck identification',
    ],
  },
  {
    icon: <SparklesIcon />,
    title: 'Performance Optimization',
    description: 'Provides data-driven recommendations for maximum efficiency',
    examples: [
      'Thermal performance predictions',
      'Overclocking safety margins',
      'Power consumption optimization',
    ],
  },
  {
    icon: <QuestionMarkCircleIcon />,
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
  const [, setSelectedCapability] = useState<number>(0)
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
    <div className={styles.aiSection}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Section Header */}
          <div className={styles.header}>
            <div className={styles.titleWrapper}>
              <ChatBubbleLeftRightIcon className={styles.titleIcon} />
              <h2 id='ai-assistant-heading' className={styles.title}>
                AI Assistant
              </h2>
            </div>
          </div>

          <div className={styles.mainGrid}>
            {/* Interactive Chat Demo */}
            <div className={styles.chatDemo}>
              <div className={styles.chatContainer}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderContent}>
                    <div className={styles.chatHeaderLeft}>
                      <div className={styles.chatAvatar}>
                        <RobotIcon className={styles.chatAvatarIcon} />
                      </div>
                      <div className={styles.chatHeaderInfo}>
                        <h3>Thermal AI Assistant</h3>
                        <div className={styles.chatStatus}>Online • Ready to help</div>
                      </div>
                    </div>
                    <div className={styles.chatControls}>
                      <button onClick={pauseDemo} className={styles.chatControlButton}>
                        Pause
                      </button>
                      <button onClick={resetDemo} className={styles.chatControlButton}>
                        Restart
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className={styles.chatMessages}>
                  {displayedMessages.map(message => (
                    <div
                      key={message.id}
                      className={`${styles.messageWrapper} ${
                        message.sender === 'user' ? styles.messageWrapperUser : ''
                      }`}
                    >
                      {message.sender === 'assistant' && (
                        <div className={`${styles.messageAvatar} ${styles.messageAvatarAssistant}`}>
                          <RobotIcon className={styles.messageAvatarIcon} />
                        </div>
                      )}

                      <div
                        className={`${styles.messageContent} ${
                          message.sender === 'user'
                            ? styles.messageContentUser
                            : styles.messageContentAssistant
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.sender === 'user' && (
                        <div className={`${styles.messageAvatar} ${styles.messageAvatarUser}`}>
                          <UserCircleIcon className={styles.messageAvatarIcon} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className={styles.typingIndicator}>
                      <div className={`${styles.messageAvatar} ${styles.messageAvatarAssistant}`}>
                        <RobotIcon className={styles.messageAvatarIcon} />
                      </div>
                      <div className={styles.typingContent}>
                        <div className={styles.typingDots}>
                          <div className={styles.typingDot} />
                          <div className={styles.typingDot} />
                          <div className={styles.typingDot} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className={styles.chatInput}>
                  <div className={styles.inputWrapper}>
                    <input
                      type='text'
                      placeholder='Ask about two-phase cooling technology...'
                      className={styles.inputField}
                      disabled
                    />
                    <button className={styles.inputButton} disabled>
                      <ArrowRightIcon className={styles.inputButtonIcon} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className={styles.suggestedQuestions}>
                <h4 className={styles.suggestedTitle}>Try asking:</h4>
                <div className={styles.questionsList}>
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button key={index} className={styles.questionButton}>
                      &ldquo;{question}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistantPreview
