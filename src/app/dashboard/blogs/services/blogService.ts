import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Blog, BlogFormData } from '../types';

const supabase = createClientComponentClient();

interface BlogContent {
  blog_id: string;
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
}

interface BlogMetadata {
  blog_id: string;
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const blogService = {
  async getBlogs(): Promise<Blog[]> {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getBlogById(id: string): Promise<Blog> {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getBlogContentById(id: string): Promise<BlogContent> {
    const { data, error } = await supabase
      .from('blog_content')
      .select('*')
      .eq('blog_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getBlogMetadataById(id: string): Promise<BlogMetadata> {
    const { data, error } = await supabase
      .from('blog_metadata')
      .select('*')
      .eq('blog_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createBlog(formData: BlogFormData) {
    try {
      // First create the blog entry
      const { data: blogData, error: blogError } = await supabase
        .from('blog')
        .insert([{
          slug: formData.slug,
          title: formData.title,
          excerpt: formData.excerpt,
          category: formData.category,
          read_time: formData.read_time,
          author_name: formData.author_name,
          author_role: formData.author_role,
          author_image: formData.author_image,
          publish_date: formData.publish_date,
          last_updated: new Date().toISOString(),
          likes: formData.likes || 0,
          cover_image: formData.cover_image,
          is_featured: formData.is_featured
        }])
        .select()
        .single();

      if (blogError) {
        console.error('Error creating blog entry:', blogError);
        throw new Error(`Failed to create blog: ${blogError.message}`);
      }

      if (!blogData) {
        throw new Error('Failed to create blog: No data returned');
      }

      // Then create the content
      const { error: contentError } = await supabase
        .from('blog_content')
        .insert([{
          blog_id: blogData.id,
          introduction: formData.introduction,
          sections: formData.sections
        }]);

      if (contentError) {
        console.error('Error creating blog content:', contentError);
        // Clean up the blog entry if content creation fails
        await supabase.from('blog').delete().eq('id', blogData.id);
        throw new Error(`Failed to create blog content: ${contentError.message}`);
      }

      // Finally create the metadata
      const { error: metadataError } = await supabase
        .from('blog_metadata')
        .insert([{
          blog_id: blogData.id,
          table_of_contents: formData.table_of_contents,
          faqs: formData.faqs
        }]);

      if (metadataError) {
        console.error('Error creating blog metadata:', metadataError);
        // Clean up previous entries if metadata creation fails
        await supabase.from('blog_content').delete().eq('blog_id', blogData.id);
        await supabase.from('blog').delete().eq('id', blogData.id);
        throw new Error(`Failed to create blog metadata: ${metadataError.message}`);
      }

      return blogData;
    } catch (error) {
      console.error('Error in createBlog:', error);
      throw error instanceof Error ? error : new Error('An unexpected error occurred while creating the blog');
    }
  },

  async updateBlog(id: string, blog: Partial<Blog>) {
    const { data, error } = await supabase
      .from('blog')
      .update(blog)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBlogContent(id: string, content: BlogContent) {
    const { data, error } = await supabase
      .from('blog_content')
      .update(content)
      .eq('blog_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBlogMetadata(id: string, metadata: BlogMetadata) {
    const { data, error } = await supabase
      .from('blog_metadata')
      .update(metadata)
      .eq('blog_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBlog(id: string) {
    // Delete metadata first (foreign key constraint)
    const { error: metadataError } = await supabase
      .from('blog_metadata')
      .delete()
      .eq('blog_id', id);

    if (metadataError) throw metadataError;

    // Delete content next (foreign key constraint)
    const { error: contentError } = await supabase
      .from('blog_content')
      .delete()
      .eq('blog_id', id);

    if (contentError) throw contentError;

    // Finally delete the blog
    const { error: blogError } = await supabase
      .from('blog')
      .delete()
      .eq('id', id);

    if (blogError) throw blogError;
  }
}; 