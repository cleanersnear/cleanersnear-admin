import Link from 'next/link'

interface CallToActionProps {
    title?: string;
    description?: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonLink?: string;
}

export default function CallToAction({
    title = "Ready to Transform Your Carpets?",
    description = "Experience the difference professional carpet cleaning can make. Book now and enjoy 10% off your first service. Our team of experts is ready to restore your carpets to their original beauty.",
    primaryButtonText = "Get a Free Quote",
    secondaryButtonText = "View Services",
    primaryButtonLink = "/get-quote",
    secondaryButtonLink = "/services"
}: CallToActionProps) {
    return (
        <div className="bg-[#1E3D8F] text-white p-8 rounded-2xl my-12">
            <h3 className="text-2xl font-bold mb-4">
                {title}
            </h3>
            <p className="mb-6 text-gray-200">
                {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                    href={primaryButtonLink} 
                    className="bg-white text-[#1E3D8F] px-6 py-3 sm:px-8 sm:py-4 rounded-lg 
                        font-medium hover:bg-gray-100 transition-all duration-200 
                        text-center"
                >
                    {primaryButtonText}
                </Link>
                <Link 
                    href={secondaryButtonLink} 
                    className="border border-white text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg 
                        font-medium hover:bg-white/10 transition-all duration-200
                        text-center"
                >
                    {secondaryButtonText}
                </Link>
            </div>
        </div>
    )
} 