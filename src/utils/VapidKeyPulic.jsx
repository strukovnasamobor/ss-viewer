const VAPID_PUBLIC_KEY = "BH_8cEYwc80QEK7W-Njqus7nDNeLImi0_-gE7LbsCRh2URD0atkBMLpO10lj6qhGVkeQIw-G1ZFPopN_S_j9JLI";

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export { VAPID_PUBLIC_KEY, urlBase64ToUint8Array };
