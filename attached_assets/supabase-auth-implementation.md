# Next.js 14 + Supabase 認証実装ガイド

## 目次
1. [プロジェクト構成](#1-プロジェクト構成)
2. [環境設定](#2-環境設定)
3. [認証フロー実装](#3-認証フロー実装)
4. [セキュリティ設定](#4-セキュリティ設定)
5. [注意点とベストプラクティス](#5-注意点とベストプラクティス)
6. [トラブルシューティング](#6-トラブルシューティング)

## 1. プロジェクト構成

```
src/
├── app/                    
│   ├── auth/              # 認証関連ページ
│   │   ├── login/        # ログインページ
│   │   │   └── page.tsx
│   │   ├── register/     # 登録ページ
│   │   │   └── page.tsx
│   │   ├── verify/       # メール確認ページ
│   │   │   └── page.tsx
│   │   └── page.tsx      # 認証ルートページ（リダイレクト用）
│   └── layout.tsx
├── components/           
│   └── auth/             # 認証関連コンポーネント
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
└── lib/
    └── supabase/         # Supabase関連
        └── client.ts
```

## 2. 環境設定

### 2.1 必要な依存関係
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.48.0",
    "next": "14.0.3",
    "react": "^18",
    "react-dom": "^18",
    "@hookform/resolvers": "latest",
    "react-hook-form": "latest",
    "zod": "latest"
  }
}
```

### 2.2 環境変数の設定
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2.3 Supabaseクライアントの設定
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 3. 認証フロー実装

### 3.1 新規登録フォーム
```typescript
// components/auth/RegisterForm.tsx
const registerSchema = z.object({
  username: z
    .string()
    .min(2, "ユーザー名は2文字以上である必要があります")
    .max(50, "ユーザー名は50文字以下である必要があります"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上である必要があります")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "パスワードには少なくとも1つの小文字、大文字、数字が必要です"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
})

// 登録処理
async function onSubmit(values: RegisterValues) {
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          username: values.username,
        },
      },
    })

    if (signUpError) throw signUpError

    // ユーザープロフィールの作成
    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          user_id: signUpData.user.id,
          email: values.email,
          username: values.username,
        })

      if (profileError) throw profileError
    }

    // 確認ページへリダイレクト
    const baseUrl = window.location.origin
    window.location.href = `${baseUrl}/auth/verify`
  } catch (error) {
    // エラー処理
  }
}
```

### 3.2 ログインフォーム
```typescript
// components/auth/LoginForm.tsx
const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
})

async function onSubmit(values: LoginValues) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) throw error

    // ダッシュボードへリダイレクト
    router.push('/dashboard')
  } catch (error) {
    // エラー処理
  }
}
```

### 3.3 メール確認ページ
```typescript
// app/auth/verify/page.tsx
export default function VerifyPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="flex flex-col space-y-6 text-center">
            <Icons.mail className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              メールを確認してください
            </h1>
            <p className="text-sm text-muted-foreground">
              登録したメールアドレスに確認メールを送信しました。
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/auth/login')}
            >
              ログインページへ戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 4. セキュリティ設定

### 4.1 Content Security Policy
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDevelopment
              ? '' // 開発環境ではCSPを無効化
              : `
                default-src 'self' https://*.supabase.co;
                script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co;
                style-src 'self' 'unsafe-inline';
                connect-src 'self' https://*.supabase.co wss://*.supabase.co;
                frame-src 'self' https://*.supabase.co;
                // ... その他必要なCSP設定
              `
          }
        ]
      }
    ];
  }
};
```

## 5. 注意点とベストプラクティス

1. **ディレクトリ構造**
   - App Routerの場合、認証関連ページは `app/auth/` 配下に配置
   - コンポーネントは `components/auth/` に配置
   - Supabase関連の設定は `lib/supabase/` に集約

2. **エラーハンドリング**
   - Supabaseのエラーは適切にキャッチして表示
   - ユーザーフレンドリーなエラーメッセージを提供
   - デバッグ用にコンソールログを残す

3. **セキュリティ**
   - 環境変数は適切に管理
   - CSPは開発環境と本番環境で適切に設定
   - パスワードのバリデーションは十分に厳格に

4. **UX考慮点**
   - ローディング状態の表示
   - 適切なフィードバックメッセージ
   - スムーズな画面遷移

5. **開発環境での注意点**
   - ポート番号の違いによるリダイレクト問題に注意
   - CSPによるリソース制限に注意
   - 開発サーバー再起動時のクリーンビルド

## 6. トラブルシューティング

1. **404エラー（リソースが見つからない）**
   - ポート番号の不一致を確認
   - `.next` ディレクトリを削除して再ビルド

2. **CSPエラー**
   - 開発環境ではCSPを緩和
   - 必要なドメインをCSPに追加

3. **MIME Typeエラー**
   - `next.config.js` の設定を確認
   - キャッシュをクリアして再起動

4. **認証エラー**
   - Supabase設定の確認
   - 環境変数の設定確認
   - ネットワーク接続の確認

## 7. 参考リンク

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Supabase 認証ドキュメント](https://supabase.com/docs/guides/auth)
- [shadcn/ui コンポーネント](https://ui.shadcn.com/)
- [Zod バリデーション](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/) 