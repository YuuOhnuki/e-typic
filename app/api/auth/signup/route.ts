import { NextRequest, NextResponse } from 'next/server';
import { getDbClient, ensureDbSchema } from '@/lib/db/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, username, password, confirmPassword } = body;

        // バリデーション
        if (!email || !username || !password || !confirmPassword) {
            return NextResponse.json(
                { error: '全てのフィールドが必須です' },
                { status: 400 },
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'パスワードが一致しません' },
                { status: 400 },
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'パスワードは6文字以上である必要があります' },
                { status: 400 },
            );
        }

        if (username.length < 2 || username.length > 20) {
            return NextResponse.json(
                { error: 'ユーザー名は2～20文字である必要があります' },
                { status: 400 },
            );
        }

        await ensureDbSchema();
        const db = getDbClient();

        // メール重複チェック
        const existingEmail = await db.execute({
            sql: 'SELECT id FROM users WHERE email = ?',
            args: [email],
        });

        if (existingEmail.rows.length > 0) {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 400 },
            );
        }

        // ユーザー名重複チェック
        const existingUsername = await db.execute({
            sql: 'SELECT id FROM users WHERE username = ?',
            args: [username],
        });

        if (existingUsername.rows.length > 0) {
            return NextResponse.json(
                { error: 'このユーザー名は既に使用されています' },
                { status: 400 },
            );
        }

        // パスワードをハッシュ化
        const passwordHash = await bcrypt.hash(password, 10);

        // ユーザーを作成
        const userId = crypto.randomUUID();
        await db.execute({
            sql: `
                INSERT INTO users (id, email, username, password_hash)
                VALUES (?, ?, ?, ?)
            `,
            args: [userId, email, username, passwordHash],
        });

        return NextResponse.json(
            {
                message: 'ユーザーが正常に作成されました',
                user: {
                    id: userId,
                    email,
                    username,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 },
        );
    }
}
