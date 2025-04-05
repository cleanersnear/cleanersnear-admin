// Basic author interface
export interface Author {
    name: string;
    role: string;
    image: string;
}

// Table of contents item
export interface TableOfContentsItem {
    id: string;
    title: string;
}

// FAQ item
export interface FAQ {
    question: string;
    answer: string;
}

// Section highlight
export interface SectionHighlight {
    title: string;
    items: string[];
}

// Blog section
export interface BlogSection {
    id: string;
    title: string;
    content: string[];
    highlights?: SectionHighlight[];
}

// Blog content structure
export interface BlogContent {
    introduction: string;
    sections: BlogSection[];
}

// Blog metadata
export interface BlogMetadata {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    readTime: string;
    author: Author;
    publishDate: string;
    lastUpdated: string; 
    likes: number;
    coverImage: string;
    tableOfContents: TableOfContentsItem[];
    faqs: FAQ[];
    isFeatured: boolean;
}

// Complete blog post combining metadata and content
export interface BlogPost extends BlogMetadata {
    content: BlogContent;
}

// Optional: Helper type for blog listings
export interface BlogListItem {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    readTime: string;
    author: Author;
    publishDate: string;
    coverImage: string;
    likes: number;
} 