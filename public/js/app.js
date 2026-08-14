/**
 * UniVault — Core Application Script (app.js)
 * Navigation logic lives in navbar.js — do not duplicate here.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ [UniVault] App initialized');
    pingHealth();
});

/** Ping backend health endpoint */
async function pingHealth() {
    try {
        const apiUrl = (typeof getUniVaultApiUrl === 'function') ? getUniVaultApiUrl('/api/health') : '/api/health';
        const res = await fetch(apiUrl);
        if (res.ok) {
            const data = await res.json();
            console.log('🟢 [UniVault API]:', data.status, '@', data.timestamp);
        }
    } catch {
        console.warn('⚠️ [UniVault]: Running in static/offline mode.');
    }
}
