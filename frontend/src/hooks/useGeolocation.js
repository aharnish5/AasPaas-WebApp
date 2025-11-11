import { useState } from 'react'

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState({
    loading: false,
    coordinates: null,
    error: null,
  })

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocation({
        loading: false,
        coordinates: null,
        error: 'Geolocation is not supported by your browser',
      })
      return
    }

    // Check if we're on HTTPS or localhost (required for geolocation)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      setLocation({
        loading: false,
        coordinates: null,
        error: 'Geolocation requires HTTPS or localhost. Please use a secure connection.',
      })
      return
    }

    console.log('Requesting geolocation...')
    
    // Reset state before making new request
    setLocation({
      loading: true,
      coordinates: null,
      error: null,
    })

    // Use watchPosition first to trigger permission prompt, then getCurrentPosition
    // This ensures the browser prompts for permission
    const geoOptions = {
      enableHighAccuracy: options.enableHighAccuracy || true, // Enable high accuracy for better results
      timeout: options.timeout || 15000, // Increase timeout to 15 seconds
      maximumAge: 0, // Don't use cached location - always get fresh
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Location obtained:', position.coords)
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        // Attempt reverse geocode fetch to enrich locality/city
        try {
          const res = await fetch(`/api/shops/reverse-geocode?lat=${coords.latitude}&lon=${coords.longitude}`)
          if (res.ok) {
            const data = await res.json()
            const loc = data.location || {}
            setLocation({
              loading: false,
              coordinates: coords,
              error: null,
              locality: loc.locality || '',
              city: loc.city || '',
              displayName: loc.displayName || loc.city || loc.locality || '',
            })
            return
          }
        } catch (err) {
          console.warn('Reverse geocode enrichment failed:', err.message)
        }
        // Fallback if reverse geocode fails
        setLocation({
          loading: false,
            coordinates: coords,
            error: null,
        })
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your device location settings.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
          default:
            errorMessage = `An error occurred: ${error.message || 'Unknown error'}`
            break
        }
        setLocation({
          loading: false,
          coordinates: null,
          error: errorMessage,
        })
      },
      geoOptions
    )
  }

  return { location, getLocation }
}

export default useGeolocation

