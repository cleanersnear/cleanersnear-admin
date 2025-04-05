"use client"

import { useState } from 'react'
import { FAQ as FAQType } from './types'

interface FAQProps {
    questions: FAQType[];
}

export default function FAQ({ questions }: FAQProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (!questions || questions.length === 0) return null;

    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {questions.map((faq, index) => (
                    <div 
                        key={index} 
                        className="border-b border-gray-200 last:border-0"
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex justify-between items-start py-4 text-left"
                        >
                            <h3 className="font-medium pr-4">{faq.question}</h3>
                            <span className="text-[#1E3D8F] transform transition-transform duration-200
                                {openIndex === index ? 'rotate-180' : ''}"
                            >
                                <svg 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 14 14"
                                    fill="none" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path 
                                        d="M2 5L7 10L12 5" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </button>
                        {openIndex === index && (
                            <div className="pb-4 text-gray-600">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 