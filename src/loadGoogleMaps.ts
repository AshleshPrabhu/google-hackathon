let googleMapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (window.google) return Promise.resolve();

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS
      }`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}
