# RocketChat AI Bot App

RocketChat アプリケーションで、botにメンションしたメッセージを受け取って、GitLab issueを作成するアプリです。

このアプリは**TypeScript**で開発されており、RocketChatの推奨開発言語に準拠しています。

## 機能

- メッセージ内の `@ai_deepseek`, `@ai_qwen` のメンションを検出
- メンションが含まれるメッセージからGitLab issueを自動作成
- 無限ループを防ぐためのアプリユーザー検出機能

## GitLab Issue作成機能

RocketChatアプリの設定で有効化すると、botメンションを受信した際に自動的にGitLab issueを作成します。

### 必要な設定

RocketChatの管理画面のアプリ設定で以下を設定してください：

- `Enable GitLab Issue Creation`: issue作成機能を有効化
- `GitLab Project ID for Issues`: GitLabプロジェクトID
- `GitLab Access Token`: GitLab APIアクセストークン
- `GitLab URL for Issues`: GitLabインスタンスのURL (例: "https://gitlab.example.com")

Gitlabのアクセストークンはプロジェクトアクセストークンで必要なscopeはapiのみ（いつか設定ができるが、画面の一番にあるやつ）で、Mainterロールで動作確認した。

トークンを作成するユーザは、root(Admin)でログインして作成した。


### 作成されるGitLab Issue

- **タイトル**: `【{チャネルトピック}/{チャネル名}/bot-created from {botの名前}】`
- **説明**: メンションを含むメッセージの内容
- **ラベル**: `issue-tag-{チャネル名}`,`issue-tag-desc-{チャネルDescription}`
- **アサイン**: メンションされたbot名（GitLab APIでユーザIDを動的に取得）

### GitLab API エンドポイント

`{GitLab URL}/api/v4/projects/{Project ID}/issues`

## 動作例

ユーザーが以下のようなメッセージを送信した場合：
```
@ai_deepseek こんにちは、助けてください
```

GitLab issue作成機能が有効な場合、設定されたGitLabプロジェクトにissueが作成され、issue URLがチャットに返信されます。

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
- `GitlabCreateIssueApp.ts` - メインのアプリケーションクラス（TypeScript）
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
