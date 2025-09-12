'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhTwLocale from '@fullcalendar/core/locales/zh-tw';
import type { EventContentArg } from '@fullcalendar/core';

export type CalendarEvent = {
    id: string;
    title: string;
    start: string | Date;
    price?: string ; 
};

type Props = {
    events: CalendarEvent[];
    onDateClick?: (dateStr: string) => void;
    onEventClick?: (eventId: string) => void;
};

export default function Calendar({ events, onDateClick, onEventClick }: Props) {
    return (
        <div className="rounded-lg border bg-white p-4 shadow">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                events={events}
                dateClick={(info) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const clicked = new Date(info.date);
                    clicked.setHours(0, 0, 0, 0);

                    if (clicked < today) {
                        return;
                    }

                    onDateClick?.(info.dateStr);
                }}
                eventClick={(info) => onEventClick?.(info.event.id)}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '',
                }}
                buttonText={{
                    today: '今天',
                    month: '月',
                    week: '週',
                    day: '日',
                }}
                locale={zhTwLocale}
                eventContent={(arg: EventContentArg) => {
                    const price = arg.event.extendedProps['price'] as
                        | number
                        | undefined;
                    return (
                        <div className="text-xs leading-tight flex items-center gap-1">
                            <span className="font-semibold">
                                {arg.event.title}
                            </span>
                            {price && (
                                <span className="text-green-600">
                                    NT$ {price.toLocaleString()}
                                </span>
                            )}
                        </div>
                    );
                }}
            />
        </div>
    );
}
