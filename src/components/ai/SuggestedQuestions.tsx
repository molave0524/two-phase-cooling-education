'use client'

import React from 'react'
import { AIContext } from '@/types/ai'
import styles from './SuggestedQuestions.module.css'

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void
  context: AIContext
  className?: string
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onQuestionClick,
  context,
  className = '',
}) => {
  const questions = [
    'What is two-phase cooling?',
    'How does it compare to traditional cooling?',
    'Which cooling system is best for gaming?',
    'What are the environmental benefits?',
  ]

  return (
    <div className={`${styles.container} ${className}`}>
      <p className={styles.title}>Suggested Questions:</p>
      <div className={styles.questionsList}>
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className={styles.questionButton}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
