# RocketChat AI Bot App

RocketChat アプリケーションで、botにメンションしたメッセージを受け取って、受信したメッセージと受信したメッセージのID、チャネル名、チャネルのトピックを返すアプリです。

このアプリは**TypeScript**で開発されており、RocketChatの推奨開発言語に準拠しています。

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

## ビルドとデプロイ

このアプリのビルドには、通常の `npm run build` は利用せず、RocketChat Apps CLI の `rc-apps package` と `rc-apps deploy` を利用します。

### Podmanコンテナを使用したビルド

Node.js v22.18.0と組み込みnpmを使用した自動化されたビルド環境を提供しています。

#### Podman単体での使用:
```bash
# イメージをビルド
podman build -f container/Dockerfile -t rocketchat-ai-app-builder .

# ビルドを実行してアーティファクトを取得
podman run --rm -v $(pwd):/output rocketchat-ai-app-builder sh -c "cp -r /app/dist/* /output/"
```

#### Podman Composeでの使用:
```bash
cd container
podman-compose up --build
```

詳細は[container/README.md](container/README.md)を参照してください。

### GitHub Actionsでの自動ビルド

このリポジトリでは、プッシュやプルリクエスト時に自動的にコンテナでビルドが実行されます。ビルド成果物はGitHub ActionsのArtifactとしてダウンロード可能です。

### 利用可能なコマンド

#### 直接RocketChat Apps CLIを使用:
- `rc-apps package` または `npx @rocket.chat/apps-cli package` - アプリをパッケージ化（ビルドとパッケージを同時実行）
- `rc-apps deploy` または `npx @rocket.chat/apps-cli deploy` - RocketChatサーバーにデプロイ
- `rc-apps watch` または `npx @rocket.chat/apps-cli watch` - ファイル変更を監視して自動再デプロイ

#### npm scriptsを使用:
- `npm run build` - アプリをパッケージ化
- `npm run deploy` - RocketChatサーバーにデプロイ
- `npm run start` - アプリを起動

## セットアップ

### オプション1: RocketChat Apps CLI をグローバルインストール

1. RocketChat Apps CLI をグローバルインストール:
```bash
npm install -g @rocket.chat/apps-cli
```

2. 依存関係をインストール:
```bash
npm install
```

3. アプリをパッケージ化:
```bash
rc-apps package
```

4. RocketChatサーバーにデプロイ:
```bash
rc-apps deploy
```

### オプション2: npxを使用（推奨）

1. 依存関係をインストール:
```bash
npm install
```

2. アプリをパッケージ化:
```bash
npm run build
```
または
```bash
npx @rocket.chat/apps-cli package
```

3. RocketChatサーバーにデプロイ:
```bash
npm run deploy
```
または
```bash
npx @rocket.chat/apps-cli deploy
```

## ファイル構造

- `app.json` - アプリの設定ファイル
- `AiBotApp.ts` - メインのアプリケーションクラス（TypeScript）
- `package.json` - プロジェクトの依存関係
- `tsconfig.json` - TypeScript設定ファイル

## 開発

このアプリはTypeScriptで開発されています。コードを変更した後は、アプリをパッケージ化してデプロイしてください：

```bash
npm run build
```
または
```bash
rc-apps package
```

TypeScriptのコンパイルと型チェックは、パッケージ化時に自動的に行われます。

## 対応する@メンション

以下のパターンでbot メンションを検出します：
- `@ai_deepseek`
- `@ai_qwen`

これらのメンションは単語境界で区切られている必要があり、メールアドレスや他の文字列の一部では反応しません。
