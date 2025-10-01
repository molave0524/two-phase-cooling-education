'use client'

import React, { useState } from 'react'
import { AIAssistant } from './AIAssistant'

/**
 * Floating AI Chat Button
 *
 * Provides a persistent floating button that opens the AI chatbot overlay.
 * Always accessible from any page.
 */
export const FloatingAIButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return <AIAssistant isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} context={{}} />
}
