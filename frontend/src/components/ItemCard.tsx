import LocationButtons from './LocationButtons'

interface ItemCardProps {
  item: {
    title: string
    description: string
    location_lat: number
    location_lng: number
    location_address: string
    // ... other item properties
  }
}

function ItemCard({ item }: ItemCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-bold text-lg">{item.title}</h3>
      <p className="text-gray-600">{item.description}</p>
      
      <div className="text-sm text-gray-500">
        <div>Location: {item.location_address}</div>
        <LocationButtons
          lat={item.location_lat}
          lng={item.location_lng}
          address={item.location_address}
        />
      </div>
    </div>
  )
}

export default ItemCard 