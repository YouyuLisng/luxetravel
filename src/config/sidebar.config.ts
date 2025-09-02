// config/sidebar.config.ts（或你現有的檔名）
import {
    Bot,
    BookOpen,
    Settings2,
    Frame,
    PieChart,
    Map,
    type LucideIcon,
} from 'lucide-react';

// ✅ 型別定義
export type SidebarItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
};

export type ProjectItem = {
    name: string;
    url: string;
    icon: LucideIcon;
};

export type TeamItem = {
    name: string;
    logo: LucideIcon;
    plan: string;
};

export const sidebarTeams: TeamItem[] = [
    { name: '典藏網站後台', logo: Map, plan: '典華旅行社' },
];

export const sidebarProjects: ProjectItem[] = [
    { name: 'Design Engineering', url: '#', icon: Frame },
    { name: 'Sales & Marketing', url: '#', icon: PieChart },
    { name: 'Travel', url: '#', icon: Map },
];

// ✅ 主導覽項目
// 202508251720 [CK] 暫時不顯示 { title: '模組管理', url: '/admin/modules' },
// 202508251720 [CK] 暫時不顯示 { title: '立即諮詢', url: '/admin/enquiry' },
// 202508251720 [CK] 暫時不顯示     ,
// 202508251720 [CK] 暫時不顯示     {
// 202508251720 [CK] 暫時不顯示         title: '行程管理',
// 202508251720 [CK] 暫時不顯示         url: '',
// 202508251720 [CK] 暫時不顯示         icon: BookOpen,
// 202508251720 [CK] 暫時不顯示         items: [
// 202508251720 [CK] 暫時不顯示             { title: '團體', url: '/admin/tour' },
// 202508251720 [CK] 暫時不顯示             { title: '自由行', url: '/admin/package' },
// 202508251720 [CK] 暫時不顯示             { title: '旅客迴響', url: '/admin/feedback' },
// 202508251720 [CK] 暫時不顯示         ],
// 202508251720 [CK] 暫時不顯示     },
export const sidebarItems: SidebarItem[] = [
    {
        title: '網站管理',
        url: '',
        icon: Settings2,
        items: [
            { title: '使用者管理', url: '/admin/users' },
            { title: '網站選單', url: '/admin/menu' },
            { title: '大類別管理', url: '/admin/category' }, // 大類別：西歐
            { title: '小類別管理', url: '/admin/categorysub' }, // 小類別：英法雙國
            { title: '地區管理', url: '/admin/region' }, // 地理意義上的地區
            { title: '國家管理', url: '/admin/country' }, // 地理意義上的國家 英國、法國
            { title: '機場管理', url: '/admin/airport' }, //
            { title: '城市管理', url: '/admin/city' },
            { title: '航空公司', url: '/admin/airline' },
            { title: '景點管理', url: '/admin/attraction' },
            { title: '辭條管理', url: '/admin/dictionary' },
        ],
    },
    {
        title: '首頁設定',
        url: '',
        icon: Bot,
        items: [
            { title: '首頁輪播大圖', url: '/admin/banner' },
            { title: '經典行程卡片', url: '/admin/countryshowcases' },
            { title: '自由行規劃', url: '/admin/concern' },
            { title: '典藏優勢', url: '/admin/advantage' },
            { title: '典藏推薦', url: '/admin/travelarticle' },
            { title: '真實旅客回饋', url: '/admin/testimonial' },
        ],
    },
    {
        title: '行程管理',
        url: '',
        icon: BookOpen,
        items: [
            { title: '團體', url: '/admin/product' },
        ],
    },
];
