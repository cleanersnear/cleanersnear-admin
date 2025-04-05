export interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  author_name: string;
  author_role: string;
  author_image: string;
  publish_date: string;
  last_updated: string;
  likes: number;
  cover_image: string;
  is_featured: boolean;
  introduction: string;
  sections: {
    id: string;
    title: string;
    content: string[];
    highlights?: {
      title: string;
      items: string[];
    }[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface BlogFormData {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  author_name: string;
  author_role: string;
  author_image: string;
  publish_date: string;
  last_updated: string;
  likes: number;
  cover_image: string;
  is_featured: boolean;
  introduction: string;
  sections: {
    id: string;
    title: string;
    content: string[];
    highlights?: {
      title: string;
      items: string[];
    }[];
  }[];
  table_of_contents: {
    id: string;
    title: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
} 