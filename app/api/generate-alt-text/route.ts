import { generateText } from 'ai'

export async function POST(req: Request) {
  const { image } = await req.json()

  const result = await generateText({
    model: 'openai/gpt-5-mini',
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
}
