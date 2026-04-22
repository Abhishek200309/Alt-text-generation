'use client'

import { useState, useCallback } from 'react'
import { Upload, ImageIcon, Copy, Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GeneratedResult {
  id: string
  imageUrl: string
  altText: string
  fileName: string
}

export function AltTextGenerator() {
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<GeneratedResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const base64 = await fileToBase64(file)

      const response = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate alt text')
      }

      const data = await response.json()

      const newResult: GeneratedResult = {
        id: crypto.randomUUID(),
        imageUrl: URL.createObjectURL(file),
        altText: data.altText,
        fileName: file.name,
      }

      setResults((prev) => [newResult, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
      e.target.value = ''
    },
    []
  )

  const copyToClipboard = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const removeResult = (id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-12">
          <label className="flex flex-col items-center justify-center gap-4 cursor-pointer">
            <div
              className={cn(
                'rounded-full p-4 transition-colors',
                isDragging ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">
                {isGenerating
                  ? 'Analyzing image...'
                  : 'Drop an image here or click to upload'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, GIF, or WebP
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="sr-only"
              disabled={isGenerating}
            />
          </label>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Generated Alt Text
          </h2>
          {results.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {/* Image Preview */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={result.imageUrl}
                        alt={result.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {result.fileName}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 -mt-1 -mr-2 h-8 w-8"
                        onClick={() => removeResult(result.id)}
                      >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {result.altText}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => copyToClipboard(result.id, result.altText)}
                    >
                      {copiedId === result.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy alt text
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isGenerating && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Upload an image to generate accessible alt text
          </p>
        </div>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
