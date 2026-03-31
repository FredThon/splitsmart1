'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, Loader2, CheckCircle, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ParsedReceiptData } from '@/types'
import { formatCurrency, getCategoryIcon } from '@/lib/utils'

interface ReceiptScannerProps {
  onParsed: (data: ParsedReceiptData) => void
}

export function ReceiptScanner({ onParsed }: ReceiptScannerProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsed, setParsed] = useState<ParsedReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'idle' | 'preview' | 'processing' | 'done'>('idle')

  const processReceipt = useCallback(async (file: File) => {
    setIsProcessing(true)
    setStep('processing')
    setError(null)

    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/ai/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      if (!res.ok) throw new Error('Failed to parse receipt')
      const data = await res.json()

      setParsed(data)
      setStep('done')
      onParsed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse receipt')
      setStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }, [onParsed])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreview(url)
    setStep('preview')
    processReceipt(file)
  }, [processReceipt])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const reset = () => {
    setPreview(null)
    setParsed(null)
    setError(null)
    setStep('idle')
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${isDragActive
                ? 'border-brand-400 bg-brand-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/3'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-medium">Snap or upload a receipt</p>
                <p className="text-white/30 text-sm mt-1">
                  AI will extract items, prices, tax & category
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/20">
                <span>JPG, PNG, HEIC</span>
                <span>·</span>
                <span>Max 10MB</span>
              </div>
            </div>
            {isDragActive && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-500/5">
                <div className="flex items-center gap-2 text-brand-400">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Drop to scan</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-white/10 rounded-2xl p-8 text-center bg-white/3"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin absolute -top-1 -right-1" />
              </div>
              <div>
                <p className="text-white font-medium">AI is reading your receipt...</p>
                <p className="text-white/30 text-sm mt-1">Extracting items, prices & category</p>
              </div>
              <div className="flex items-center gap-1.5">
                {['Scanning', 'Parsing', 'Categorizing'].map((label, i) => (
                  <div
                    key={label}
                    className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'done' && parsed && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-brand-500/20 bg-brand-500/5 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold text-white">Receipt Parsed</span>
                <span className="text-xs text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-full">
                  {Math.round(parsed.confidence * 100)}% confidence
                </span>
              </div>
              <button onClick={reset} className="text-white/20 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant + category */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div>
                <p className="text-white font-semibold">{parsed.merchant}</p>
                <p className="text-xs text-white/30">{new Date(parsed.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(parsed.suggestedCategory)}</span>
                <span className="text-xs text-white/40 capitalize">{parsed.suggestedCategory.toLowerCase()}</span>
              </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-1.5 max-h-52 overflow-y-auto">
              {parsed.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/70 flex-1 truncate">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-white/30 text-xs mx-2">×{item.quantity}</span>
                  )}
                  <span className="text-white font-medium ml-2">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-4 border-t border-white/5 space-y-1">
              {parsed.tax > 0 && (
                <div className="flex justify-between text-xs text-white/40">
                  <span>Tax</span>
                  <span>{formatCurrency(parsed.tax)}</span>
                </div>
              )}
              {parsed.tip > 0 && (
                <div className="flex justify-between text-xs text-white/40">
                  <span>Tip</span>
                  <span>{formatCurrency(parsed.tip)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Total</span>
                <span className="text-brand-400">{formatCurrency(parsed.total)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
  })
}
