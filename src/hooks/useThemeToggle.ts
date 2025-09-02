// useThemeToggle.ts
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const useThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return { isDark: false, toggle: () => {} };

    const isDark = theme === 'dark';
    const toggle = () => setTheme(isDark ? 'light' : 'dark');

    return { isDark, toggle };
};
