// components/CreatableMultiSelect.tsx
'use client';
import React from 'react';
import CreatableSelect from 'react-select/creatable';
import type { MultiValue } from 'react-select';

type Option = { label: string; value: string };

interface Props {
    value: string[];
    onChange: (value: string[]) => void;
    options: Option[];
    placeholder?: string;
    instanceId?: string; // 建議保留，避免 hydration mismatch
}

export default function CreatableMultiSelect({
    value,
    onChange,
    options,
    placeholder = '請選擇或輸入',
    instanceId = 'creatable-multi',
}: Props) {
    // ① 用 options 建映射：value -> option
    const byValue = React.useMemo(
        () => new Map(options.map((o) => [o.value, o] as const)),
        [options]
    );

    // ② 把外部的 string[] 轉成 react-select 需要的 Option[]（優先用國家名稱 label）
    const selectedOptions = React.useMemo<Option[]>(
        () =>
            value.map(
                (v) => byValue.get(v) ?? ({ value: v, label: v } as Option)
            ),
        [value, byValue]
    );

    // ③ 合併 options，確保「目前選中的但不在 options 裡的值」也能顯示
    const allOptions = React.useMemo(
        () => [
            ...options,
            ...selectedOptions.filter((opt) => !byValue.has(opt.value)),
        ],
        [options, selectedOptions, byValue]
    );

    const handleChange = (selected: MultiValue<Option>) => {
        onChange(selected.map((opt) => opt.value));
    };

    return (
        <CreatableSelect
            isMulti
            options={allOptions}
            value={selectedOptions}
            onChange={handleChange}
            placeholder={placeholder}
            instanceId={instanceId}
            formatCreateLabel={(inputValue) => `建立 "${inputValue}"`}
        />
    );
}
