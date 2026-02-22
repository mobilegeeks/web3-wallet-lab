# web3-wallet-lab

`web3-wallet-lab`은 Web3 지갑의 핵심 흐름을 처음부터 직접 구현해보는 실험/학습용 프로젝트입니다.

## 우리가 지금 할 일
- [x] 프로젝트 기준 문서 작성
- [x] 초기 디렉터리/스크립트 골격 생성
- [ ] 개발 환경 설치 및 검증
- [ ] 웹 앱 초기화
- [ ] 지갑 핵심 기능 구현

## 목표 범위 (MVP)
- 지갑 생성(새 계정)과 복구(시드/프라이빗 키)
- 지갑 연결 및 주소/잔액 조회
- 네트워크 전환(테스트넷 우선)
- 트랜잭션 서명/전송
- 기본 보안 원칙 적용(민감정보 노출 방지, 환경변수 관리)

## 기본 환경
- Node.js: 20.x LTS (`.nvmrc` 참고)
- pnpm: 9+
- Git

## 빠른 시작
```bash
bash scripts/check-env.sh
```

환경 점검이 통과하면 다음 단계로 진행합니다.

```bash
# 이후 앱 스캐폴딩 시 실행 예정
pnpm install
```

## 작업 구조
```text
.
├── apps/
│   └── web/
├── docs/
│   └── roadmap.md
├── packages/
│   └── wallet-core/
├── scripts/
│   └── check-env.sh
├── .editorconfig
├── .gitignore
├── .nvmrc
├── package.json
└── pnpm-workspace.yaml
```

## 실행 명령
- `bash scripts/check-env.sh`: 필수 도구 설치 여부와 버전 점검
- `pnpm run check:env`: 위 스크립트를 `pnpm`으로 실행
- `pnpm run setup`: 초기 셋업 점검(현재는 `check:env` 호출)
- `pnpm run plan`: 로드맵 안내

## 구현 로드맵
상세 체크리스트는 `docs/roadmap.md`에 정리되어 있습니다.

## 진행 원칙
- 작은 단위로 구현하고 매 단계에서 동작 검증
- 보안 관련 항목은 기능보다 먼저 점검
- 문서(README/roadmap)와 실제 코드 상태를 항상 동기화
