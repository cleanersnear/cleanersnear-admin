export interface TableOfContentsItem {
    id: string;
    title: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface BlogData {
    // Basic Info
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    read_time: string;
    author_name: string;
    author_role: string;
    author_image: string;
    publish_date: string;
    cover_image: string;
    is_featured: boolean;
    
    // Content
    introduction: string;
    sections: Array<{
        id: string;
        title: string;
        content: string[];
        highlights?: Array<{
            title: string;
            items: string[];
        }>;
    }>;
    
    // Metadata
    table_of_contents: TableOfContentsItem[];
    faqs: FAQ[];
} 