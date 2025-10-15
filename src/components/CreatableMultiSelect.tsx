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
    instanceId?: string;
    creatable?: boolean;
}

export default function CreatableMultiSelect({
    value,
    onChange,
    options,
    placeholder = '請選擇或輸入',
    instanceId = 'creatable-multi',
    creatable = true,
}: Props) {
    const byValue = React.useMemo(
        () => new Map(options.map((o) => [o.value, o] as const)),
        [options]
    );

    const selectedOptions = React.useMemo<Option[]>(
        () =>
            value.map(
                (v) => byValue.get(v) ?? ({ value: v, label: v } as Option)
            ),
        [value, byValue]
    );

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
            menuPortalTarget={
                typeof window !== 'undefined' ? document.body : null
            }
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
        />
    );
}
