import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import EventPopup from './EventPopup';

interface EventMarkerProps {
  id: number;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  event_date: string;
  categories: string[];
}

// Create a single default icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create category-based colors
const categoryColors = {
  Music: '#FF5733',
  Food: '#33FF57',
  Art: '#3357FF',
  default: '#808080'
};

function EventMarker(props: EventMarkerProps) {
  const { id, title, description, location_lat, location_lng, event_date, categories } = props;

  return (
    <Marker
      key={id}
      position={[Number(location_lat), Number(location_lng)]}
      icon={defaultIcon}
    >
      <Popup>
        <EventPopup
          title={title}
          description={description}
          event_date={event_date}
          categories={categories}
        />
      </Popup>
    </Marker>
  );
}

export default EventMarker; 