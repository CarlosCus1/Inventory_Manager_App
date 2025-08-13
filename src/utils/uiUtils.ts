// src/utils/uiUtils.ts
export function mostrarToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    console.log(`Toast (${type}): ${message}`);
    // In a real application, you would typically render a UI component for the toast.
    // For now, we'll just log it.
    alert(`${type.toUpperCase()}: ${message}`); // Using alert for immediate feedback
}

export function mostrarLoading(show: boolean, message: string = 'Cargando...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');

    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

export function downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

export function normalizeStringForFilename(str: string): string {
    if (!str) return '';
    return str
        .normalize("NFD") // Normalize to NFD (Normalization Form Canonical Decomposition)
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .toLowerCase() // Convert to lowercase
        .replace(/[^a-z0-9\s]/g, "") // Remove non-alphanumeric characters (except spaces)
        .trim() // Trim leading/trailing whitespace
        .replace(/\s+/g, "_"); // Replace spaces with underscores
}