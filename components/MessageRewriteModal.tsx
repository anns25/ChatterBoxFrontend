'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { themeClasses, themeStyles, componentStyles } from '../utils/theme'

interface MessageRewriteModalProps {
  isOpen: boolean
  onClose: () => void
  originalMessage: string
  onApply: (rewrittenMessage: string) => void
}

const REWRITE_CATEGORIES = {
  'Tone Adjustments': {
    'Professional': ['professional', 'formal', 'business-professional', 'neutral', 'technical'],
    'Friendly': ['casual', 'warm-friendly', 'cheerful', 'supportive', 'empathetic', 'positive'],
    'Strong': ['assertive', 'direct', 'confident', 'persuasive', 'motivational'],
    'Softened': ['polite', 'less-direct', 'diplomatic', 'apologetic'],
  },
  'Emotion-Based': {
    'More': ['more-empathetic', 'more-enthusiastic', 'more-excited', 'more-calm', 'more-serious', 'more-humorous', 'more-sarcastic', 'more-dramatic', 'more-romantic', 'more-grateful'],
    'Less': ['less-emotional'],
  },
  'Grammar & Writing': {
    'Improvements': ['fix-grammar', 'fix-spelling', 'improve-structure', 'improve-readability', 'improve-flow', 'more-coherent', 'more-concise', 'rewrite-clarity', 'more-natural', 'more-human'],
  },
  'Length-Based': {
    'Shorter': ['shorter', 'very-short', 'sms-style'],
    'Longer': ['longer', 'more-detailed'],
    'Formats': ['summary', 'one-line', 'bullet-points'],
  },
  'Creative': {
    'Styles': ['more-witty', 'more-humorous', 'poetic', 'story-like', 'emoji-enhanced', 'gen-z-slang', 'formal-english', 'simplified-kids'],
  },
}

const REWRITE_LABELS: Record<string, string> = {
  'professional': 'Professional',
  'formal': 'Formal',
  'business-professional': 'Business-Professional',
  'neutral': 'Neutral / Objective',
  'technical': 'Technical',
  'casual': 'Casual',
  'warm-friendly': 'Warm & Friendly',
  'cheerful': 'Cheerful',
  'supportive': 'Supportive / Encouraging',
  'empathetic': 'Empathetic',
  'positive': 'Positive / Uplifting',
  'assertive': 'Assertive',
  'direct': 'Direct',
  'confident': 'Confident',
  'persuasive': 'Persuasive',
  'motivational': 'Motivational',
  'polite': 'Politer',
  'less-direct': 'Less Direct',
  'diplomatic': 'Diplomatic',
  'apologetic': 'Apologetic',
  'more-empathetic': 'More Empathetic',
  'more-enthusiastic': 'More Enthusiastic',
  'more-excited': 'More Excited',
  'more-calm': 'More Calm',
  'more-serious': 'More Serious',
  'more-humorous': 'More Humorous',
  'more-sarcastic': 'More Sarcastic',
  'more-dramatic': 'More Dramatic',
  'more-romantic': 'More Romantic',
  'more-grateful': 'More Grateful',
  'less-emotional': 'Less Emotional / More Neutral',
  'fix-grammar': 'Fix Grammar',
  'fix-spelling': 'Fix Spelling & Punctuation',
  'improve-structure': 'Improve Sentence Structure',
  'improve-readability': 'Improve Readability',
  'improve-flow': 'Improve Flow',
  'more-coherent': 'Make More Coherent',
  'more-concise': 'Make More Concise',
  'rewrite-clarity': 'Rewrite for Clarity',
  'more-natural': 'More Natural Sounding',
  'more-human': 'More Human & Conversational',
  'shorter': 'Shorter',
  'very-short': 'Very Short',
  'sms-style': 'SMS Style',
  'longer': 'Longer',
  'more-detailed': 'More Detailed',
  'summary': 'Summary Version',
  'one-line': 'One-Line Version',
  'bullet-points': 'Bullet-Point Version',
  'more-witty': 'More Witty',
  'poetic': 'Poetic Version',
  'story-like': 'Story-Like Version',
  'emoji-enhanced': 'Emoji-Enhanced Version',
  'gen-z-slang': 'Gen Z Slang Version',
  'formal-english': 'Older/Formal English Style',
  'simplified-kids': 'Simplified for Kids',
}

export default function MessageRewriteModal({
  isOpen,
  onClose,
  originalMessage,
  onApply,
}: MessageRewriteModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [rewrittenMessage, setRewrittenMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleRewrite = async () => {
    if (!selectedType) return

    setIsLoading(true)
    setError('')
    setRewrittenMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:5000/api/ai/rewrite',
        {
          message: originalMessage,
          rewriteType: selectedType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setRewrittenMessage(response.data.rewritten)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to rewrite message')
      } else {
        setError('Failed to rewrite message')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (rewrittenMessage) {
      onApply(rewrittenMessage)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${themeClasses.bgSecondary} ${themeClasses.borderPrimary} border`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>✨ Rewrite Message</h2>
          <button
            onClick={onClose}
            className={themeClasses.textSecondary}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className={`text-sm mb-2 ${themeClasses.textSecondary}`}>Original:</p>
          <div className={`p-3 rounded-lg ${themeClasses.bgPrimary}`}>
            <p className={`text-sm ${themeClasses.textPrimary}`}>{originalMessage}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className={`text-sm font-medium mb-3 ${themeClasses.textPrimary}`}>Choose a rewrite style:</p>
          <div className="space-y-4">
            {Object.entries(REWRITE_CATEGORIES).map(([category, subcategories]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 mb-2">{category}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(subcategories).flatMap(([subcat, types]) =>
                    types.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-2 text-xs rounded-lg border transition ${
                          selectedType === type
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {REWRITE_LABELS[type] || type}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className={`mb-4 p-3 border rounded-lg text-sm ${themeClasses.borderPrimary} ${themeClasses.textPrimary}`} style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>
            {error}
          </div>
        )}

        {rewrittenMessage && (
          <div className="mb-4">
            <p className={`text-sm mb-2 ${themeClasses.textSecondary}`}>Rewritten:</p>
            <div className={`p-3 rounded-lg border ${themeClasses.borderAccent}`} style={{ backgroundColor: '#2FB8A8', opacity: 0.1 }}>
              <p className={`text-sm ${themeClasses.textPrimary}`}>{rewrittenMessage}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleRewrite}
            disabled={!selectedType || isLoading}
            className={`px-4 py-2 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.btnPrimary}`}
          >
            {isLoading ? 'Rewriting...' : 'Rewrite'}
          </button>
          {rewrittenMessage && (
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg transition font-medium text-white" style={{ backgroundColor: '#10B981' }}
            >
              Apply
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition font-medium ${themeClasses.btnSecondary}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}