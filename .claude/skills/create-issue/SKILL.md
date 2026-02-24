---
description: Use when the user wants to create a GitHub issue. Examples: "issue を作って", "issue を作成して", "issue 作成依頼".
---

# GitHub Issue 作成スキル

ユーザーの指示をもとに GitHub に issue を作成します。

## 手順

1. ユーザーからタイトルと内容の情報を収集する
2. 現在のリポジトリ情報を確認する
3. `gh` CLI を使って issue を作成する
4. 作成した issue の URL をユーザーに伝える

## 実行

まず、issue のタイトルと説明をユーザーに確認してください。情報が揃っている場合はそのまま作成に進みます。

$ARGUMENTS が指定されている場合はタイトルとして使用します。

### リポジトリ確認

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
```

### Issue 作成

タイトルと本文が確定したら以下を実行します：

```bash
gh issue create --title "<タイトル>" --body "<本文>"
```

ラベルや担当者が指定された場合は `--label` や `--assignee` オプションを追加してください。

### 完了報告

作成した issue の URL を表示して完了を伝えます。
