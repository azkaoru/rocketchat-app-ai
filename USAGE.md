# AI Bot App Usage Examples

## 動作サンプル (Usage Examples)

以下は、このRocketChatアプリがどのように動作するかの例です：

### 1. 基本的なbot メンション
**ユーザーの入力:**
```
@bot こんにちは！今日の天気はどうですか？
```

**アプリの応答:**
```
🤖 Bot mentioned! Received message: "@bot こんにちは！今日の天気はどうですか？" with ID: msg_123456789
```

### 2. AI アシスタントのメンション
**ユーザーの入力:**
```
@ai このプロジェクトの詳細を教えて
```

**アプリの応答:**
```
🤖 Bot mentioned! Received message: "@ai このプロジェクトの詳細を教えて" with ID: msg_987654321
```

### 3. アシスタントのメンション
**ユーザーの入力:**
```
@assistant ファイルをアップロードする方法は？
```

**アプリの応答:**
```
🤖 Bot mentioned! Received message: "@assistant ファイルをアップロードする方法は？" with ID: msg_456789123
```

### 4. 反応しない例
以下のようなメッセージには反応しません：

```
私のメールアドレスは test@bot.com です
@botuser さんはどこにいますか？
@ai-helper を呼んでください
```

これらは正確な `@bot`, `@ai`, `@assistant` のメンションではないため、アプリは反応しません。

## デプロイ方法

1. RocketChatサーバーの管理者権限でログイン
2. アプリをビルド: `npm run build`
3. アプリをパッケージ化: `npm run package`
4. RocketChat管理画面からアプリをアップロード
5. アプリを有効化

または、環境変数を設定してコマンドラインからデプロイ：
```bash
export ROCKETCHAT_URL="https://your-rocketchat-server.com"
export ROCKETCHAT_USERNAME="admin"
export ROCKETCHAT_PASSWORD="your-password"
npm run deploy
```