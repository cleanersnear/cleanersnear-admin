'use client'

import Image from 'next/image'

interface BlogImageProps {
    src: string
    alt: string
    className?: string
    width?: number
    height?: number
    fill?: boolean
    priority?: boolean
}

export default function BlogImage({ 
    src, 
    alt,
    className,
    width,
    height,
    fill,
    priority = false
}: BlogImageProps) {
    // Handle both Supabase URLs and local paths
    const imageUrl = src.includes('supabase.co') 
        ? src.replace(/([^:]\/)\/+/g, "$1")  // Clean up Supabase URLs
        : src.startsWith('/') ? src : `/${src}`  // Handle local paths

    // If width and height are provided, don't use fill
    const shouldFill = fill && !width && !height

    return (
        <Image
            src={imageUrl}
            alt={alt}
            {...(shouldFill 
                ? { fill: true } 
                : { width: width || 100, height: height || 100 }
            )}
            unoptimized={true}
            className={`${className} ${shouldFill ? 'absolute inset-0' : ''}`}
            priority={priority}
        />
    )
}
