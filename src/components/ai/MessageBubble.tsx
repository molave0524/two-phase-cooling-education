'use client'

import React from 'react'
import { ChatMessage } from '@/types/ai'
import { UserIcon, SparklesIcon } from '@heroicons/react/24/outline'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: ChatMessage
  className?: string
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className = '' }) => {
  const isUser = message.role === 'user'

  return (
    <div
      className={`${styles.messageWrapper} ${isUser ? styles.messageWrapperUser : ''} ${className}`}
    >
      <div className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAssistant}`}>
        {isUser ? <UserIcon /> : <SparklesIcon />}
      </div>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        {message.content}
      </div>
    </div>
  )
}
