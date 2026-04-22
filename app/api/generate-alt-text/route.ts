import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export async function POST(req: Request) {
  try {
    const { image } = await req.json()

    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = createOpenAI({ apiKey })

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a concise, descriptive alt text for this image. The alt text should be 1-2 sentences that describe the main subject and important details. Do not start with "Image of" or "Picture of". Just provide the alt text directly.',
            },
            {
              type: 'image',
              image: image,
            },
          ],
        },
      ],
    })

    return Response.json({ altText: result.text.trim() })
  } catch (error) {
    console.error('Alt text error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate alt text'
    return Response.json({ error: message }, { status: 500 })
  }
}
