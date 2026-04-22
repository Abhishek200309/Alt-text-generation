import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export async function POST(req: Request) {
  try {
    const { image } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    console.log('[v0] API Key exists:', !!apiKey)
    console.log('[v0] API Key length:', apiKey?.length)
    console.log('[v0] API Key prefix:', apiKey?.substring(0, 7))

    if (!apiKey) {
      return Response.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    if (!apiKey.startsWith('sk-')) {
      return Response.json(
        { error: 'Invalid API key format - OpenAI keys should start with "sk-"' },
        { status: 500 }
      )
    }

    const openai = createOpenAI({
      apiKey: apiKey,
    })

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate a concise but descriptive alt text for this image. The alt text should:
- Be 1-2 sentences maximum
- Describe the main subject and any important details
- Be written for screen reader users
- Not start with "Image of" or "Picture of"
- Be objective and factual

Return only the alt text, nothing else.`,
            },
            {
              type: 'image',
              image,
            },
          ],
        },
      ],
    })

    return Response.json({
      altText: result.text.trim(),
    })
  } catch (error) {
    console.error('[v0] Alt text generation error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate alt text' },
      { status: 500 }
    )
  }
}
