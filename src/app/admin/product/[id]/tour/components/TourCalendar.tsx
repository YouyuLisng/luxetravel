'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar, { CalendarEvent } from '@/components/Calendar';
import { Button } from '@/components/ui/button';

export default function TourCalendar({
    productId,
    productName,
    initialEvents,
}: {
    productId: string;
    productName: string;
    initialEvents: CalendarEvent[];
}) {
    const [events, setEvents] = useState(initialEvents);
    const router = useRouter();

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">
                    {productName} - 出發日曆
                </h1>
                <Button onClick={() => console.log('批次新增')}>
                    新增多梯次
                </Button>
            </div>

            <Calendar
                events={events}
                onDateClick={(date) => {
                    console.log('👉 點擊日期:', date);
                    router.push(`/admin/product/${productId}/wizard?departDate=${date}`);
                }}
                onEventClick={(id) => {
                    console.log('👉 點擊事件 ID:', id);
                    // TODO: 之後開啟 Dialog 編輯梯次
                }}
            />
        </div>
    );
}
