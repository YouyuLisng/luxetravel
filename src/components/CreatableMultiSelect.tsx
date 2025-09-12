// components/CreatableMultiSelect.tsx
'use client';
import React from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import type { MultiValue } from 'react-select';

type Option = { label: string; value: string };

interface Props {
    value: string[];
    onChange: (value: string[]) => void;
    options: Option[];
    placeholder?: string;
    instanceId?: string; // 建議保留，避免 hydration mismatch
    creatable?: boolean; // ⬅️ 新增參數，決定是否能手動新增
}

export default function CreatableMultiSelect({
    value,
    onChange,
    options,
    placeholder = '請選擇或輸入',
    instanceId = 'creatable-multi',
    creatable = true, // 預設允許新增
}: Props) {
    // ① 建立 value -> option 的映射
    const byValue = React.useMemo(
        () => new Map(options.map((o) => [o.value, o] as const)),
        [options]
    );

    // ② 把外部的 string[] 轉成 Option[]
    const selectedOptions = React.useMemo<Option[]>(
        () =>
            value.map(
                (v) => byValue.get(v) ?? ({ value: v, label: v } as Option)
            ),
        [value, byValue]
    );

    // ③ 合併 options，確保能顯示選中的但不在 options 裡的值
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

    // ④ 根據 creatable 選擇不同的元件
    const Component = creatable ? CreatableSelect : Select;

    return (
        <Component
            isMulti
            options={allOptions}
            value={selectedOptions}
            onChange={handleChange}
            placeholder={placeholder}
            instanceId={instanceId}
            formatCreateLabel={(inputValue: string) => `建立 "${inputValue}"`}
        />
    );
}
