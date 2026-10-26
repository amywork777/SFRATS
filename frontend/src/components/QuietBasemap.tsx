import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { StyleSpecification, SymbolLayerSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import neighborhoods from '../data/sf-neighborhoods.json'

// Authored SF Rats style using OpenFreeMap's OpenMapTiles schema.
// https://openfreemap.org/quick_start/ - attribution is retained below.
const source = { source: 'city', 'source-layer': 'transportation' }
const labels: NonNullable<SymbolLayerSpecification['layout']> = { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'] }
const style: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { city: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' }, neighborhoods: { type: 'geojson', data: neighborhoods as GeoJSON.FeatureCollection } },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': '#f4eedf' } },
    { id: 'green-space', type: 'fill', source: 'city', 'source-layer': 'landcover', filter: ['in', 'class', 'wood', 'grass'], paint: { 'fill-color': '#a9d58c', 'fill-opacity': 1 } },
    { id: 'parks', type: 'fill', source: 'city', 'source-layer': 'park', paint: { 'fill-color': '#a9d58c', 'fill-opacity': 1 } },
    { id: 'bay', type: 'fill', source: 'city', 'source-layer': 'water', paint: { 'fill-color': '#91cde8' } },
    { id: 'waterway', type: 'line', source: 'city', 'source-layer': 'waterway', paint: { 'line-color': '#91cde8', 'line-width': 1 } },
    { id: 'buildings', type: 'fill', source: 'city', 'source-layer': 'building', minzoom: 16, paint: { 'fill-color': '#e1d4c4' } },
    { id: 'streets', type: 'line', ...source, filter: ['!in', 'class', 'rail', 'transit', 'ferry', 'path', 'track'], paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 14, 1.8, 18, 8] } },
    { id: 'major-road-edge', type: 'line', ...source, filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'], paint: { 'line-color': '#d7b672', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 4, 18, 13] } },
    { id: 'major-roads', type: 'line', ...source, filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'], paint: { 'line-color': '#f6d68b', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 2.5, 18, 10] } },
    { id: 'street-names', type: 'symbol', source: 'city', 'source-layer': 'transportation_name', minzoom: 14, layout: { ...labels, 'symbol-placement': 'line', 'text-size': 11, 'text-max-angle': 25 }, paint: { 'text-color': '#615e52', 'text-halo-color': '#f4eedf', 'text-halo-width': 1.5 } },
    { id: 'neighborhoods', type: 'symbol', source: 'city', 'source-layer': 'place', minzoom: 12, filter: ['all', ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false], ['!', ['within', { type: 'Polygon', coordinates: [[[-122.52, 37.7], [-122.35, 37.7], [-122.35, 37.84], [-122.52, 37.84], [-122.52, 37.7]]] }]]], layout: { ...labels, 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 12, 15, 15], 'text-max-width': 10, 'text-padding': 3, 'text-variable-anchor': ['center', 'top', 'bottom'], 'text-radial-offset': 0.5 }, paint: { 'text-color': '#435943', 'text-halo-color': '#f4eedf', 'text-halo-width': 2 } },
    { id: 'sf-neighborhoods', type: 'symbol', source: 'neighborhoods', minzoom: 11.5, layout: { ...labels, 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 12, 15, 15], 'text-max-width': 10, 'text-padding': 4, 'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'], 'text-radial-offset': 0.6 }, paint: { 'text-color': '#435343', 'text-halo-color': '#f4eedf', 'text-halo-width': 2 } },
    { id: 'cities', type: 'symbol', source: 'city', 'source-layer': 'place', maxzoom: 12, filter: ['in', 'class', 'city', 'town'], layout: { ...labels, 'text-size': 14, 'text-letter-spacing': 0.02, 'text-padding': 20 }, paint: { 'text-color': '#344e40', 'text-halo-color': '#f4eedf', 'text-halo-width': 2 } },
    { id: 'water-names', type: 'symbol', source: 'city', 'source-layer': 'water_name', filter: ['==', '$type', 'Point'], layout: { ...labels, 'text-size': 13, 'text-letter-spacing': 0.06 }, paint: { 'text-color': '#326580', 'text-halo-color': '#91cde8', 'text-halo-width': 1 } },
  ],
}
const attribution = '<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">OpenMapTiles</a> · <a href="https://data.sf.gov/Geographic-Locations-and-Boundaries/Analysis-Neighborhoods/j2bu-swwd">DataSF</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export default function QuietBasemap() {
  const map = useMap()
  useEffect(() => {
    let disposed = false
    let layer: L.Layer | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    let ready = false
    let fallbackUsed = false
    map.attributionControl?.addAttribution(attribution)
    const fallback = () => {
      if (disposed || fallbackUsed || ready) return
      fallbackUsed = true
      clearTimeout(timeout)
      if (layer) map.removeLayer(layer)
      layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    }
    // The vector renderer is loaded only when the map is shown.
    Promise.all([
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
    ]).then(([adapter, libre, worker]) => {
      if (disposed) return
      libre.setWorkerUrl(worker.default)
      const vector = adapter.maplibreGL({ style, attributionControl: false, interactive: false })
      layer = vector
      vector.addTo(map)
      const renderer = vector.getMaplibreMap()
      renderer.once('idle', () => { ready = true; clearTimeout(timeout) })
      renderer.on('error', fallback)
      timeout = setTimeout(fallback, 15000)
    }).catch(fallback)
    return () => {
      disposed = true
      clearTimeout(timeout)
      if (layer) map.removeLayer(layer)
      map.attributionControl?.removeAttribution(attribution)
    }
  }, [map])
  return null
}
