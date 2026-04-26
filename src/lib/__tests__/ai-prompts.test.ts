/**
 * Tests for AI prompt generation utilities
 *
 * 새 페르소나(풀스택 → AI 모델 개발자, 카테고리 분기) 기준으로 검증.
 * Pure functions, no mocks.
 */

import { describe, it, expect } from 'vitest'
import {
  MASTER_SYSTEM_PROMPT,
  PERSONA_CORE,
  CATEGORY_DEV_PROMPT,
  CATEGORY_SIDEHUSTLE_PROMPT,
  buildSystemPrompt,
  generateContentPrompt,
  generateAffiliateContentPrompt,
  extractFirstJsonObject,
} from '../ai-prompts'

describe('PERSONA_CORE', () => {
  it('should declare the new operator persona', () => {
    expect(PERSONA_CORE).toContain('풀스택')
    expect(PERSONA_CORE).toContain('AI 모델 개발자')
    expect(PERSONA_CORE).toContain('초기 스타트업')
    expect(PERSONA_CORE).toContain('FLUX')
  })

  it('should explicitly forbid the previous operator footprint', () => {
    expect(PERSONA_CORE).toContain('Wegovy')
    expect(PERSONA_CORE).toContain('ADHD')
    expect(PERSONA_CORE).toContain('Colemearchy')
    expect(PERSONA_CORE).toMatch(/금지/)
  })

  it('should set the experiment-log voice', () => {
    expect(PERSONA_CORE).toMatch(/삽질|실패|우회/)
    expect(PERSONA_CORE).toMatch(/숫자|수치|F1|MAE/)
  })

  it('should forbid direct self-introduction at the opening', () => {
    expect(PERSONA_CORE).toMatch(/자기소개로 시작하지 말 것|안녕하세요/)
  })

  it('should ban hallucinated numbers and false facts', () => {
    expect(PERSONA_CORE).toMatch(/HALLUCINATION|hallucination|만들어내지 말|추측하지 말/)
    expect(PERSONA_CORE).toMatch(/RAG|knowledge|컨텍스트/)
  })
})

describe('CATEGORY_DEV_PROMPT', () => {
  it('should target dev/AI content', () => {
    expect(CATEGORY_DEV_PROMPT).toContain('DEV')
    expect(CATEGORY_DEV_PROMPT).toMatch(/AI 모델|FLUX|MLP/)
  })

  it('should require code blocks and metric tables', () => {
    expect(CATEGORY_DEV_PROMPT).toMatch(/코드|표/)
  })
})

describe('CATEGORY_SIDEHUSTLE_PROMPT', () => {
  it('should target N잡/도구/사이드 프로젝트', () => {
    expect(CATEGORY_SIDEHUSTLE_PROMPT).toContain('SIDEHUSTLE')
    expect(CATEGORY_SIDEHUSTLE_PROMPT).toMatch(/N잡|도구|사이드/)
  })

  it('should be friendlier to non-developer readers', () => {
    expect(CATEGORY_SIDEHUSTLE_PROMPT).toMatch(/비개발자|단계별|스크린샷/)
  })
})

describe('buildSystemPrompt', () => {
  it('should default to dev category', () => {
    const result = buildSystemPrompt()
    expect(result).toContain('DEV')
    expect(result).not.toContain('CATEGORY: SIDEHUSTLE')
  })

  it('should switch to sidehustle when requested', () => {
    const result = buildSystemPrompt('sidehustle')
    expect(result).toContain('SIDEHUSTLE')
    expect(result).not.toContain('CATEGORY: DEV')
  })

  it('should include persona core in every variant', () => {
    expect(buildSystemPrompt('dev')).toContain('풀스택')
    expect(buildSystemPrompt('sidehustle')).toContain('풀스택')
  })

  it('should include SEO rules and output format in every variant', () => {
    const dev = buildSystemPrompt('dev')
    const side = buildSystemPrompt('sidehustle')
    for (const p of [dev, side]) {
      expect(p).toContain('E-E-A-T')
      expect(p).toContain('OUTPUT FORMAT')
      expect(p).toContain('JSON-LD')
    }
  })

  it('should require single JSON object output (no fences, no duplicates)', () => {
    const p = buildSystemPrompt('dev')
    expect(p).toMatch(/단 하나의 JSON|반복.*금지|두 번/)
    expect(p).toMatch(/코드블록.*금지|펜스.*금지/)
  })
})

describe('extractFirstJsonObject', () => {
  it('should parse a plain JSON object', () => {
    expect(extractFirstJsonObject<{ a: number }>('{"a":1}')).toEqual({ a: 1 })
  })

  it('should strip ```json ... ``` fences', () => {
    const raw = '```json\n{"title":"X","tags":["dev"]}\n```'
    expect(extractFirstJsonObject<{ title: string }>(raw)).toEqual({ title: 'X', tags: ['dev'] })
  })

  it('should grab only the first JSON when the model duplicates the block', () => {
    const raw = '```json\n{"title":"first"}\n```\n```json\n{"title":"second"}\n```'
    expect(extractFirstJsonObject<{ title: string }>(raw)).toEqual({ title: 'first' })
  })

  it('should ignore prose before the JSON', () => {
    const raw = '여기 결과입니다:\n\n{"ok": true, "n": 42}\n\n끝.'
    expect(extractFirstJsonObject<{ ok: boolean; n: number }>(raw)).toEqual({ ok: true, n: 42 })
  })

  it('should respect braces inside string values', () => {
    const raw = '{"content":"prefix { not a real brace } suffix","tags":["dev"]}'
    const r = extractFirstJsonObject<{ content: string }>(raw)
    expect(r.content).toBe('prefix { not a real brace } suffix')
  })

  it('should throw on missing JSON', () => {
    expect(() => extractFirstJsonObject('no json here')).toThrow()
  })

  it('should throw on unbalanced braces', () => {
    expect(() => extractFirstJsonObject('{"a":1')).toThrow()
  })

  it('should handle markdown code blocks (triple backticks) inside JSON content', () => {
    // 모델이 자주 만드는 케이스: JSON content에 ```python ... ``` 같은 markdown 코드블록 포함
    const raw = '```json\n{"title":"X","content":"intro\\n\\n```python\\nprint(1)\\n```\\n\\noutro"}\n```'
    const r = extractFirstJsonObject<{ title: string; content: string }>(raw)
    expect(r.title).toBe('X')
    expect(r.content).toContain('print(1)')
  })

  it('should fallback to next { when first one is invalid prose', () => {
    // 첫 `{`가 false positive (prose 안의 단어)인 경우
    const raw = '아래는 결과 { 임시 텍스트... 진짜 결과: {"title":"real","tags":["dev"]}'
    const r = extractFirstJsonObject<{ title: string }>(raw)
    expect(r.title).toBe('real')
  })
})

describe('MASTER_SYSTEM_PROMPT (legacy export)', () => {
  it('should be a non-empty string equal to the dev variant', () => {
    expect(typeof MASTER_SYSTEM_PROMPT).toBe('string')
    expect(MASTER_SYSTEM_PROMPT.length).toBeGreaterThan(500)
    expect(MASTER_SYSTEM_PROMPT).toBe(buildSystemPrompt('dev'))
  })
})

describe('generateContentPrompt', () => {
  describe('basic functionality', () => {
    it('should include topic line in Korean output instruction', () => {
      const result = generateContentPrompt('FLUX LoRA 학습 후기')
      expect(result).toContain('FLUX LoRA 학습 후기')
      expect(result).toMatch(/Korean/i)
    })

    it('should default category to dev', () => {
      const result = generateContentPrompt('Topic')
      expect(result).toContain('Category: dev')
    })

    it('should include JSON output spec with the category tag pinned first', () => {
      const result = generateContentPrompt('Topic', undefined, undefined, 'sidehustle')
      expect(result).toContain('Category: sidehustle')
      expect(result).toContain('"tags":["sidehustle"')
    })
  })

  describe('keywords integration', () => {
    it('should include keywords when provided', () => {
      const result = generateContentPrompt('Topic', ['LoRA', 'FLUX', 'fine-tuning'])
      expect(result).toContain('Target keywords: LoRA, FLUX, fine-tuning')
    })

    it('should omit keywords section when empty', () => {
      expect(generateContentPrompt('Topic', [])).not.toContain('Target keywords')
      expect(generateContentPrompt('Topic')).not.toContain('Target keywords')
    })
  })

  describe('affiliate products integration', () => {
    it('should include affiliate products when provided', () => {
      const result = generateContentPrompt('Topic', undefined, ['Logitech MX Master', 'Dell U2723QE'])
      expect(result).toContain('Affiliate products to integrate naturally')
      expect(result).toContain('Logitech MX Master')
    })

    it('should omit affiliate section when empty/undefined', () => {
      expect(generateContentPrompt('Topic')).not.toContain('Affiliate products')
      expect(generateContentPrompt('Topic', undefined, [])).not.toContain('Affiliate products')
    })
  })

  describe('content length requirement', () => {
    it('should require longer body for dev category', () => {
      expect(generateContentPrompt('Topic', undefined, undefined, 'dev')).toContain('2,500자')
    })

    it('should allow shorter body for sidehustle category', () => {
      expect(generateContentPrompt('Topic', undefined, undefined, 'sidehustle')).toContain('1,500자')
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = generateContentPrompt('')
      expect(result).toContain('Category: dev')
    })

    it('should handle Korean topic', () => {
      const result = generateContentPrompt('Next.js에 LLM 붙여본 후기')
      expect(result).toContain('Next.js에 LLM 붙여본 후기')
    })
  })

  describe('return type', () => {
    it('should return a non-empty string', () => {
      const result = generateContentPrompt('Topic')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(100)
    })
  })
})

describe('generateAffiliateContentPrompt', () => {
  it('should embed product info and AFFILIATE_LINK_PLACEHOLDER', () => {
    const result = generateAffiliateContentPrompt(
      'Logitech MX Master 3S',
      'https://coupa.ng/abc',
      ['생산성', '마우스'],
      'review',
      { category: '전자기기', price: 159000 },
    )
    expect(result).toContain('Logitech MX Master 3S')
    expect(result).toContain('AFFILIATE_LINK_PLACEHOLDER')
    expect(result).toContain('₩159,000')
  })

  it('should explicitly ban fake reviews', () => {
    const result = generateAffiliateContentPrompt('Some Product', 'url', [], 'review')
    expect(result).toMatch(/가짜 후기/)
  })

  it('should reject health/diet products by guidance', () => {
    const result = generateAffiliateContentPrompt('Some Product', 'url', [], 'guide')
    expect(result).toMatch(/건강|다이어트/)
    expect(result).toMatch(/금지/)
  })
})
