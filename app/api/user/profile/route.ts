import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDbClient, ensureDbSchema } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'ログインしてください' },
                { status: 401 },
            );
        }

        await ensureDbSchema();
        const db = getDbClient();

        const result = await db.execute({
            sql: 'SELECT id, email, username, avatar, lv FROM users WHERE id = ?',
            args: [session.user.id],
        });

        const user = result.rows[0];

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりません' },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar || '',
                lv: Number(user.lv ?? 1),
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'ログインしてください' },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { username, avatar, currentPassword, newPassword } = body;

        await ensureDbSchema();
        const db = getDbClient();

        // ユーザーの現在のデータを取得
        const userResult = await db.execute({
            sql: 'SELECT id, username, password_hash FROM users WHERE id = ?',
            args: [session.user.id],
        });

        const user = userResult.rows[0];
        if (!user) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりません' },
                { status: 404 },
            );
        }

        // ユーザー名を更新する場合
        if (username && username !== user.username) {
            // 重複チェック
            const existingUsername = await db.execute({
                sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
                args: [username, session.user.id],
            });

            if (existingUsername.rows.length > 0) {
                return NextResponse.json(
                    { error: 'このユーザー名は既に使用されています' },
                    { status: 400 },
                );
            }

            if (username.length < 2 || username.length > 20) {
                return NextResponse.json(
                    { error: 'ユーザー名は2～20文字である必要があります' },
                    { status: 400 },
                );
            }
        }

        // パスワードを更新する場合
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: '現在のパスワードを入力してください' },
                    { status: 400 },
                );
            }

            const passwordMatch = await bcrypt.compare(
                currentPassword,
                user.password_hash as string,
            );

            if (!passwordMatch) {
                return NextResponse.json(
                    { error: '現在のパスワードが正しくありません' },
                    { status: 400 },
                );
            }

            if (newPassword.length < 6) {
                return NextResponse.json(
                    { error: 'パスワードは6文字以上である必要があります' },
                    { status: 400 },
                );
            }
        }

        // 更新を実行
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (username && username !== user.username) {
            updates.push('username = ?');
            args.push(username as string);
        }

        if (avatar !== undefined) {
            updates.push('avatar = ?');
            args.push(avatar as string);
        }

        if (newPassword) {
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            updates.push('password_hash = ?');
            args.push(newPasswordHash);
        }

        updates.push('updated_at = ?');
        args.push(Math.floor(Date.now() / 1000));
        args.push(session.user.id);

        if (updates.length > 1) {
            await db.execute({
                sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                args,
            });
        }

        return NextResponse.json(
            {
                message: 'プロフィールが更新されました',
                user: {
                    id: session.user.id,
                    username: username || user.username,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 },
        );
    }
}
