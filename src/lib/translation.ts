import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from './env'

export function detectLanguage(text: string): 'ko' | 'en' {
  if (!text) return 'ko'

  // Match ALL Korean characters (not just the first one)
  const koreanRegex = /[가-힣]/g
  const koreanMatches = text.match(koreanRegex)
  const koreanChars = koreanMatches ? koreanMatches.length : 0
  const totalChars = text.replace(/\s/g, '').length

  if (totalChars === 0) return 'ko'

  // If more than 20% of characters are Korean, consider it Korean
  return koreanChars / totalChars > 0.2 ? 'ko' : 'en'
}

export async function translate(text: string, targetLang: 'en' | 'ko', context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    // Use gemini-2.5-pro for translations (latest and most capable)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    
    let prompt = ''
    
    switch (context) {
      case 'title':
        prompt = targetLang === 'en' 
          ? `Translate the following Korean blog post title to English. Make it engaging and SEO-friendly while preserving the original meaning:

"${text}"

Provide only the translated title without any explanation.`
          : `Translate the following English blog post title to Korean. Make it natural and appropriate for Korean readers while preserving the original meaning:

"${text}"

Provide only the translated title without any explanation.`
        break
        
      case 'excerpt':
        prompt = targetLang === 'en'
          ? `Translate the following Korean blog excerpt to English. Keep it concise and engaging:

"${text}"

Provide only the translated excerpt without any explanation.`
          : `Translate the following English blog excerpt to Korean. Keep it concise and natural for Korean readers:

"${text}"

Provide only the translated excerpt without any explanation.`
        break
        
      case 'content':
        prompt = targetLang === 'en'
          ? `You are a professional translator specializing in tech blogs. Translate the following Korean blog post content to English. 

Requirements:
- Preserve all markdown formatting
- Keep technical terms accurate
- Maintain the author's tone and style
- Make it natural for English readers
- Keep any code blocks unchanged
- Translate image alt texts if present

Korean content:
${text}

Provide only the translated content without any explanation.`
          : `You are a professional translator specializing in tech blogs. Translate the following English blog post content to Korean. 

Requirements:
- Preserve all markdown formatting
- Keep technical terms accurate
- Maintain the author's tone and style
- Make it natural for Korean readers
- Keep any code blocks unchanged
- Translate image alt texts if present
- Use appropriate honorifics and formal language

English content:
${text}

Provide only the translated content without any explanation.`
        break
    }
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error('Translation error details:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      targetLang,
      context,
      textLength: text.length
    })
    throw new Error(`Failed to translate content: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 하위 호환성을 위한 기존 함수
export async function translateToEnglish(text: string, context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  return translate(text, 'en', context)
}

export async function translateToKorean(text: string, context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  return translate(text, 'ko', context)
}

export async function createPostTranslation(post: {
  title: string
  content: string
  excerpt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}, targetLang: 'en' | 'ko' = 'en') {
  // Optimize: Batch all translations in a single API call instead of 5 separate calls
  // This reduces API quota usage from 5 calls to 1 call per post
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const sourceFields = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      seoTitle: post.seoTitle || post.title,
      seoDescription: post.seoDescription || post.excerpt || ''
    }

    const prompt = targetLang === 'en'
      ? `You are a professional translator specializing in tech blogs. Translate the following Korean blog post fields to English.

Requirements:
- Preserve all markdown formatting in content
- Keep technical terms accurate
- Maintain the author's tone and style
- Make it natural for English readers
- Keep any code blocks unchanged
- Translate image alt texts if present

Translate these fields and return ONLY a JSON object with the same structure:

${JSON.stringify(sourceFields, null, 2)}

Important: Return ONLY the JSON object with translated values. No explanation or markdown code blocks.`
      : `You are a professional translator specializing in tech blogs. Translate the following English blog post fields to Korean.

Requirements:
- Preserve all markdown formatting in content
- Keep technical terms accurate
- Maintain the author's tone and style
- Make it natural for Korean readers
- Keep any code blocks unchanged
- Translate image alt texts if present
- Use appropriate honorifics and formal language

Translate these fields and return ONLY a JSON object with the same structure:

${JSON.stringify(sourceFields, null, 2)}

Important: Return ONLY the JSON object with translated values. No explanation or markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let responseText = response.text().trim()

    // Remove markdown code block wrapper if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const translated = JSON.parse(responseText)

    return {
      locale: targetLang,
      title: translated.title,
      content: translated.content,
      excerpt: translated.excerpt || null,
      seoTitle: translated.seoTitle,
      seoDescription: translated.seoDescription,
    }
  } catch (error) {
    console.error('Batch translation error details:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      targetLang,
      postTitle: post.title
    })
    throw new Error(`Failed to translate post: ${error instanceof Error ? error.message : String(error)}`)
  }
}