/**
 * Check if geolocation permission is granted, denied, or prompt
 * Note: This API is not available in all browsers
 */
export const checkGeolocationPermission = async () => {
  if (!navigator.permissions || !navigator.permissions.query) {
    // Permissions API not supported - can't check status
    return null
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state // 'granted', 'denied', or 'prompt'
  } catch (error) {
    console.error('Error checking geolocation permission:', error)
    return null
  }
}

/**
 * Watch for permission changes
 */
export const watchGeolocationPermission = (callback) => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return null
  }

  navigator.permissions.query({ name: 'geolocation' }).then((result) => {
    callback(result.state)
    
    result.addEventListener('change', () => {
      callback(result.state)
    })
  })

  return () => {
    // Cleanup if needed
  }
}

