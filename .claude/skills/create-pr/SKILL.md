---
description: Use when the user wants to create a pull request (PR) on GitHub for the current branch. Examples: "PR を作って", "プルリクを出して", "PR を作成して", "PR を出して".
---

# プルリクエスト作成スキル

現在のブランチからプルリクエストを作成します。対応する issue を自動で特定してクローズします。

## 使い方

```
/create-pr [issue番号]
```

- `issue番号` を指定するとその issue をクローズする PR を作成します
- 省略した場合はブランチ名から issue 番号を自動抽出します

## 手順

1. issue 番号を決定する（以下の優先順位で）
   1. `$ARGUMENTS` に番号が指定されていればそれを使う
   2. ブランチ名の先頭の数字列を issue 番号として抽出する（例: `18-feat-parameter-panel` → `18`）
   3. どちらでも特定できない場合はユーザーに確認する
2. 現在のブランチ名とコミット履歴を確認する
3. 特定した issue の内容を取得してタイトル・本文の参考にする
4. PR のタイトルと本文をまとめる
5. PR を作成してユーザーに URL を伝える

## 実行

### 現在のブランチ確認

```bash
git branch --show-current
```

main / master ブランチの場合は作業ブランチへ切り替えるよう伝えて中断してください。

ブランチ名が `<数字>-<説明>` の形式であれば、先頭の数字を issue 番号として抽出します。

### コミット履歴の確認

```bash
git log main..HEAD --oneline
```

コミットが0件の場合は PR を作成するものがない旨を伝えて中断してください。

### issue 情報の取得

issue 番号が特定できた場合は必ず取得します：

```bash
gh issue view <issue番号> --json number,title,body
```

issue 番号が特定できなかった場合（ブランチ名に番号がなく `$ARGUMENTS` も未指定）は、ユーザーに issue 番号を尋ねてください。issue が存在しないと明示された場合のみ issue なしで PR を作成します。

### PR タイトルと本文の生成ルール

**タイトル**:
- issue が特定されている場合: issue のタイトルをそのまま使うか、コミット内容に合わせて調整する
- issue がない場合: コミット履歴から内容を要約する

**本文**:
- issue が特定されている場合は**必ず**本文末尾に以下を追加する:
  ```
  Closes #<issue番号>
  ```
- 変更の概要をコミット履歴から自動生成する
- 本文テンプレート:
  ```
  ## 概要

  <変更内容の簡潔な説明>

  ## 変更点

  <コミット一覧や主な変更を箇条書き>

  Closes #<issue番号>
  ```

### PR 作成

```bash
gh pr create --title "<タイトル>" --body "<本文>" --base main
```

### 完了報告

- 作成した PR の URL を表示する
- クローズ対象の issue 番号も併せて表示する
