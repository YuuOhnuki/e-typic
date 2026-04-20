import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'ログインしてください' },
                { status: 401 },
            );
        }

        // next-authはJWT戦略を使用しているため、
        // クライアント側でセッションクッキーを削除するだけで充分です
        // サーバー側でやることは特にありません

        return NextResponse.json(
            { message: 'ログアウトしました' },
            { status: 200 },
        );
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 },
        );
    }
}
