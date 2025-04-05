import { useState, useEffect } from 'react';
import { BlogFormData } from '../types';

const STORAGE_KEY = 'blog_draft';

export function useBlogForm(initialData?: BlogFormData) {
  const [formData, setFormData] = useState<BlogFormData>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    }
    // Fall back to initial data or default state
    return initialData || {
      slug: '',
      title: '',
      excerpt: '',
      category: '',
      read_time: '',
      author_name: '',
      author_role: '',
      author_image: '/images/blogimages/authors/daniel-wilson.jpg',
      publish_date: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString().split('T')[0],
      likes: 0,
      cover_image: '/images/blogimages/latest/professional-cleaning-melbourne.jpg',
      is_featured: false,
      introduction: '',
      sections: [],
      table_of_contents: [],
      faqs: []
    };
  });

  // Save to localStorage whenever formData changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const updateFormData = (updates: Partial<BlogFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      last_updated: new Date().toISOString().split('T')[0]
    }));
  };

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setFormData({
        slug: '',
        title: '',
        excerpt: '',
        category: '',
        read_time: '',
        author_name: '',
        author_role: '',
        author_image: '/images/blogimages/authors/daniel-wilson.jpg',
        publish_date: new Date().toISOString().split('T')[0],
        last_updated: new Date().toISOString().split('T')[0],
        likes: 0,
        cover_image: '/images/blogimages/latest/professional-cleaning-melbourne.jpg',
        is_featured: false,
        introduction: '',
        sections: [],
        table_of_contents: [],
        faqs: []
      });
    }
  };

  return {
    formData,
    updateFormData,
    clearDraft
  };
} 