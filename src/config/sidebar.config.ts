import {
    LayoutDashboard,
    Home,
    MapPinned,
    Headphones,
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

export const sidebarItems: SidebarItem[] = [
    {
        title: '網站管理',
        url: '',
        icon: LayoutDashboard,
        items: [
            { title: '使用者管理', url: '/admin/users' },
            { title: '網站選單', url: '/admin/menu' },
            { title: '大類別管理', url: '/admin/category' },
            { title: '小類別管理', url: '/admin/categorysub' },
            { title: '地區管理', url: '/admin/region' },
            { title: '國家管理', url: '/admin/country' },
            { title: '機場管理', url: '/admin/airport' },
            { title: '城市管理', url: '/admin/city' },
            { title: '航空公司', url: '/admin/airline' },
            { title: '景點管理', url: '/admin/attraction' },
            { title: '辭庫管理', url: '/admin/dictionary' },
        ],
    },
    {
        title: '首頁設定',
        url: '',
        icon: Home,
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
        icon: MapPinned,
        items: [
            { title: '主題旅遊管理', url: '/admin/page' },
            { title: '團體', url: '/admin/product/group' },
            { title: '自由行', url: '/admin/product/free' },
            { title: '包車', url: '/admin/product/rcar' },
        ],
    },
    {
        title: '旅客服務',
        url: '',
        icon: Headphones,
        items: [{ title: '旅客迴響', url: '/admin/feedback' }],
    },
];
