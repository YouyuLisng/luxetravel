'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    addMonths,
    addDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDay,
    isSameDay,
    isSameMonth,
    startOfMonth,
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Holidays from 'date-holidays';

// ============================= Types =============================
export type TourStatus = 'open' | 'soldout' | 'almost';
export type CalendarEvent = {
    date: string; // yyyy-MM-dd
    price?: number;
    status?: TourStatus;
    label?: string;
};

export type ApiSchedule = {
    LEAV_DT: string;
    DicAirPortNm: string;
    PACK_FG: boolean;
    GRUP_CD: string;
    GRUP_NM: string;
    GRUP_SNM: string;
    TVL_AREA: string;
    MGRUP_CD: string;
    ORDER_DL: string;
    Hotel: boolean;
    Airplane: boolean;
    ProductSchPA: number;
    ProductSchPAAGT: number;
    ProductSchQA: number;
    ProductSchQSurplus: number;
    ProductSchQPay: number;
    ProductSchQSum: number;
    ProductSchQW: number;
    ProductSchStatus: string;
    GRUP_TP: string;
    GRUP_TPo: string;
    GroupGO: boolean;
    DicAirPortCode: string;
    ProductNmSuf: string;
    ProductNmSufG: string;
    AIRLINENm: string;
    HOT_TP: string;
    JOIN_FG: string;
    DONE_YQT: number;
};

// ===================== Helpers / Hooks =====================
function useIsMobile(breakpoint = 820) {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [breakpoint]);
    return isMobile;
}

// ---- 名稱正規化規則 ----
type HolidayAliasRule = { from: (string | RegExp)[]; to: string };

const HOLIDAY_ALIASES: HolidayAliasRule[] = [
    { from: [ '中華民國開國紀念日 / 元旦', ], to: '元旦' },
    { from: ['國慶日 / 雙十節'], to: '國慶日' },
    { from: ['農曆除夕'], to: '除夕' },
    { from: ['農曆年初一'], to: '初一' },
    { from: ['農曆年初二'], to: '初二' },
    { from: ['農曆年初三'], to: '初三' },
    { from: ['農曆年初四'], to: '初四' },
    { from: ['228和平紀念日'], to: '228' },
];

const HOLIDAY_HIDE: (string | RegExp)[] = ['农历新年假期', '兒童節'];

const shouldHideHoliday = (labelRaw: string) =>
    HOLIDAY_HIDE.some((p) =>
        typeof p === 'string'
            ? labelRaw.includes(p)
            : (p as RegExp).test(labelRaw)
    );

function normalizeObservedSuffix(label: string) {
    return label.replace(/\s*[\(（]更换日[\)）]/g, ' (補假)');
}

function normalizeHolidayLabel(labelRaw: string, rules = HOLIDAY_ALIASES) {
    const label = labelRaw;
    for (const rule of rules) {
        for (const p of rule.from) {
            const hit =
                typeof p === 'string'
                    ? label.includes(p)
                    : (p as RegExp).test(label);
            if (hit) return rule.to;
        }
    }
    return normalizeObservedSuffix(label);
}

// 自動節日（只取 public）
function useHolidays({
    country = 'TW',
    years = [],
    types = ['public'] as string[],
}: {
    country?: string;
    years: number[];
    types?: string[];
}) {
    const [map, setMap] = useState<Record<string, string>>({});
    useEffect(() => {
        if (!years.length) return;
        try {
            const hd = new Holidays(country);
            const out: Record<string, string> = {};
            years.forEach((y) => {
                const list = hd.getHolidays(y) as any[];
                const grouped: Record<string, any[]> = {};
                list.forEach((h) => {
                    if (!types.includes(h.type)) return;
                    const key = format(new Date(h.date), 'yyyy-MM-dd');
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(h);
                });

                Object.entries(grouped).forEach(([dateKey, holidays]) => {
                    const candidates = holidays.filter((h) => {
                        const raw = (h.localName || h.name || '').toString();
                        return !shouldHideHoliday(raw);
                    });
                    if (candidates.length === 0) return;

                    const preferred = candidates.find((h) => {
                        const raw = (h.localName || h.name || '').toString();
                        const norm = normalizeHolidayLabel(raw);
                        return norm === '國慶日' || norm === '元旦';
                    });

                    const chosen = preferred || candidates[0];
                    const labelRaw = (
                        chosen.localName ||
                        chosen.name ||
                        ''
                    ).toString();
                    const label = normalizeHolidayLabel(labelRaw);
                    if (label) out[dateKey] = label;
                });
            });
            setMap(out);
        } catch (e) {
            console.error('holiday load error', e);
            setMap({});
        }
    }, [country, JSON.stringify(years), JSON.stringify(types)]);
    return map;
}

function reduceApiToEvents(list: ApiSchedule[]): CalendarEvent[] {
    const rank: Record<TourStatus, number> = { soldout: 3, almost: 2, open: 1 };
    const map = new Map<string, CalendarEvent>();

    list.forEach((it) => {
        const date = format(new Date(it.LEAV_DT), 'yyyy-MM-dd');
        const remain = Number(it.ProductSchQSurplus ?? 0);
        const total = Number(it.ProductSchQA ?? 0) || 1;
        let status: TourStatus = 'open';
        if (remain <= 0) status = 'soldout';
        else if (remain <= 10 || remain / total <= 0.2) status = 'almost';

        const current = map.get(date);
        const next: CalendarEvent = {
            date,
            price: Number(it.ProductSchPA) || undefined,
            status,
        };

        if (!current) {
            map.set(date, next);
        } else {
            const betterPrice = Math.min(
                current.price ?? Infinity,
                next.price ?? Infinity
            );
            const betterStatus =
                rank[next.status ?? 'open'] > rank[current.status ?? 'open']
                    ? next.status
                    : current.status;
            map.set(date, {
                date,
                price: Number.isFinite(betterPrice) ? betterPrice : undefined,
                status: betterStatus,
            });
        }
    });

    return Array.from(map.values());
}

// ============================= Component =============================
export default function TurkeyTourCalendar({
    apiUrl,
    initialData,
    badges = {},
    holidayCountry = 'TW',
}: {
    apiUrl?: string;
    initialData?: ApiSchedule[];
    badges?: Record<string, number[]>;
    holidayCountry?: string;
}) {
    const [baseMonth, setBaseMonth] = useState(new Date(2025, 9, 1));
    const isMobile = useIsMobile();

    const [apiList, setApiList] = useState<ApiSchedule[] | undefined>(
        initialData
    );
    useEffect(() => {
        if (!apiUrl) return;
        let abort = false;
        (async () => {
            try {
                const res = await fetch(apiUrl, { cache: 'no-store' });
                const data = await res.json();
                if (!abort) setApiList(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('calendar api fetch failed', e);
                if (!abort) setApiList([]);
            }
        })();
        return () => {
            abort = true;
        };
    }, [apiUrl]);

    const events = useMemo(() => reduceApiToEvents(apiList ?? []), [apiList]);

    const months = useMemo(() => {
        const first = baseMonth;
        return isMobile ? [first] : [first, addMonths(first, 1)];
    }, [baseMonth, isMobile]);

    const years = useMemo(() => {
        const y1 = baseMonth.getFullYear();
        const y2 = addMonths(baseMonth, isMobile ? 0 : 1).getFullYear();
        return y1 === y2 ? [y1] : [y1, y2];
    }, [baseMonth, isMobile]);
    const holidayMap = useHolidays({ country: holidayCountry, years });

    // ===== 連假(>=3天) 偵測：週末或 public 假日皆視為放假 =====
    const longBreakSet = useMemo(() => {
        if (!months.length) return new Set<string>();
        const first = months[0];
        const last = months[months.length - 1];
        const from = addDays(startOfMonth(first), -2); // 邊界外擴，避免跨月漏抓
        const to = addDays(endOfMonth(last), 2);

        const isOff = (d: Date) => {
            const key = format(d, 'yyyy-MM-dd');
            if (holidayMap[key]) return true;
            const dow = getDay(d); // 0=Sun, 6=Sat
            return dow === 0 || dow === 6;
        };

        const set = new Set<string>();
        let run: Date[] = [];
        for (const d of eachDayOfInterval({ start: from, end: to })) {
            if (isOff(d)) {
                run.push(d);
            } else {
                if (run.length >= 3) {
                    run.forEach((rd) => set.add(format(rd, 'yyyy-MM-dd')));
                }
                run = [];
            }
        }
        if (run.length >= 3) {
            run.forEach((rd) => set.add(format(rd, 'yyyy-MM-dd')));
        }
        return set;
    }, [months, holidayMap]);

    // 彙整所有價格（小到大）
    const pricesByDate = useMemo(() => {
        const m: Record<string, number[]> = {};
        (apiList ?? []).forEach((it) => {
            const key = format(new Date(it.LEAV_DT), 'yyyy-MM-dd');
            const price = Number(it.ProductSchPA);
            if (!Number.isFinite(price)) return;
            (m[key] ||= []).push(price);
        });
        Object.keys(m).forEach((k) => m[k].sort((a, b) => a - b));
        return m;
    }, [apiList]);

    return (
        <div className="w-full max-w-[1200px] mx-auto">
            <Card className="md:p-4 bg-gray-50 rounded-md">
                {/* Header */}
                <div className="flex items-center gap-4 p-4">
                    <div className="h-[64px] w-[96px] overflow-hidden rounded-md bg-muted">
                        <img
                            src="https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1200&auto=format&fit=crop"
                            alt="tour"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[18px] font-bold leading-snug truncate">
                            歡慶25週年 ✚ 【尋訪千年足跡
                            全程五星土耳其11日】報名就送熱氣球 雪白棉堡
                            卡帕多奇亞連泊 千年地下城 藍色清真寺
                        </div>
                    </div>
                    <div className="shrink-0">
                        <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-white text-sm font-semibold">
                            11 天
                        </span>
                    </div>
                </div>

                <div
                    className={cn(
                        'grid gap-4 md:px-4 px-2 pb-6',
                        isMobile ? 'grid-cols-1' : 'md:grid-cols-2 grid-cols-1'
                    )}
                >
                    {months.map((m, idx) => (
                        <MonthCard
                            key={idx}
                            monthDate={m}
                            onPrev={() =>
                                setBaseMonth(addMonths(baseMonth, -2))
                            } // 一次切兩個月
                            onNext={() => setBaseMonth(addMonths(baseMonth, 2))}
                            showPrevBtn={idx === 0}
                            showNextBtn={isMobile ? idx === 0 : idx === 1}
                            events={events}
                            badges={badges}
                            holidayMap={holidayMap}
                            pricesByDate={pricesByDate}
                            longBreakSet={longBreakSet}
                        />
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ============================= Sub Components =============================
function MonthCard({
    monthDate,
    showPrevBtn,
    showNextBtn,
    onPrev,
    onNext,
    events,
    badges,
    holidayMap,
    pricesByDate,
    longBreakSet,
}: {
    monthDate: Date;
    showPrevBtn?: boolean;
    showNextBtn?: boolean;
    onPrev: () => void;
    onNext: () => void;
    events: CalendarEvent[];
    badges: Record<string, number[]>;
    holidayMap: Record<string, string>;
    pricesByDate: Record<string, number[]>;
    longBreakSet: Set<string>;
}) {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthBadges = badges[monthKey] || [];

    const weeklyHeader = (
        <div className="grid grid-cols-7 rounded-none overflow-hidden">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div
                    key={d}
                    className="bg-emerald-500 text-white py-2 text-center text-sm font-semibold"
                >
                    {d}
                </div>
            ))}
        </div>
    );

    return (
        <Card className="md:p-4 bg-gray-50 rounded-md">
            {/* 月份標題列 + 導航 */}
            <div className="mb-3 flex items-center justify-between">
                <div className="w-8">
                    {showPrevBtn && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrev}
                            aria-label="prev month"
                        >
                            <span className="text-xl">‹</span>
                        </Button>
                    )}
                </div>
                <div className="text-base font-semibold">
                    {format(monthDate, 'M月 yyyy', { locale: zhTW })}
                </div>
                <div className="w-8 text-right">
                    {showNextBtn && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNext}
                            aria-label="next month"
                        >
                            <span className="text-xl">›</span>
                        </Button>
                    )}
                </div>
            </div>

            {weeklyHeader}

            {/* 日期格子 */}
            <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
                {/* 前導空白 */}
                {Array.from({ length: getDay(start) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    return (
                        <DayCell
                            key={day.toISOString()}
                            date={day}
                            isToday={isSameDay(day, new Date())}
                            inMonth={isSameMonth(day, monthDate)}
                            event={events.find((e) => e.date === key)}
                            holidayLabel={holidayMap[key]}
                            hasBadge={monthBadges.includes(
                                Number(format(day, 'd'))
                            )}
                            extraPrices={pricesByDate[key] ?? []}
                            isLongBreak={longBreakSet.has(key)}
                        />
                    );
                })}
            </div>
        </Card>
    );
}

function DayCell({
    date,
    inMonth,
    event,
    hasBadge,
    holidayLabel,
    isToday,
    extraPrices = [],
    isLongBreak,
}: {
    date: Date;
    inMonth: boolean;
    event?: CalendarEvent;
    hasBadge?: boolean;
    holidayLabel?: string;
    isToday?: boolean;
    extraPrices?: number[];
    isLongBreak?: boolean;
}) {
    const d = Number(format(date, 'd'));
    const priceText = useMemo(
        () =>
            typeof event?.price === 'number'
                ? `${event.price.toLocaleString()}+`
                : undefined,
        [event?.price]
    );

    const statusText =
        event?.status === 'soldout'
            ? '已成團'
            : event?.status === 'almost'
              ? '即將成團'
              : event?.status === 'open'
                ? '開團'
                : undefined;

    // 👉 新增：判斷多價格 & 控制邊框維持紅色的 hover 狀態
    const hasMulti = extraPrices.length > 1;
    const [active, setActive] = useState(false);

    return (
        <div
            onMouseEnter={() => hasMulti && setActive(true)}
            onMouseLeave={() => hasMulti && setActive(false)}
            className={cn(
                'group relative min-h-[70px] rounded-none mx-0.5 px-1 py-1 select-none cursor-default transition-colors',
                isLongBreak
                    ? 'bg-amber-100 hover:bg-amber-100'
                    : 'bg-white hover:bg-emerald-50',
                hasMulti
                    ? 'border border-transparent hover:border-red-500'
                    : '',
                active && hasMulti && 'border-red-500',
                !inMonth && 'opacity-40'
            )}
        >
            {hasBadge && (
                <div className="absolute -left-1 -top-1 h-6 w-6 rounded-full bg-amber-400 text-[11px] font-bold text-white grid place-items-center shadow">
                    {d}
                </div>
            )}

            {/* 👉 修改：浮層可互動，滑入浮層不消失；同時維持外框紅色 */}
            {hasMulti && (
                <div
                    onMouseEnter={() => setActive(true)}
                    onMouseLeave={() => setActive(false)}
                    className={cn(
                        'absolute left-1/2 top-8 z-20 -translate-x-1/2',
                        'invisible opacity-0 pointer-events-none transition-opacity duration-150',
                        'group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto',
                        'hover:visible hover:opacity-100 hover:pointer-events-auto'
                    )}
                >
                    <div className="rounded-md border border-zinc-200 bg-white shadow-md">
                        {extraPrices.map((p, idx) => (
                            <div
                                key={`${idx}-${p}`}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 text-[13px] leading-none',
                                    idx > 0 && 'border-t border-zinc-100'
                                )}
                            >
                                <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-zinc-100 text-[11px] text-zinc-600">
                                    {idx + 1}
                                </span>
                                <span className="tabular-nums">
                                    {p.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute left-1/2 -top-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-white border-l border-t border-zinc-200" />
                </div>
            )}

            {event?.label || holidayLabel ? (
                <div
                    className={cn(
                        // 預設橫排；≤820px 改為直式且左對齊
                        'flex items-center gap-1',
                        'max-[820px]:flex-col max-[820px]:items-center max-[820px]:gap-0'
                    )}
                >
                    <div className="shrink-0 md:h-5 md:w-5 h-4 w-4 rounded-full bg-amber-400 text-white md:text-[14px] text-[11px] font-bold grid place-items-center">
                        {d}
                    </div>
                    <span
                        className={cn(
                            'flex-1 min-w-0 md:text-[12px] text-[10px] text-black leading-tight break-words',
                            'max-[820px]:mt-0.5 max-[820px]:text-start'
                        )}
                    >
                        {event?.label || holidayLabel}
                    </span>
                </div>
            ) : (
                <div className="text-sm font-medium text-start">{d}</div>
            )}

            {/* 價格 */}
            {priceText && (
                <div className="mt-1 md:text-[12px] text-[10px] font-semibold text-emerald-700 leading-none">
                    {priceText}
                </div>
            )}

            {/* 狀態 */}
            {statusText && (
                <div
                    className={cn(
                        'mt-0.5 inline-block rounded px-1.5 py-[4px] md:text-[12px] text-[10px] leading-none',
                        event?.status === 'soldout' &&
                            'bg-orange-50 text-orange-600',
                        event?.status === 'almost' &&
                            'bg-emerald-50 text-emerald-700',
                        event?.status === 'open' && 'bg-zinc-100 text-zinc-600'
                    )}
                >
                    {statusText}
                </div>
            )}
        </div>
    );
}
