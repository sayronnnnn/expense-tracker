import { useEffect, useRef, useState } from 'react'
import { Send, X, MessageCircle, Minimize2 } from 'lucide-react'
import { apiPost } from '../api/client'
import styles from './FloatingAdvisor.module.css'

interface Message {
  id: string
  role: 'user' | 'advisor'
  content: string
  timestamp: Date
}

export function FloatingAdvisor() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'advisor',
      content: "Hi! I'm your Financial Advisor. Ask me anything about your spending, budgets, or financial goals!",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const data = await apiPost<{ response: string }>('/chat/financial-advice', {
        message: input,
        chat_history: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      })

      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'advisor',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, advisorMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'advisor',
        content: "I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Chat Widget */}
      <div className={`${styles.widget} ${isOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h3>Financial Advisor</h3>
            <p>AI-powered guidance</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.minimizeBtn}
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                setMessages([
                  {
                    id: '0',
                    role: 'advisor',
                    content: "Hi! I'm your Financial Advisor. Ask me anything about your spending, budgets, or financial goals!",
                    timestamp: new Date()
                  }
                ])
              }}
              className={styles.closeBtn}
              title="Clear chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageWrapper} ${
                message.role === 'user' ? styles.userMessage : styles.advisorMessage
              }`}
            >
              <div className={styles.messageBubble}>{message.content}</div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.messageWrapper} ${styles.advisorMessage}`}>
              <div className={styles.messageBubble}>
                <div className={styles.loadingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={styles.sendBtn}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.floatingButton} ${isOpen ? styles.hidden : ''}`}
        title="Open Financial Advisor"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  )
}
