import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Define Supabase error interface
interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

// Validation schema for blog data
const blogSchema = z.object({
  // Basic Info
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  category: z.string().min(1, 'Category is required'),
  read_time: z.string().min(1, 'Read time is required'),
  author_name: z.string().min(1, 'Author name is required'),
  author_role: z.string().min(1, 'Author role is required'),
  author_image: z.string().min(1, 'Author image is required'),
  publish_date: z.string().min(1, 'Publish date is required'),
  last_updated: z.string().min(1, 'Last updated date is required'),
  likes: z.number().int().min(0, 'Likes must be a non-negative number').optional().default(0),
  cover_image: z.string().min(1, 'Cover image is required'),
  is_featured: z.boolean(),
  
  // Content
  introduction: z.string().min(1, 'Introduction is required'),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'Section title is required'),
    content: z.array(z.string().min(1, 'Content cannot be empty')),
    highlights: z.array(z.object({
      title: z.string(),
      items: z.array(z.string())
    })).optional()
  })).min(1, 'At least one section is required'),
  
  // Metadata
  table_of_contents: z.array(z.object({
    id: z.string(),
    title: z.string()
  })),
  faqs: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required')
  }))
});

export async function POST(request: Request) {
  try {
    console.log('Starting blog creation...');
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    // Validate the request body
    console.log('Validating request data...');
    const validatedData = blogSchema.parse(body);
    console.log('Validation successful');

    // Step 1: Insert into blog table
    console.log('Inserting into blog table with data:', JSON.stringify({
      slug: validatedData.slug,
      title: validatedData.title,
      excerpt: validatedData.excerpt,
      category: validatedData.category,
      read_time: validatedData.read_time,
      author_name: validatedData.author_name,
      author_role: validatedData.author_role,
      author_image: validatedData.author_image,
      publish_date: validatedData.publish_date,
      last_updated: validatedData.last_updated,
      likes: validatedData.likes || 0,
      cover_image: validatedData.cover_image,
      is_featured: validatedData.is_featured
    }, null, 2));

    const { data: blogData, error: blogError } = await supabase
      .from('blog')
      .insert({
        slug: validatedData.slug,
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        category: validatedData.category,
        read_time: validatedData.read_time,
        author_name: validatedData.author_name,
        author_role: validatedData.author_role,
        author_image: validatedData.author_image,
        publish_date: validatedData.publish_date,
        last_updated: validatedData.last_updated,
        likes: validatedData.likes || 0,
        cover_image: validatedData.cover_image,
        is_featured: validatedData.is_featured
      })
      .select('id')
      .single();

    if (blogError) {
      console.error('Error inserting blog:', JSON.stringify(blogError, null, 2));
      throw blogError;
    }

    if (!blogData) {
      throw new Error('Failed to create blog: No data returned');
    }

    const blogId = blogData.id;
    console.log('Blog created with ID:', blogId);

    // Step 2: Insert into blog_content table
    console.log('Inserting into blog_content table with data:', JSON.stringify({
      blog_id: blogId,
      introduction: validatedData.introduction,
      sections: validatedData.sections
    }, null, 2));

    const { error: contentError } = await supabase
      .from('blog_content')
      .insert({
        blog_id: blogId,
        introduction: validatedData.introduction,
        sections: validatedData.sections
      });

    if (contentError) {
      console.error('Error inserting blog content:', JSON.stringify(contentError, null, 2));
      // Clean up the blog entry if content insertion fails
      await supabase.from('blog').delete().eq('id', blogId);
      throw contentError;
    }

    // Step 3: Insert into blog_metadata table
    console.log('Inserting into blog_metadata table with data:', JSON.stringify({
      blog_id: blogId,
      table_of_contents: validatedData.table_of_contents,
      faqs: validatedData.faqs
    }, null, 2));

    const { error: metadataError } = await supabase
      .from('blog_metadata')
      .insert({
        blog_id: blogId,
        table_of_contents: validatedData.table_of_contents,
        faqs: validatedData.faqs
      });

    if (metadataError) {
      console.error('Error inserting blog metadata:', JSON.stringify(metadataError, null, 2));
      // Clean up previous insertions if metadata insertion fails
      await supabase.from('blog_content').delete().eq('blog_id', blogId);
      await supabase.from('blog').delete().eq('id', blogId);
      throw metadataError;
    }

    console.log('Blog creation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      blogId
    });

  } catch (error) {
    console.error('Error creating blog:', JSON.stringify(error, null, 2));
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          path: err.path,
          message: err.message
        }))
      }, { status: 400 });
    }

    // Handle Supabase errors with proper typing
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as SupabaseError;
      console.error('Supabase error details:', JSON.stringify({
        code: supabaseError.code,
        message: supabaseError.message,
        details: supabaseError.details,
        hint: supabaseError.hint
      }, null, 2));

      switch (supabaseError.code) {
        case '23505':
          return NextResponse.json({
            success: false,
            message: 'A blog with this slug already exists',
            error: supabaseError.message
          }, { status: 409 });
        case '42703':
          return NextResponse.json({
            success: false,
            message: 'Database schema error',
            error: `Invalid column in request: ${supabaseError.message}`
          }, { status: 400 });
        default:
          return NextResponse.json({
            success: false,
            message: 'Database error',
            error: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint
          }, { status: 500 });
      }
    }

    // Handle generic errors
    return NextResponse.json({
      success: false,
      message: 'Failed to create blog',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 