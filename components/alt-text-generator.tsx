'use client'

import { useState, useCallback } from 'react'
import { Upload, Copy, Check, Loader2, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface GeneratedResult {
  id: string
  imageUrl: string
  altText: string
  fileName: string
}

export function AltTextGenerator() {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate alt text')
      }

      setResults((prev) => [
        {
          id: crypto.randomUUID(),
          imageUrl: base64,
          altText: data.altText,
          fileName: file.name,
        },
        ...prev,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processImage(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
    e.target.value = ''
  }

  const copyToClipboard = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={handleDrop}
      >
        <CardContent className="py-12">
          <label className="flex flex-col items-center justify-center gap-4 cursor-pointer">
            <div
              className={`rounded-full p-4 transition-colors ${
                isDragging ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">
                {isLoading
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
              disabled={isLoading}
            />
          </label>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Generated Alt Text
          </h2>
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={result.imageUrl}
                      alt={result.altText}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {result.fileName}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 -mt-1 -mr-2"
                        onClick={() =>
                          setResults((prev) =>
                            prev.filter((r) => r.id !== result.id)
                          )
                        }
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

      {results.length === 0 && !isLoading && (
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
