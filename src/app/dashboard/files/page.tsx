'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import BlogImage from '../blogs/components/BlogImage';
import { 
  ArrowUpTrayIcon, 
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  ClipboardIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../blogs/components/LoadingSpinner';

interface FileItem {
  name: string;
  path: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

const STORAGE_BUCKET = 'blog-images';

// Add helper functions
const validatePath = (path: string) => {
  if (path.includes('..')) {
    throw new Error('Invalid path');
  }
  return path;
};

const validateFileType = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
};

// Add type for storage error
interface StorageError {
  message: string;
  statusCode?: string;
  name?: string;
}

const handleStorageError = (error: StorageError) => {
  console.error('Storage error:', error);
  if (error.message.includes('not found')) {
    toast.error('File or folder not found');
  } else if (error.message.includes('permission denied')) {
    toast.error('Permission denied. Please check your access rights.');
  } else if (error.message.includes('already exists')) {
    toast.error('A file with this name already exists');
  } else {
    toast.error('An error occurred while performing the operation');
  }
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadFiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        handleStorageError(error as StorageError);
        if (error.message.includes('not found')) {
          setFiles([]);
          return;
        }
        throw error;
      }

      if (!data) {
        setFiles([]);
        return;
      }

      // Process files with better URL handling
      const processedFiles = await Promise.all(
        data.map(async (item) => {
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(item.name);

          // Clean up the URL if it's a Supabase URL
          const cleanUrl = publicUrl.includes('supabase.co') 
            ? publicUrl.replace(/([^:]\/)\/+/g, "$1")
            : publicUrl;

          return {
            name: item.name,
            path: item.name,
            url: cleanUrl,
            type: item.metadata?.mimetype || 'unknown',
            size: item.metadata?.size || 0,
            created_at: item.created_at,
          };
        })
      );

      setFiles(processedFiles);
    } catch (error) {
      handleStorageError(error as StorageError);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      // Validate file types and sizes
      const validFiles = Array.from(files).filter(file => {
        try {
          validateFileType(file);
          const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
          
          if (!isValidSize) {
            toast.error(`${file.name} is too large (max 5MB)`);
            return false;
          }
          
          return true;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`${file.name}: ${errorMessage}`);
          return false;
        }
      });

      if (validFiles.length === 0) {
        throw new Error('No valid files to upload');
      }

      const uploadPromises = validFiles.map(async (file) => {
        try {
          // Create a unique filename to prevent overwrites
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            handleStorageError(uploadError as StorageError);
            return null;
          }

          return data;
        } catch (error) {
          handleStorageError(error as StorageError);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);

      if (successfulUploads.length > 0) {
        toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
        loadFiles();
      }
    } catch (error) {
      handleStorageError(error as StorageError);
    } finally {
      event.target.value = '';
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      validatePath(file.path);
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([file.path]);

      if (error) {
        handleStorageError(error as StorageError);
        return;
      }
      
      toast.success('File deleted successfully');
      loadFiles();
    } catch (error) {
      handleStorageError(error as StorageError);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRename = async (file: FileItem, newName: string) => {
    try {
      if (!newName.trim()) {
        toast.error('Please enter a valid name');
        return;
      }

      validatePath(file.path);
      validatePath(newName);

      // Get the file extension
      const fileExt = `.${file.name.split('.').pop()}`;
      const newFileName = `${newName}${fileExt}`;

      // Check if the new name already exists
      const { data: existingFiles } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('');

      if (existingFiles?.some(item => item.name === newFileName)) {
        toast.error('A file with this name already exists');
        return;
      }

      // Move the file to the new name
      const { error: moveError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .move(file.path, newFileName);

      if (moveError) {
        handleStorageError(moveError as StorageError);
        return;
      }

      toast.success('Renamed successfully');
      loadFiles();
    } catch (error) {
      handleStorageError(error as StorageError);
    } finally {
      setIsRenaming(false);
      setSelectedFile(null);
      setNewName('');
    }
  };

  const sortFiles = (files: FileItem[]) => {
    return [...files].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredAndSortedFiles = sortFiles(
    files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Add copy path function
  const handleCopyPath = async (file: FileItem) => {
    try {
      await navigator.clipboard.writeText(file.url);
      toast.success('Path copied to clipboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy path';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        {/* Top Bar - Made Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">File Manager</h1>
          
          {/* Controls Container */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* View Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListBulletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-none min-w-[200px]">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Sort Button */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowsUpDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Upload Button */}
            <label className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-[#1E3D8F] rounded-lg hover:bg-[#15306F] transition-colors cursor-pointer">
              <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Upload Files</span>
              <input
                type="file"
                className="hidden"
                multiple
                onChange={handleFileUpload}
                accept="image/*"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Sort Options */}
          <div className="flex gap-4 mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
              className="border rounded-lg px-3 py-1.5"
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
            </select>
          </div>

          {/* Files Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredAndSortedFiles.map((file) => (
                <div
                  key={file.path}
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <div className="relative aspect-square mb-3 sm:mb-4">
                    <BlogImage
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover rounded-lg"
                      priority
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopyPath(file)}
                          className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                          title="Copy path"
                        >
                          <ClipboardIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFile(file);
                            setNewName(file.name.split('.')[0]);
                            setIsRenaming(true);
                          }}
                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isRenaming && selectedFile?.path === file.path && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRename(file, newName);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleRename(file, newName)}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-lg overflow-hidden">
                      <BlogImage
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isRenaming && selectedFile?.path === file.path ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRename(file, newName);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleRename(file, newName)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      )}
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPath(file)}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Copy path"
                    >
                      <ClipboardIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFile(file);
                        setNewName(file.name.split('.')[0]);
                        setIsRenaming(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 