import { AltTextGenerator } from '@/components/alt-text-generator'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Alt Text Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            Generate accessible image descriptions using AI. Upload your images
            and get descriptive alt text instantly.
          </p>
        </div>

        {/* Generator */}
        <AltTextGenerator />
      </div>
    </main>
  )
}
