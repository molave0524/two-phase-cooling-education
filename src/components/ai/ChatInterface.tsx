'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/types/ai'
import { MessageBubble } from './MessageBubble'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import styles from './ChatInterface.module.css'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  placeholder?: string
  className?: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  placeholder = 'Type your message...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isLoading) return

    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDots}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} className={styles.messagesEnd} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            ref={inputRef}
            type='text'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={styles.input}
          />
          <button
            type='submit'
            disabled={!inputValue.trim() || isLoading}
            className={styles.sendButton}
            aria-label='Send message'
          >
            <PaperAirplaneIcon />
          </button>
        </form>
      </div>
    </div>
  )
}
