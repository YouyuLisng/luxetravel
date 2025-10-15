// src/config/breadcrumb.config.ts

/** 顯示每個 segment 的中文（列表頁等一般情況） */
export const breadcrumbMap: Record<string, string> = {
    admin: '管理後台',
    // 行程管理
    product: '行程管理',
    package: '自由行',
    // 共用資料表
    category: '大類別',
    categorysub: '小類別',
    region: '地區管理',
    country: '國家管理',
    city: '城市管理',
    airport: '機場管理',
    airline: '航空公司',
    attraction: '景點管理',
    dictionary: '辭庫管理',
    group: '團體',
    free: '自由行',
    rcar: '包車',
    // 首頁設定
    menu: '前台選單',
    banner: '首頁輪播大圖',
    page: '主題旅遊',
    countryshowcases: '經典行程卡片',
    concern: '自由行規劃',
    // 模組內容管理
    modules: '模組設定',
    advantage: '典藏優勢',
    // 內容管理
    travelarticle: '典藏推薦',
    testimonial: '真實旅客回饋',
    feedback: '旅客迴響',
    // 系統管理
    users: '使用者管理',
    settings: '帳號設定',
};

/** 新增／編輯時使用的「資源單數中文名」 */
const RESOURCE_NAME: Record<string, string> = {
    // 內容與行程
    feedback: '旅客迴響',
    travelarticle: '典藏推薦',
    testimonial: '真實旅客回饋',
    banner: '首頁輪播大圖',

    // 共用 & 系統
    users: '使用者',
    user: '使用者',
    country: '國家',
    airport: '機場',
    region: '地區',
    modules: '模組',
    advantage: '典藏優勢',
    menu: '前台選單',
    settings: '帳號',
};

/** 指定完整路徑要覆寫的標籤（優先度最高） */
export const breadcrumbPathOverrides: Record<string, string> = {
    '/admin/feedback/new': '新增旅客迴響',
    '/admin/travelarticle/new': '新增典藏推薦',
    '/admin/testimonial/new': '新增真實旅客回饋',
    '/admin/banner/new': '新增首頁輪播大圖',
    '/admin/users/new': '新增使用者',
    '/admin/attraction/new': '新增景點',
    '/admin/airline/new': '新增航空公司',
    '/admin/page/new': '新增主題旅遊',
    // ✅ 特例：行程編輯 Wizard
    '/admin/product/:id/wizard/group': '編輯團體',
    '/admin/product/:id/wizard/free': '編輯自由行',
    '/admin/product/:id/wizard/rcar': '編輯包車',
};

/* ---------- 工具 ---------- */
const isObjectId = (s: string) =>
    /^[a-f0-9]{24}$/i.test(s) || /^\d+$/.test(s) || /^[0-9a-f-]{36}$/i.test(s);

const getSegmentLabel = (seg: string): string | undefined => {
    if (breadcrumbMap[seg]) return breadcrumbMap[seg];
    if (RESOURCE_NAME[seg]) return RESOURCE_NAME[seg];
    return undefined;
};

const findResourceLabel = (segs: string[], idx: number): string | undefined => {
    if (RESOURCE_NAME[segs[idx]]) return RESOURCE_NAME[segs[idx]];
    for (let i = idx - 1; i >= 0; i--) {
        const s = segs[i];
        if (RESOURCE_NAME[s]) return RESOURCE_NAME[s];
        if (breadcrumbMap[s]) {
            return breadcrumbMap[s].replace(/(管理|設定)$/, '');
        }
    }
    return undefined;
};

/** 主要：把 pathname 轉成麵包屑陣列 */
export function buildBreadcrumbs(pathname: string) {
    const segs = pathname.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [];

    for (let i = 0; i < segs.length; i++) {
        const seg = decodeURIComponent(segs[i]);
        const href = '/' + segs.slice(0, i + 1).join('/');

        // ✅ 1) 完整路徑覆寫（支援動態 :id）
        const override = Object.entries(breadcrumbPathOverrides).find(([pattern]) => {
            if (pattern.includes(':id')) {
                const regex = new RegExp(
                    '^' + pattern.replace(':id', '[^/]+') + '$'
                );
                return regex.test(href);
            }
            return pattern === href;
        });

        if (override) {
            // ✅ Wizard 頁面（例如 /admin/product/:id/wizard/rcar）
            if (override[0].startsWith('/admin/product/:id/wizard/')) {
                const base = crumbs.filter(
                    (c) => c.href === '/admin' || c.href === '/admin/product'
                );
                crumbs.length = 0;
                crumbs.push(...base, { label: override[1], href });
                continue;
            }

            // ✅ Tour 頁面（若有需要）
            if (override[0] === '/admin/product/:id/tour') {
                const base = crumbs.filter(
                    (c) => c.href === '/admin' || c.href === '/admin/product'
                );
                crumbs.length = 0;
                crumbs.push(...base, { label: override[1], href });
                continue;
            }

            crumbs.push({ label: override[1], href });
            continue;
        }

        // 2) /new → 新增{資源名}
        if (seg === 'new') {
            const resName = findResourceLabel(segs, i) ?? seg;
            crumbs.push({ label: `新增${resName}`, href });
            continue;
        }

        // 3) /{id} → 編輯{資源名}
        if (isObjectId(seg)) {
            const resName = findResourceLabel(segs, i) ?? seg;
            crumbs.push({ label: `編輯${resName}`, href });
            continue;
        }

        // 4) 既有對照表
        const mapped = getSegmentLabel(seg);
        if (mapped) {
            crumbs.push({ label: mapped, href });
            continue;
        }

        // 5) 預設：原字
        crumbs.push({ label: seg, href });
    }

    return crumbs;
}
