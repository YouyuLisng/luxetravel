import Select, { MultiValue, ActionMeta } from 'react-select';

type Option = { label: string; value: string };

interface MultiSelectProps {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    [key: string]: any;
}

export default function MultiSelect({
    options,
    value,
    onChange,
    ...props
}: MultiSelectProps) {
    return (
        <Select
            options={options}
            placeholder="請選擇"
            isMulti
            value={options.filter((opt) => value.includes(opt.value))}
            onChange={(
                selected: MultiValue<Option>,
                _actionMeta: ActionMeta<Option>
            ) => {
                onChange(Array.from(selected).map((opt) => opt.value));
            }}
            {...props}
        />
    );
}
