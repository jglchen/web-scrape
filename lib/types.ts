export interface ScrapeItem {
    id?: string;
    title: string;
    url: string;
    api: string;
    posts: string;
}

export interface SavedData {
    created: string;
    data: any[];
}
