'use client';

import { useEffect, useState } from 'react';
import { Blog } from './types';
import { blogService } from './services/blogService';
import LoadingSpinner from './components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { format, isValid } from 'date-fns';
import { PencilIcon, TrashIcon, EyeIcon, GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await blogService.getBlogs();
      setBlogs(data);
    } catch (err) {
      setError('Failed to fetch blogs. Please try again later.');
      console.error('Error fetching blogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await blogService.deleteBlog(id);
        setBlogs(blogs.filter(blog => blog.id !== id));
        toast.success('Blog deleted successfully');
      } catch (err) {
        console.error('Error deleting blog:', err);
        toast.error('Failed to delete blog');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published') => {
    try {
      await blogService.updateBlog(id, { status: newStatus });
      setBlogs(blogs.map(blog => 
        blog.id === id ? { ...blog, status: newStatus } : blog
      ));
      toast.success('Blog status updated successfully');
    } catch (err) {
      console.error('Error updating blog status:', err);
      toast.error('Failed to update blog status');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
  };

  const domain = 'https://www.cleaningprofessionals.com.au';
  const liveUrl = (slug: string) => `${domain}/blogs/${slug}`;
  const previewUrl = (slug: string) => `${domain}/blogs/${slug}`;

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/images/placeholder.jpg';
    
    // If it's already a full URL with our domain, use it as is
    if (imagePath.startsWith(domain)) {
      return imagePath;
    }
    
    // For relative paths, ensure they start with a single slash
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${domain}${cleanPath}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchBlogs}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Manage Blogs</h1>
          <Link
            href="/dashboard/blogs/new"
            className="bg-[#1E3D8F] text-white px-4 py-2 rounded-lg hover:bg-[#15306F] transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Blog
          </Link>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No blogs found. Create your first blog post!</p>
            <Link
              href="/dashboard/blogs/new"
              className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Create New Blog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, index) => (
              <div key={blog.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-48">
                  <div className="absolute inset-0 bg-gray-100" />
                  <Image
                    src={getImageUrl(blog.cover_image)}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.jpg';
                    }}
                    unoptimized
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">{blog.category}</span>
                    <span className="text-sm text-gray-500">{formatDate(blog.publish_date)}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{blog.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{blog.excerpt}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <select
                        value={blog.status}
                        onChange={(e) => handleStatusChange(blog.id, e.target.value as 'draft' | 'published')}
                        className="text-sm border rounded-md px-2 py-1"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      {blog.is_featured && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <a
                        href={previewUrl(blog.slug)}
                        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Preview"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </a>
                      {blog.status === 'published' && (
                        <a
                          href={liveUrl(blog.slug)}
                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                          title="View Live"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <GlobeAltIcon className="h-5 w-5" />
                        </a>
                      )}
                      <Link
                        href={`/dashboard/blogs/edit/${blog.id}`}
                        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
