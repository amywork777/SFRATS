import LocationButtons from './LocationButtons'
import InterestButton from './InterestButton'
import { FreeItem } from '../types'

interface ItemCardProps {
  item: FreeItem
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
      
      <div className="mt-2 flex justify-between items-center">
        <InterestButton 
          itemId={item.id} 
          initialCount={item.interest_count}
        />
      </div>
    </div>
  )
}

export default ItemCard 