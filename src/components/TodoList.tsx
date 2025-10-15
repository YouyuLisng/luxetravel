'use client';

import { useTodos } from '@/features/todo/hooks/useTodos';
import { useCreateTodo } from '@/features/todo/hooks/useCreateTodo';
import { useState } from 'react';

export default function TodoList() {
    const { data: todos, isLoading } = useTodos();
    const createTodo = useCreateTodo();
    const [text, setText] = useState('');

    if (isLoading) return <p>載入中...</p>;

    return (
        <div className="space-y-2">
            <ul>
                {todos.map((todo: any) => (
                    <li key={todo.id} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            readOnly
                        />
                        <span>{todo.title}</span>
                    </li>
                ))}
            </ul>

            <div className="flex gap-2">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="border px-2 py-1"
                />
                <button
                    onClick={() => {
                        createTodo.mutate({ title: text });
                        setText('');
                    }}
                    className="bg-blue-500 text-white px-3 py-1"
                >
                    新增
                </button>
            </div>
        </div>
    );
}
