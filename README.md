# RocketChat AI Bot App

RocketChat アプリケーションで、botにメンションしたメッセージを受け取って、受信したメッセージと受信したメッセージのID、チャネル名、チャネルのトピックを返すアプリです。

また、環境変数が設定されている場合、GitLab CIパイプラインをトリガーする機能も含まれています。

## 機能

- メッセージ内の `@ai_deepseek`, `@ai_qwen` のメンションを検出
- メンションが含まれるメッセージに対して自動応答
- 元のメッセージ内容とメッセージIDを含む応答メッセージを送信
- チャネル名とチャネルのトピック（説明）を含む応答メッセージを送信
- 無限ループを防ぐためのアプリユーザー検出機能
- **NEW**: GitLab CE パイプライントリガー機能

## GitLab パイプライントリガー機能

環境変数 `GITLAB_PIPELINE_TRIGGER` が `true` に設定されている場合、メンションを受信した際に自動的にGitLab CIパイプラインをトリガーします。

### 必要な環境変数

- `GITLAB_PIPELINE_TRIGGER`: "true" に設定するとパイプライントリガー機能を有効化
- `GITLAB_PIPELINE_TRIGGER_PROJECT_ID`: GitLabプロジェクトID
- `GITLAB_PIPELINE_TRIGGER_TOKEN`: パイプライントリガートークン
- `GITLAB_PIPELINE_TRIGGER_REF`: トリガーするブランチまたはref (例: "main")
- `GITLAB_PIPELINE_TRIGGER_URL`: GitLabインスタンスのURL (例: "https://gitlab.example.com")

### GitLab CI に渡されるデータ

パイプラインがトリガーされる際、以下のデータが環境変数としてGitLab CIジョブで利用可能になります：

- `ROCKETCHAT_MESSAGE`: 受信したメッセージの内容
- `ROCKETCHAT_CHANNEL_NAME`: チャネル名
- `ROCKETCHAT_TOPIC`: チャネルのトピック
- `ROCKETCHAT_BOT_NAME`: メンションされたbot名 (ai_deepseek または ai_qwen)
- `ROCKETCHAT_MESSAGE_ID`: メッセージID
- `ROCKETCHAT_SENDER`: メッセージを送信したユーザー名

### GitLab API エンドポイント

`{GITLAB_PIPELINE_TRIGGER_URL}/api/v4/projects/{GITLAB_PIPELINE_TRIGGER_PROJECT_ID}/trigger/pipeline`

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

同時に、GitLab パイプライントリガー機能が有効な場合、設定されたGitLabプロジェクトのパイプラインがトリガーされます。

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. プロジェクトをパッケージ:
```bash
npm run package
```

3. RocketChatサーバーにデプロイ:
```bash
npm run deploy
```

## ファイル構造

- `app.json` - アプリの設定ファイル
- `AiBotApp.js` - メインのアプリケーションクラス
- `package.json` - プロジェクトの依存関係

## 対応する@メンション

以下のパターンでbot メンションを検出します：
- `@ai_deepseek`
- `@ai_qwen`

これらのメンションは単語境界で区切られている必要があり、メールアドレスや他の文字列の一部では反応しません。
