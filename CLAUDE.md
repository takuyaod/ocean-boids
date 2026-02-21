# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト構成

モノレポ構成で、Next.js アプリケーションは [app/](app/) ディレクトリに配置されています。開発コマンドはすべて `app/` ディレクトリで実行してください。

## コマンド

すべて `app/` ディレクトリで実行します：

```bash
cd app

npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint 実行
```

テストフレームワークは未設定です。

## アーキテクチャ

- **フレームワーク**: Next.js 16（App Router）
- **言語**: TypeScript 5（strict モード）
- **スタイリング**: Tailwind CSS 4（PostCSS 経由）
- **パスエイリアス**: `@/*` → `./src/*`

### App Router 構成

ソースは [app/src/app/](app/src/app/) に配置され、Next.js App Router の規約に従います：
- [layout.tsx](app/src/app/layout.tsx) — Geist フォントを設定するルートレイアウト
- [page.tsx](app/src/app/page.tsx) — ホームページ（現在はテンプレートのプレースホルダー）
- [globals.css](app/src/app/globals.css) — Tailwind のインポートとライト/ダークテーマの CSS カスタムプロパティ

このプロジェクトは "boids"（群れシミュレーション）の実装を目的としています。

## コーディング規則

- **コードコメント**: 日本語で記述する
- **変数名・関数名**: 英語（プロジェクトの既存スタイルに従う）

## スキル（Claude Code カスタムコマンド）

プロジェクト固有のスキルは `~/.claude/` ではなく、このリポジトリ内の [.claude/skills/](.claude/skills/) ディレクトリに作成してください。これにより、スキルをバージョン管理に含められます。

各スキルは `.claude/skills/<スキル名>/SKILL.md` として配置します。
