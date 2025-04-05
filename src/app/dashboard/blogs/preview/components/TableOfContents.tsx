"use client"

import { TableOfContentsItem } from './types'

interface TableOfContentsProps {
    items: TableOfContentsItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
    if (!items || items.length === 0) return null;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 120; // Increased from 100 to 120 for more space
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            window.history.pushState({}, '', `#${id}`);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <nav>
                <ul className="space-y-3">
                    {items.map((item) => (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => handleClick(e, item.id)}
                                className="text-gray-600 hover:text-[#1E3D8F] transition-colors duration-200"
                            >
                                {item.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
} 