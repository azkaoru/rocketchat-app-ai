# RocketChat AI Bot App

RocketChat アプリケーションで、botにメンションしたメッセージを受け取って、受信したメッセージと受信したメッセージのID、チャネル名、チャネルのトピックを返すアプリです。

## 機能

- メッセージ内の `@ai_deepseek`, `@ai_qwen` のメンションを検出
- メンションが含まれるメッセージに対して自動応答
- 元のメッセージ内容とメッセージIDを含む応答メッセージを送信
- チャネル名とチャネルのトピック（説明）を含む応答メッセージを送信
- 無限ループを防ぐためのアプリユーザー検出機能

## 動作例

ユーザーが以下のようなメッセージを送信した場合：
```
@ai_deepseek こんにちは、助けてください
```

アプリは以下のような応答を返します：
```
🤖 Bot mentioned! Received message: "@ai_deepseek こんにちは、助けてください" with ID: xyz123
Channel: general
Topic: 一般的な議論のためのチャネル
```

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. プロジェクトをビルド:
```bash
npm run build
```

3. RocketChatサーバーにデプロイ:
```bash
npm start
```

## ファイル構造

- `app.json` - アプリの設定ファイル
- `AiBotApp.ts` - メインのアプリケーションクラス
- `package.json` - プロジェクトの依存関係
- `tsconfig.json` - TypeScript設定

## 対応する@メンション

以下のパターンでbot メンションを検出します：
- `@ai_deepseek`
- `@ai_qwen`

これらのメンションは単語境界で区切られている必要があり、メールアドレスや他の文字列の一部では反応しません。
