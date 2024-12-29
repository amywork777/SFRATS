import React from 'react';

interface EventPopupProps {
  title: string;
  description: string;
  event_date: string;
  categories: string[];
}

function EventPopup({ title, description, event_date, categories }: EventPopupProps) {
  return (
    <div className="event-popup">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="mb-2">{description}</p>
      <p className="text-sm text-gray-600 mb-2">
        Date: {new Date(event_date).toLocaleDateString()}
      </p>
      <div className="flex flex-wrap gap-1">
        {categories?.map((category, index) => (
          <span 
            key={index}
            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
          >
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}

export default EventPopup; 