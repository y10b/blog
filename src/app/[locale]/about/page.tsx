import PageLayout from '@/components/PageLayout'
import Link from 'next/link'
import { siteConfig } from '@/config'

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'

  if (lang === 'ko') {
    return (
      <PageLayout locale={locale} currentPath="/about">
        <article className="max-w-3xl">
          <h1 className="text-4xl font-bold text-stone-900 mb-3 tracking-tight">소개</h1>
          <p className="text-stone-500 mb-10 text-base">
            <strong className="text-stone-700">{siteConfig.shortName}</strong> · 풀스택 개발자 / AI·LLM / 자동화
          </p>

          <section className="mb-10">
            <p className="text-base lg:text-lg text-stone-700 leading-relaxed">
              기획부터 배포·운영까지 전 과정을 1인으로 수행하는 풀스택 개발자입니다.
              AI/LLM을 활용한 적응형 학습 시스템, 멀티채널 고객 응대 자동화 파이프라인,
              외부 API 기반 데이터 분석 서비스를 설계·구현하며 수작업 중심의 업무를 시스템으로 전환해왔습니다.
            </p>
            <p className="text-base lg:text-lg text-stone-700 leading-relaxed mt-4">
              비용 효율적인 AI 모델 선정부터 실시간 제약 하의 아키텍처 설계까지,
              <strong className="text-stone-900"> 비즈니스 문제를 기술로 해결하는 것</strong>에 집중합니다.
              지금은 초기 스타트업에서 이미지 생성 모델(FLUX LoRA) 학습으로 영역을 확장하는 전환기에 있습니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-stone-900 mb-4">경력</h2>
            <div className="border-l-2 border-amber-200 pl-5">
              <div className="text-sm text-stone-500">2025.11 — 진행 중</div>
              <h3 className="text-base font-semibold text-stone-900 mt-1">리크루팅 스타트업 · 풀스택 개발자 (1인 개발)</h3>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                기획·설계·개발·배포·운영 전 과정을 1인으로 담당. AI/LLM 학습 플랫폼과 멀티채널 자동화 시스템을 직접 구축.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-stone-900 mb-5">주요 프로젝트</h2>
            <div className="space-y-7">
              <ProjectKo
                title="AI 적응형 학습 플랫폼"
                role="기획 · 풀스택 · 운영 · 1인 개발"
                tags={['Next.js 16', 'NestJS', 'FastAPI', 'GPT-4o-mini', 'PostgreSQL', 'Redis', 'Bull Queue']}
                summary="리크루팅의 이탈률 문제 — 관심 없는 후보자가 매칭됨 — 를 학습 완료자 = 검증된 리드 가설로 풀어낸 적응형 학습 플랫폼. 객관식→빈칸채우기→AI 서술 평가 3단계, 5가지 기준(공감력·질문전환·쉬운설명·정확성·자연스러움) 실시간 대화 평가, 게이미피케이션."
                metrics={['가입자 101명', 'MAU 70.3%', '일 평균 미션 21건', '11개 외부 API', '39개 NestJS 모듈']}
              />
              <ProjectKo
                title="카카오톡 AI 자동응답 시스템"
                role="기획 · 개발 · 운영 · 1인 개발"
                tags={['Express', 'Claude Haiku', 'SQLite (WAL)', 'Slack Bolt', 'Meta Graph API']}
                summary="리드 유입→상담→후속 관리 전 과정을 무인 운영. 카카오 채널 5초 응답 제한에 맞춰 4.5초 타임아웃 + 폴백 + 비동기 SMS. 대화 데이터를 Few-Shot으로 자동 반영하는 자가 개선 구조."
                metrics={['Meta 리드 146건', '알림톡 성공률 65.1%', '챗봇 매칭 8.2%', '하루 7명 자동 처리']}
              />
              <ProjectKo
                title="외부 API 기반 AI 진단 서비스"
                role="기획 · 풀스택 · 1인 개발 · 진행 중"
                tags={['Next.js', 'FastAPI', 'PostgreSQL', 'Anthropic SDK', 'Hyphen API', 'NHIS API']}
                summary="가입 없이 30초 만에 사용자 데이터를 AI로 분석하는 진단 서비스. 3개 외부 공공/제휴 API를 체인으로 연결해 데이터 수집 → 매핑 → 분석 → 추천까지 자동화. PASS·SMS·카카오 OAuth 다단계 본인인증, 멀티 분석기 아키텍처(충분·부족·과다 판단)."
              />
              <ProjectKo
                title="3-Role AI 학습 코칭 플랫폼"
                role="백엔드 1인 개발 · 해커톤 대상(1등)"
                tags={['FastAPI', 'OpenAI', 'AWS S3', 'PyMuPDF', 'JWT']}
                summary="멘토·학생·학부모 3-Role 학습 코칭 플랫폼. 학생 과제 제출 → PDF/이미지 텍스트 추출 → AI가 취약 영역·오답 패턴·학습 방향 자동 생성 → 멘토가 보완해서 최종 전달."
              />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-stone-900 mb-4">기술 스택</h2>
            <div className="space-y-3 text-sm">
              <SkillRowKo label="Frontend" items={['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'React Query', 'Zod']} />
              <SkillRowKo label="Backend" items={['NestJS', 'Express', 'FastAPI', 'Node.js', 'Python', 'Prisma']} />
              <SkillRowKo label="DB & Infra" items={['PostgreSQL', 'SQLite', 'Redis', 'AWS (EC2 · S3 · ALB)', 'Docker', 'PM2']} />
              <SkillRowKo label="AI / LLM" items={['OpenAI GPT-4o-mini', 'Anthropic Claude', 'LangChain', 'FLUX LoRA', 'Prompt Engineering']} />
              <SkillRowKo label="Integration" items={['Kakao i OpenBuilder', 'Meta Graph API', 'Slack Bolt', 'Aligo (알림톡/SMS)', 'Socket.io']} />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-stone-900 mb-4">학습 · 활동</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-4 border-b border-stone-200 pb-3">
                <div>
                  <div className="font-semibold text-stone-900">블레이버스 MVP 해커톤 4기 — 대상 (1등)</div>
                  <div className="text-stone-600 mt-0.5">백엔드 1인 개발 · 3-Role AI 학습 코칭 플랫폼</div>
                </div>
                <div className="text-stone-500 whitespace-nowrap">2026.02</div>
              </li>
              <li className="flex justify-between gap-4 border-b border-stone-200 pb-3">
                <div>
                  <div className="font-semibold text-stone-900">KDF 한국 개발자 포럼 — 운영진 1기</div>
                  <div className="text-stone-600 mt-0.5">운영팀</div>
                </div>
                <div className="text-stone-500 whitespace-nowrap">2025.12 — 진행 중</div>
              </li>
              <li className="flex justify-between gap-4">
                <div>
                  <div className="font-semibold text-stone-900">코드잇 부트캠프</div>
                  <div className="text-stone-600 mt-0.5">클라우드 기반 풀스택 과정 6기 수료</div>
                </div>
                <div className="text-stone-500 whitespace-nowrap">2025.01 — 2025.08</div>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-stone-900 mb-4">이 블로그에서 다루는 것</h2>
            <ul className="space-y-2.5 text-base text-stone-700">
              <li><strong className="text-stone-900">개발 / AI</strong> — AI 모델 학습기(FLUX LoRA, 얼굴 인상 분석 MLP), 상품·서비스 개발기, 풀스택→AI 전환, 초기 스타트업 엔지니어링.</li>
              <li><strong className="text-stone-900">N잡 / 도구 / 정책</strong> — 1인 운영자의 워크플로 자동화, 프리랜서·N잡 정책 정보, AI/생산성 도구 후기, 사이드 프로젝트 수익화.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-stone-900 mb-4">글의 톤</h2>
            <p className="text-base text-stone-700 leading-relaxed">
              성공보다 <strong className="text-stone-900">삽질·실패·우회</strong>를 자세히 기록합니다.
              추상적 조언 대신 숫자(F1, MAE, step, 시간, 비용)를 우선하고, 안 써본 도구는 후기를 쓰지 않습니다.
              일부 글은 자동 생성 후 사람이 검토해 발행합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-4">연락</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-stone-500 inline-block w-20">GitHub</span>
                <a href="https://github.com/y10b" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-800">
                  github.com/y10b
                </a>
              </li>
              <li>
                <span className="text-stone-500 inline-block w-20">Email</span>
                <span className="text-stone-700">victo***@gmail.com</span>
              </li>
            </ul>
          </section>
        </article>
      </PageLayout>
    )
  }

  // English
  return (
    <PageLayout locale={locale} currentPath="/about">
      <article className="max-w-3xl">
        <h1 className="text-4xl font-bold text-stone-900 mb-3 tracking-tight">About</h1>
        <p className="text-stone-500 mb-10 text-base">
          <strong className="text-stone-700">{siteConfig.shortName}</strong> · Full-stack Developer / AI·LLM / Automation
        </p>

        <section className="mb-10">
          <p className="text-base lg:text-lg text-stone-700 leading-relaxed">
            A full-stack developer who handles the whole lifecycle — planning, building, deploying, and running — solo.
            I design and ship adaptive learning systems with AI/LLM, multi-channel customer-response automation pipelines,
            and external-API-driven data analysis services, converting manual workflows into systems.
          </p>
          <p className="text-base lg:text-lg text-stone-700 leading-relaxed mt-4">
            From cost-efficient model selection to architecture under real-time constraints,
            I focus on <strong className="text-stone-900">solving business problems with technology</strong>.
            Currently expanding into image generation model training (FLUX LoRA) at an early-stage startup.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Experience</h2>
          <div className="border-l-2 border-amber-200 pl-5">
            <div className="text-sm text-stone-500">2025.11 — Present</div>
            <h3 className="text-base font-semibold text-stone-900 mt-1">Recruiting Startup · Full-stack Developer (Solo)</h3>
            <p className="text-sm text-stone-600 mt-1 leading-relaxed">
              End-to-end ownership: planning, design, development, deployment, operations.
              Built AI/LLM learning platforms and multi-channel automation systems.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-5">Selected Projects</h2>
          <div className="space-y-7">
            <ProjectEn
              title="AI Adaptive Learning Platform"
              role="Plan · Full-stack · Operations · Solo"
              tags={['Next.js 16', 'NestJS', 'FastAPI', 'GPT-4o-mini', 'PostgreSQL', 'Redis', 'Bull Queue']}
              summary="Built to validate the hypothesis that 'completed learners = validated leads' — solving the high-churn problem of recruiting candidates with no real interest. Adaptive 3-stage missions (multiple-choice → fill-in → AI essay evaluation), 5-criteria real-time conversation grading, gamification."
              metrics={['101 sign-ups', 'MAU 70.3%', '21 missions/day avg', '11 external APIs', '39 NestJS modules']}
            />
            <ProjectEn
              title="KakaoTalk AI Auto-response System"
              role="Plan · Build · Run · Solo"
              tags={['Express', 'Claude Haiku', 'SQLite (WAL)', 'Slack Bolt', 'Meta Graph API']}
              summary="Fully automated lead funnel: ad inflow → conversation → follow-up. 4.5s timeout to fit Kakao's 5s constraint, with fallback + async SMS. Self-improving system — accumulated conversations are auto-fed back as Few-Shot examples."
              metrics={['146 Meta leads', '65.1% AlimTalk delivery', '8.2% chatbot match', '7 leads/day auto']}
            />
            <ProjectEn
              title="External-API AI Diagnosis Service"
              role="Plan · Full-stack · Solo · In Progress"
              tags={['Next.js', 'FastAPI', 'PostgreSQL', 'Anthropic SDK', 'Hyphen API', 'NHIS API']}
              summary="30-second AI analysis of user data without sign-up. Chains 3 external public/partner APIs to collect → map → analyze → recommend. Multi-step auth (PASS · SMS · Kakao OAuth), multi-analyzer engine (sufficient / insufficient / excess judgment)."
            />
            <ProjectEn
              title="3-Role AI Coaching Platform"
              role="Backend Solo · Hackathon Grand Prize"
              tags={['FastAPI', 'OpenAI', 'AWS S3', 'PyMuPDF', 'JWT']}
              summary="3-role coaching platform (student · mentor · parent). Student submits assignment → PyMuPDF extracts text from PDF/image → AI generates weak-area / wrong-pattern / direction suggestions → mentor refines → final delivery."
            />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Tech Stack</h2>
          <div className="space-y-3 text-sm">
            <SkillRowEn label="Frontend" items={['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'React Query', 'Zod']} />
            <SkillRowEn label="Backend" items={['NestJS', 'Express', 'FastAPI', 'Node.js', 'Python', 'Prisma']} />
            <SkillRowEn label="DB & Infra" items={['PostgreSQL', 'SQLite', 'Redis', 'AWS (EC2 · S3 · ALB)', 'Docker', 'PM2']} />
            <SkillRowEn label="AI / LLM" items={['OpenAI GPT-4o-mini', 'Anthropic Claude', 'LangChain', 'FLUX LoRA', 'Prompt Engineering']} />
            <SkillRowEn label="Integration" items={['Kakao i OpenBuilder', 'Meta Graph API', 'Slack Bolt', 'Aligo (AlimTalk/SMS)', 'Socket.io']} />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Activity</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between gap-4 border-b border-stone-200 pb-3">
              <div>
                <div className="font-semibold text-stone-900">Bleibers MVP Hackathon 4 — Grand Prize</div>
                <div className="text-stone-600 mt-0.5">Backend Solo · 3-Role AI Coaching Platform</div>
              </div>
              <div className="text-stone-500 whitespace-nowrap">2026.02</div>
            </li>
            <li className="flex justify-between gap-4 border-b border-stone-200 pb-3">
              <div>
                <div className="font-semibold text-stone-900">KDF Korean Developer Forum — Steering Committee, 1st Cohort</div>
                <div className="text-stone-600 mt-0.5">Operations team</div>
              </div>
              <div className="text-stone-500 whitespace-nowrap">2025.12 — Present</div>
            </li>
            <li className="flex justify-between gap-4">
              <div>
                <div className="font-semibold text-stone-900">Codeit Bootcamp</div>
                <div className="text-stone-600 mt-0.5">Cloud-based Full-stack Program, 6th Cohort</div>
              </div>
              <div className="text-stone-500 whitespace-nowrap">2025.01 — 2025.08</div>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-4">What I write about</h2>
          <ul className="space-y-2.5 text-base text-stone-700">
            <li><strong className="text-stone-900">Dev / AI</strong> — Model training logs (FLUX LoRA, MLP), product build journals, fullstack→AI transition, early-stage engineering.</li>
            <li><strong className="text-stone-900">Side hustle / Tools / Policy</strong> — Solo workflow automation, freelancer policy info, AI / productivity tool reviews, monetizing side projects.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Voice</h2>
          <p className="text-base text-stone-700 leading-relaxed">
            I write more about <strong className="text-stone-900">failures, detours, and workarounds</strong> than wins.
            Numbers over abstractions — F1, MAE, steps, hours, costs. No reviews of tools I haven't tried.
            Some posts are AI-drafted then human-reviewed before publishing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-stone-500 inline-block w-20">GitHub</span>
              <a href="https://github.com/y10b" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-800">
                github.com/y10b
              </a>
            </li>
            <li>
              <span className="text-stone-500 inline-block w-20">Email</span>
              <span className="text-stone-700">victo***@gmail.com</span>
            </li>
          </ul>
        </section>
      </article>
    </PageLayout>
  )
}

// ────────────────────────────────────────────────────────
// Project / Skill row components
// ────────────────────────────────────────────────────────
function ProjectKo({ title, role, tags, summary, metrics }: {
  title: string; role: string; tags: string[]; summary: string; metrics?: string[]
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <div className="text-xs text-stone-500 mt-0.5">{role}</div>
      <p className="text-sm text-stone-700 leading-relaxed mt-2">{summary}</p>
      {metrics && metrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {metrics.map(m => (
            <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">{m}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-600">{t}</span>
        ))}
      </div>
    </div>
  )
}

function ProjectEn({ title, role, tags, summary, metrics }: {
  title: string; role: string; tags: string[]; summary: string; metrics?: string[]
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <div className="text-xs text-stone-500 mt-0.5">{role}</div>
      <p className="text-sm text-stone-700 leading-relaxed mt-2">{summary}</p>
      {metrics && metrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {metrics.map(m => (
            <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">{m}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-600">{t}</span>
        ))}
      </div>
    </div>
  )
}

function SkillRowKo({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
      <div className="text-xs font-semibold text-stone-400 tracking-wider uppercase sm:w-28 sm:flex-shrink-0">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-stone-100 text-stone-700">{item}</span>
        ))}
      </div>
    </div>
  )
}

function SkillRowEn({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
      <div className="text-xs font-semibold text-stone-400 tracking-wider uppercase sm:w-28 sm:flex-shrink-0">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-stone-100 text-stone-700">{item}</span>
        ))}
      </div>
    </div>
  )
}
