# 🔒 자동 백업 시스템

## 개요

**더 이상 데이터 손실은 없습니다!** 이 시스템은 포스트가 생성/수정될 때마다 자동으로 로컬에 백업하여 데이터 손실을 방지합니다.

## 🚨 백그라운드

2025년 10월 27일, Neon 데이터베이스 할당량 초과로 인해 700개의 포스트를 일시적으로 접근할 수 없게 되었습니다. 이 사건을 통해 자동 백업 시스템의 필요성을 절감하고 구축하게 되었습니다.

## ✨ 주요 기능

### 1. 자동 백업
- **포스트 생성 시**: YouTube-to-blog, AI 일일 포스트 생성 시 자동 백업
- **포스트 수정 시**: 향후 업데이트/편집 시 자동 백업
- **실패 안전**: 백업 실패 시에도 메인 기능에 영향 없음

### 2. 다양한 백업 타입
- **단일 포스트 백업**: 특정 포스트만 백업
- **전체 백업**: 모든 포스트 데이터 백업
- **매일 자동 백업**: 스케줄링된 전체 백업

### 3. 백업 관리
- **백업 목록 조회**: 모든 백업 파일 확인
- **백업 상태 확인**: 백업 디렉토리, 파일 수, 크기 등
- **오래된 백업 정리**: 30일 이상된 백업 자동 삭제
- **백업에서 복원**: 손실된 데이터 복구

## 📝 사용법

### 기본 명령어

```bash
# 백업 상태 확인
pnpm backup:status

# 전체 백업 생성
pnpm backup:all

# 특정 포스트 백업
pnpm backup:post <post-id>

# 백업 파일 목록
pnpm backup:list

# 백업에서 복원
pnpm backup:restore <backup-filename>

# 오래된 백업 정리
pnpm backup:cleanup

# 매일 백업 실행
pnpm backup:daily
```

### 실제 사용 예시

```bash
# 현재 상태 확인
pnpm backup:status
# 📊 백업 상태:
#   디렉토리: <project-root>/local-backups
#   총 백업: 5개
#   최신 백업: full-backup-2025-10-27-1761553396082.json
#   총 크기: 2.4 MB

# 백업 목록 확인
pnpm backup:list
# 📋 백업 파일 목록 (5개):
# 1. full-backup-2025-10-27-1761553396082.json
# 2. single-post-backup-ai-blog-1761553123456.json
# ...

# 백업에서 복원 (데이터 손실 시)
pnpm backup:restore full-backup-2025-10-27-1761553396082.json
```

## 🗂️ 백업 파일 구조

```json
{
  "timestamp": "2025-10-27T07:36:36.082Z",
  "version": "2.0",
  "totalPosts": 5,
  "posts": [
    {
      "id": "post-id",
      "title": "포스트 제목",
      "slug": "post-slug",
      "content": "포스트 내용...",
      "tags": "AI,블로그,자동화",
      "status": "PUBLISHED",
      "publishedAt": "2025-10-27T07:30:00.000Z",
      "translations": []
    }
  ],
  "metadata": {
    "source": "turso-database",
    "backupType": "automatic",
    "triggeredBy": "post-create"
  }
}
```

## 🔄 자동 백업 트리거

### 포스트 생성 시
- **YouTube-to-blog API**: 영상을 블로그로 변환할 때
- **일일 포스트 생성**: AI가 자동으로 포스트 생성할 때
- **수동 포스트 생성**: 관리자가 직접 포스트 생성할 때

### 향후 추가 예정
- **포스트 수정 시**: 기존 포스트 업데이트할 때
- **대량 작업 시**: 여러 포스트를 한번에 처리할 때

## 📍 백업 저장 위치

```
<project-root>/local-backups/
├── full-backup-2025-10-27-1761553396082.json
├── single-post-backup-youtube-post-1761553123456.json
└── manual-backup-1761544536709.json
```

**⚠️ 중요**: 백업 파일들은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다. 별도로 안전한 곳에 보관하세요.

## 🛡️ 데이터 복구 절차

### 1. 부분 데이터 손실 시
```bash
# 1. 손실된 포스트 ID 확인
# 2. 최신 백업에서 특정 포스트 찾기
pnpm backup:list

# 3. 백업 파일에서 복원
pnpm backup:restore <backup-filename>
```

### 2. 전체 데이터 손실 시
```bash
# 1. 가장 최신 전체 백업 사용
pnpm backup:status

# 2. 전체 복원
pnpm backup:restore <latest-full-backup>

# 3. 데이터 확인
# 웹사이트에서 포스트들이 정상적으로 보이는지 확인
```

## ⚙️ 설정 및 커스터마이징

### 백업 보관 기간 변경
```bash
# 기본 30일 대신 60일로 변경
pnpm backup:cleanup 60
```

### 매일 백업 자동화 (cron)
```bash
# crontab -e에 추가
0 2 * * * cd /path/to/your/blog-repo && pnpm backup:daily
```

## 🚀 향후 개선 계획

1. **클라우드 백업**: AWS S3, Google Drive 등 클라우드 저장소 연동
2. **증분 백업**: 변경된 부분만 백업하여 용량 최적화
3. **백업 압축**: 큰 백업 파일들을 압축하여 저장
4. **백업 검증**: 백업 파일의 무결성 자동 검증
5. **웹 UI**: 관리자 페이지에서 백업 관리 기능
6. **알림 시스템**: 백업 실패 시 이메일/슬랙 알림

## 🔧 문제 해결

### 백업 실패 시
```bash
# 1. 권한 확인
ls -la local-backups/

# 2. 디스크 공간 확인
df -h

# 3. 로그 확인
# 콘솔에서 백업 관련 에러 메시지 확인
```

### 복원 실패 시
```bash
# 1. 백업 파일 무결성 확인
cat local-backups/<backup-file> | jq .

# 2. 데이터베이스 연결 확인
pnpm backup:status

# 3. 수동 복원 (개별 포스트)
# 백업 파일에서 데이터를 수동으로 복사
```

## 📞 지원

백업 시스템 관련 문제가 발생하면:
1. 먼저 `pnpm backup:status`로 상태 확인
2. 로그에서 에러 메시지 확인
3. 이 문서의 문제 해결 섹션 참조

---

**최종 업데이트**: 2025년 10월 27일
**시스템 버전**: 2.0
**상태**: ✅ 활성화됨

> **"더 이상 데이터를 잃지 않겠다!"** - 700개 포스트 사건 이후의 다짐