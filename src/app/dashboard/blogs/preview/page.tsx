'use client';

import React, { useEffect, useState } from 'react';
import { BlogFormData } from '../types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, Share2, Bookmark, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import TableOfContents from './components/TableOfContents';
import FAQ from './components/FAQ';
import CallToAction from './components/CallToAction';

const STORAGE_KEY = 'blog_draft';

export default function BlogPreviewPage() {
  const router = useRouter();
  const [blogData, setBlogData] = useState<BlogFormData | null>(null);

  useEffect(() => {
    // Function to load data from localStorage
    const loadData = () => {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          setBlogData(JSON.parse(savedData));
        }
      }
    };

    // Load initial data
    loadData();

    // Set up storage event listener for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setBlogData(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!blogData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Preview Available</h1>
          <p className="text-gray-600 mb-4">Please open the blog editor to see the preview.</p>
          <button
            onClick={() => router.push('/dashboard/blogs/new')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1E3D8F] rounded-lg hover:bg-[#15306F] transition-colors"
          >
            Open Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-12 mt-32">
      <div className="max-w-[1400px] mx-auto">
        {/* Breadcrumb & Actions */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/blogs" className="hover:text-[#1E3D8F]">Blog</Link>
            <span>/</span>
            <span>{blogData.category}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:text-[#1E3D8F]">
              <Share2 size={20} />
              Share
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-[#1E3D8F]">
              <Bookmark size={20} />
              Save
            </button>
          </div>
        </div>

        {/* Category Badge & Title */}
        <div className="mb-8">
          <span className="bg-blue-100 text-[#1E3D8F] px-4 py-2 rounded-full text-sm font-medium">
            {blogData.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            {blogData.title}
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <Image
                  src={blogData.author_image}
                  alt={blogData.author_name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="ml-3">
                  <p className="font-medium">{blogData.author_name}</p>
                  <p className="text-sm text-gray-600">{blogData.author_role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={20} />
                <span>{blogData.read_time}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Last updated: {new Date(blogData.last_updated).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <ThumbsUp size={18} />
                <span>{blogData.likes} likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-[600px] rounded-2xl overflow-hidden mb-12">
          <Image
            src={blogData.cover_image}
            alt={blogData.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <p className="text-lg leading-relaxed mb-8">
                {blogData.introduction}
              </p>

              {/* Sections */}
              {blogData.sections.map((section) => (
                <div key={section.id} id={section.id} className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">
                    {section.title}
                  </h2>
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: paragraph }} />
                  ))}
                  {section.highlights?.map((highlight, hIndex) => (
                    <div key={hIndex} className="bg-gray-50 p-8 rounded-2xl my-8">
                      <h3 className="text-xl font-bold mb-4">
                        {highlight.title}
                      </h3>
                      <ul className="space-y-3">
                        {highlight.items.map((item, iIndex) => (
                          <li key={iIndex} className="flex items-start gap-3">
                            <span className="text-[#1E3D8F] font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-12">
              <CallToAction />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <TableOfContents items={blogData.table_of_contents} />
              <FAQ questions={blogData.faqs} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
} 