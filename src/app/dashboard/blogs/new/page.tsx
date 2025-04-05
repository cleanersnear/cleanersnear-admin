'use client';

import React, { useState } from 'react';
import { TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { blogService } from '../services/blogService';
import { useBlogForm } from '../hooks/useBlogForm';

interface BlogSection {
  id: string;
  title: string;
  content: string | string[];
  highlights?: { title: string; items: string[]; }[];
}

export default function NewBlogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formData, updateFormData, clearDraft } = useBlogForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Creating blog with data:', formData);
      
      // Validate required fields
      if (!formData.title || !formData.slug || !formData.excerpt || !formData.category || 
          !formData.read_time || !formData.author_name || !formData.author_role || 
          !formData.publish_date || !formData.cover_image || !formData.introduction) {
        throw new Error('Please fill in all required fields');
      }

      // Ensure sections array is initialized
      if (!formData.sections) {
        formData.sections = [];
      }

      // Ensure table_of_contents is generated from sections
      formData.table_of_contents = formData.sections.map(section => ({
        id: section.id,
        title: section.title
      }));

      // Ensure faqs array is initialized
      if (!formData.faqs) {
        formData.faqs = [];
      }

      // Create the blog
      const result = await blogService.createBlog(formData);
      
      if (!result) {
        throw new Error('Failed to create blog: No response from server');
      }

      clearDraft(); // Clear the draft after successful submission
      toast.success('Blog created successfully!');
      router.push('/dashboard/blogs');
    } catch (error) {
      console.error('Error creating blog:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSampleBlog = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    updateFormData({
      slug: '10-essential-house-cleaning-tips',
      title: '10 Essential House Cleaning Tips for a Spotless Home',
      excerpt: 'Discover professional house cleaning tips that will transform your home. Learn time-saving techniques and get expert advice for maintaining a clean, healthy living space.',
      category: 'House Cleaning',
      read_time: '5 min read',
      author_name: 'Sarah Johnson',
      author_role: 'Senior Cleaning Expert',
      author_image: '/images/blogimages/authors/sarah-johnson.jpg',
      publish_date: new Date().toISOString().split('T')[0],
      last_updated: currentDate,
      likes: 0,
      cover_image: '/images/blogimages/latest/house-cleaning-tips.jpg',
      is_featured: true,
      introduction: 'Maintaining a clean home doesn\'t have to be overwhelming. With the right techniques and a systematic approach, you can keep your living space spotless while saving time and energy. In this guide, we\'ll share professional cleaning tips that will help you establish an effective cleaning routine.',
      sections: [
        {
          id: 'daily-cleaning-routine',
          title: 'Establish a Daily Cleaning Routine',
          content: [
            'The key to maintaining a clean home is developing consistent daily habits. Start with simple tasks like making your bed, doing a quick bathroom wipe-down, and cleaning dishes after meals.',
            'Spend just 15-20 minutes each day on basic tidying. This prevents clutter from accumulating and makes deep cleaning sessions much more manageable.'
          ],
          highlights: [{
            title: 'Daily Cleaning Checklist',
            items: [
              '✓ Make beds in the morning',
              '✓ Wipe bathroom surfaces after use',
              '✓ Clean kitchen counters after meals',
              '✓ Quick floor sweep or vacuum'
            ]
          }]
        }
      ],
      table_of_contents: [
        { id: 'daily-cleaning-routine', title: 'Establish a Daily Cleaning Routine' }
      ],
      faqs: [
        {
          question: 'How often should I deep clean my home?',
          answer: 'For most homes, a deep cleaning every 2-4 weeks is recommended, depending on factors like household size, presence of pets, and daily activities. However, maintaining daily cleaning habits can reduce the frequency of deep cleaning needed.'
        }
      ]
    });
  };

  const addSection = () => {
    const newSection = {
      id: `section-${formData.sections.length + 1}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: '',
      content: [''],
      highlights: [{
        title: '',
        items: ['']
      }]
    };
    updateFormData({
      ...formData,
      sections: [...formData.sections, newSection]
    });
  };

  const updateSection = (index: number, field: keyof BlogSection, value: string | string[]) => {
    const updatedSections = [...formData.sections];
    if (field === 'id') {
      value = (value as string).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    updateFormData({ ...formData, sections: updatedSections });
  };

  const updateSectionHighlight = (sectionIndex: number, field: 'title' | 'items', value: string | string[]) => {
    const updatedSections = [...formData.sections];
    const currentSection = updatedSections[sectionIndex];
    
    if (!currentSection.highlights || !currentSection.highlights[0]) {
      currentSection.highlights = [{
        title: '',
        items: ['']
      }];
    }
    
    currentSection.highlights[0] = {
      ...currentSection.highlights[0],
      [field]: value
    };
    
    updateFormData({ ...formData, sections: updatedSections });
  };

  const addHighlightItem = (sectionIndex: number) => {
    const updatedSections = [...formData.sections];
    const currentSection = updatedSections[sectionIndex];
    
    if (!currentSection.highlights || !currentSection.highlights[0]) {
      currentSection.highlights = [{
        title: '',
        items: ['']
      }];
    } else {
      currentSection.highlights[0].items.push('');
    }
    
    updateFormData({ ...formData, sections: updatedSections });
  };

  const updateHighlightItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const updatedSections = [...formData.sections];
    const currentSection = updatedSections[sectionIndex];
    
    if (!currentSection.highlights || !currentSection.highlights[0]) {
      return;
    }
    
    currentSection.highlights[0].items[itemIndex] = value;
    updateFormData({ ...formData, sections: updatedSections });
  };

  const removeHighlightItem = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = [...formData.sections];
    const currentSection = updatedSections[sectionIndex];
    
    if (!currentSection.highlights || !currentSection.highlights[0]) {
      return;
    }
    
    currentSection.highlights[0].items = currentSection.highlights[0].items.filter((_, i) => i !== itemIndex);
    updateFormData({ ...formData, sections: updatedSections });
  };

  const removeSection = (index: number) => {
    updateFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== index)
    });
  };

  const addFAQ = () => {
    updateFormData({
      ...formData,
      faqs: [...formData.faqs, { question: '', answer: '' }]
    });
  };

  const updateFAQ = (index: number, field: string, value: string) => {
    const updatedFAQs = [...formData.faqs];
    updatedFAQs[index] = {
      ...updatedFAQs[index],
      [field]: value
    };
    updateFormData({ ...formData, faqs: updatedFAQs });
  };

  const removeFAQ = (index: number) => {
    updateFormData({
      ...formData,
      faqs: formData.faqs.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Create New Blog</h1>
            <button
              onClick={() => window.open('/dashboard/blogs/preview', '_blank')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={loadSampleBlog}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#1E3D8F] bg-[#1E3D8F]/10 rounded-lg hover:bg-[#1E3D8F]/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load Sample Blog
            </button>
            <button
              onClick={() => router.push('/dashboard/blogs')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium">Basic Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      updateFormData({
                        ...formData,
                        title,
                        slug: title.toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')
                      });
                    }}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <p className="mt-1 text-sm text-gray-500">Auto-generated from title, can be customized</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={formData.cover_image}
                      onChange={(e) => updateFormData({...formData, cover_image: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="/images/blogimages/latest/your-image.jpg"
                      required
                    />
                    {formData.cover_image && (
                      <div className="relative h-24 w-36 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={formData.cover_image}
                          alt="Cover preview"
                          fill
                          className="object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Path to the cover image (e.g., /images/blogimages/latest/your-image.jpg)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => updateFormData({...formData, excerpt: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[80px] resize-y"
                    placeholder="Write a brief summary of the blog post..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">A short description that appears in blog listings</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => updateFormData({...formData, category: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Read Time</label>
                  <input
                    type="text"
                    value={formData.read_time}
                    onChange={(e) => updateFormData({...formData, read_time: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    placeholder="e.g., 5 min read"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => updateFormData({...formData, publish_date: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Author Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-medium">Author Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author_name}
                    onChange={(e) => updateFormData({...formData, author_name: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Role</label>
                  <input
                    type="text"
                    value={formData.author_role}
                    onChange={(e) => updateFormData({...formData, author_role: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Image</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={formData.author_image}
                      onChange={(e) => updateFormData({...formData, author_image: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="/images/blogimages/authors/your-image.jpg"
                      required
                    />
                    {formData.author_image && (
                      <div className="relative h-16 w-16 rounded-full overflow-hidden border border-gray-200">
                        <Image
                          src={formData.author_image}
                          alt="Author preview"
                          fill
                          className="object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Path to the author&apos;s profile image (e.g., /images/blogimages/authors/your-image.jpg)</p>
                </div>
              </div>
            </div>

            {/* Featured Post Toggle */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="text-lg font-medium">Featured Post</h3>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => updateFormData({...formData, is_featured: e.target.checked})}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700">
                  Feature this post on the blog homepage
                </label>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-lg font-medium">Content</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
                <textarea
                  value={formData.introduction}
                  onChange={(e) => updateFormData({...formData, introduction: e.target.value})}
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[120px] resize-y"
                  placeholder="Write an engaging introduction for your blog post..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">The opening paragraph that introduces your topic</p>
              </div>

              {/* Sections Editor */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h4 className="text-md font-medium">Content Sections</h4>
                  </div>
                  <button
                    type="button"
                    onClick={addSection}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                    Add Section
                  </button>
                </div>
                {formData.sections.map((section, index) => (
                  <div key={section.id} className="mb-6 p-6 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => {
                              const title = e.target.value;
                              updateSection(index, 'title', title);
                              updateSection(index, 'id', title.toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '')
                              );
                            }}
                            placeholder="Section Title"
                            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section ID</label>
                          <input
                            type="text"
                            value={section.id}
                            onChange={(e) => updateSection(index, 'id', e.target.value)}
                            placeholder="Section ID (auto-generated)"
                            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          <p className="mt-1 text-sm text-gray-500">Used for table of contents links</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="ml-4 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {section.content.map((content, contentIndex) => (
                        <div key={contentIndex} className="flex gap-2">
                          <div className="flex-1">
                            <textarea
                              value={content}
                              onChange={(e) => {
                                const newContent = [...section.content];
                                newContent[contentIndex] = e.target.value;
                                updateSection(index, 'content', newContent);
                              }}
                              rows={3}
                              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-y"
                              placeholder="Write your section content here..."
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = section.content.filter((_, i) => i !== contentIndex);
                              updateSection(index, 'content', newContent);
                            }}
                            className="text-red-600 hover:text-red-700 self-start mt-2"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          updateSection(index, 'content', [...section.content, '']);
                        }}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <PlusCircleIcon className="w-4 h-4 mr-1" />
                        Add Paragraph
                      </button>

                      {/* Highlights Section */}
                      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h5 className="font-medium">Section Highlights</h5>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const currentHighlights = section.highlights?.[0];
                              if (!currentHighlights) {
                                updateSectionHighlight(index, 'title', '');
                              }
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {!section.highlights?.[0] ? '+ Add Highlights' : 'Edit Highlights'}
                          </button>
                        </div>
                        
                        {section.highlights?.[0] && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights Title</label>
                              <input
                                type="text"
                                value={section.highlights[0].title}
                                onChange={(e) => updateSectionHighlight(index, 'title', e.target.value)}
                                placeholder="e.g., Key Benefits, Important Features"
                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            {section.highlights[0].items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex gap-2">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateHighlightItem(index, itemIndex, e.target.value)}
                                    placeholder="✓ Enter highlight item..."
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeHighlightItem(index, itemIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => addHighlightItem(index)}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                            >
                              <PlusCircleIcon className="w-4 h-4 mr-1" />
                              Add Highlight Item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQs Editor */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-md font-medium">Frequently Asked Questions</h4>
                  </div>
                  <button
                    type="button"
                    onClick={addFAQ}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                    Add FAQ
                  </button>
                </div>
                {formData.faqs.map((faq, index) => (
                  <div key={index} className="mb-4 p-6 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                        placeholder="Question"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeFAQ(index)}
                        className="ml-4 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                        rows={3}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-y"
                        placeholder="Write your answer here..."
                        required
                      />
                      <p className="text-sm text-gray-500">Provide a clear and concise answer</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-[#1E3D8F] rounded-lg hover:bg-[#15306F] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Blog
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 