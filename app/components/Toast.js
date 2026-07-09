'use client'
import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const icons = {
    success: '✅',
    error: '❌',
    coin: '🪙',
    diamond: '💎',
    info: 'ℹ️',
    warning: '⚠️',
  }

  const colors = {
    success: { bg: '#0d2818', border: '#2ea04344', text: '#3fb950' },
    error: { bg: '#2a0a00', border: '#f7816644', text: '#f78166' },
    coin: { bg: '#1a1000', border: '#f0c00044', text: '#f0c000' },
    diamond: { bg: '#001a1a', border: '#22d3ee44', text: '#22d3ee' },
    info: { bg: '#0a1628', border: '#58a6ff44', text: '#58a6ff' },
    warning: { bg: '#1a1000', border: '#f0c00044', text: '#f0c000' },
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        width: '100%',
      }}>
        {toasts.map(toast => {
          const color = colors[toast.type] || colors.success
          const icon = icons[toast.type] || '✅'
          return (
            <div key={toast.id}
              style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'slideIn 0.3s ease',
                cursor: 'pointer',
              }}
              onClick={() => removeToast(toast.id)}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
              <span style={{ color: color.text, fontSize: '13px', fontWeight: '600', flex: 1, lineHeight: '1.4' }}>
                {toast.message}
              </span>
              <button onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: '14px', padding: 0, flexShrink: 0 }}>
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}