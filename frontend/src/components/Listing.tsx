import { MapIcon } from '@heroicons/react/24/outline';

interface ListingProps {
  listing: {
    id: number;
    title: string;
    description: string;
    address: string;
    location_lat: number;
    location_lng: number;
    // Add other listing properties as needed
  }
}

function Listing({ listing }: ListingProps) {
  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!listing.location_lat || !listing.location_lng) return;
    
    const mapsUrl = `https://www.google.com/maps?q=${listing.location_lat},${listing.location_lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="listing-detail">
      <div className="listing-actions">
        <button 
          onClick={openInGoogleMaps}
          className="flex items-center justify-center gap-1 bg-gray-100 
                   text-gray-700 py-2 px-4 rounded hover:bg-gray-200 
                   transition-colors text-sm"
        >
          🗺️ Maps
        </button>
      </div>
    </div>
  );
} 