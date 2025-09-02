// app/api/todos/route.ts
import { NextResponse } from 'next/server';

const todos = [
    { id: 1, title: '學會 React Query', completed: false },
    { id: 2, title: '完成 Todo 練習', completed: true },
];

export async function GET() {
    return NextResponse.json(todos);
}

export async function POST(req: Request) {
    const body = await req.json();
    const newTodo = {
        id: Date.now(),
        title: body.title || '',
        completed: false,
    };
    todos.unshift(newTodo);
    return NextResponse.json(newTodo, { status: 201 });
}
