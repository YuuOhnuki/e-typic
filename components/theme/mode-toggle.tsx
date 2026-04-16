'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ModeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === 'dark';

    const handleToggle = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <div className="fixed z-50 pointer-events-auto top-[max(env(safe-area-inset-top),1rem)] right-[max(env(safe-area-inset-right),1rem)]">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleToggle}
                className="relative h-10 w-10 rounded-full border-border/80 bg-background/90 shadow-sm backdrop-blur"
                aria-label={isDark ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え'}
                title={isDark ? 'ライトテーマ' : 'ダークテーマ'}
            >
                <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">テーマ切替</span>
            </Button>
        </div>
    );
}
