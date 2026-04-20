'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';

interface AuthFormProps {
    onCancel?: () => void;
    onSwitchToSignUp?: () => void;
    onSwitchToSignIn?: () => void;
}

export const SignUpForm: React.FC<AuthFormProps> = ({ onCancel, onSwitchToSignIn }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'サインアップに失敗しました');
            }

            // サインアップ成功後、自動的にログイン
            const signInResult = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (signInResult?.ok) {
                onCancel?.();
            } else {
                setError('ログインに失敗しました');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">サインアップ</h1>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:text-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">メールアドレス</label>
                    <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">ユーザー名</label>
                    <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="ユーザー名"
                        minLength={2}
                        maxLength={20}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">パスワード</label>
                    <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="6文字以上"
                        minLength={6}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">パスワード（確認）</label>
                    <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="パスワードを再入力"
                        minLength={6}
                        required
                        disabled={isLoading}
                    />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'サインアップ中...' : 'サインアップ'}
                </Button>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        または{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignIn}
                            className="text-primary hover:underline font-medium"
                        >
                            ログイン
                        </button>
                    </p>
                </div>
            </form>
        </Card>
    );
};

export const SignInForm: React.FC<AuthFormProps> = ({ onCancel, onSwitchToSignUp }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error('メールアドレスまたはパスワードが正しくありません');
            }

            onCancel?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ログインに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">ログイン</h1>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:text-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">メールアドレス</label>
                    <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">パスワード</label>
                    <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="パスワード"
                        required
                        disabled={isLoading}
                    />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'ログイン中...' : 'ログイン'}
                </Button>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        または{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignUp}
                            className="text-primary hover:underline font-medium"
                        >
                            アカウントを作成
                        </button>
                    </p>
                </div>
            </form>
        </Card>
    );
};
