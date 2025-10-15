'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';

/** ✅ 只將數字轉成全形，標點符號保留半形 */
function toFullWidth(str: string) {
    return str.replace(/[0-9]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) + 0xfee0)
    );
}

export type TextareaInputProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaInput = React.forwardRef<
    HTMLTextAreaElement,
    TextareaInputProps
>(({ onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.value = toFullWidth(e.target.value);

        if (onChange) onChange(e);
    };

    return <Textarea ref={ref} onChange={handleChange} {...props} />;
});

TextareaInput.displayName = 'TextareaInput';
