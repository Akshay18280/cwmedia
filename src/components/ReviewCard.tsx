import React from 'react';
import { Star, Linkedin, User, MapPin, Calendar } from 'lucide-react';
import type { FirebaseReview } from '../types/firebase';

interface ReviewCardProps {
  review: FirebaseReview;
  className?: string;
}

export default function ReviewCard({ review, className = '' }: ReviewCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Header with user info */}
      <div className="flex items-start gap-4 mb-4">
                 <div className="flex-shrink-0">
           {review.reviewerImage ? (
             <img
               src={review.reviewerImage}
               alt={review.reviewerName}
               className="w-12 h-12 rounded-full object-cover"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
               }}
             />
           ) : null}
           <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${review.reviewerImage ? 'hidden' : ''}`}>
             {review.reviewerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
           </div>
         </div>
        
        <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
             <h3 className="font-semibold text-gray-900 dark:text-white truncate">
               {review.reviewerName}
             </h3>
             {review.verified && (
               <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                 <Linkedin size={16} />
                 <span className="text-xs font-medium">Verified</span>
               </div>
             )}
           </div>
           
           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
             <User size={14} />
             <span>{review.reviewerPosition}</span>
             {review.reviewerCompany && (
               <>
                 <span>at</span>
                 <span className="font-medium">{review.reviewerCompany}</span>
               </>
             )}
           </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{review.workRelationship}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(review.submittedAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {renderStars(review.rating)}
        </div>
      </div>

      {/* Review content */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {review.title}
        </h4>
        
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {review.content}
        </p>
        
        {/* Skills mentioned */}
        {review.skills && review.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Skills:</span>
            {review.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        
        {/* Projects worked on */}
        {review.projectsWorkedOn && review.projectsWorkedOn.length > 0 && (
          <div className="pt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Projects: </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {review.projectsWorkedOn.join(', ')}
            </span>
          </div>
        )}
      </div>
      
             {/* LinkedIn link for verified users */}
       {review.verified && review.reviewerLinkedInUrl && (
         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
           <a
             href={review.reviewerLinkedInUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
           >
             <Linkedin size={16} />
             <span>View LinkedIn Profile</span>
           </a>
         </div>
       )}
    </div>
  );
} 