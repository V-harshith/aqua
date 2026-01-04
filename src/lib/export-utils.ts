import { supabase } from './supabase';

// Utility function for exporting data from Enhanced Admin Dashboard
export async function exportDataToFile(type: string, format: 'csv' | 'json' = 'csv') {
    try {
        // Get session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('Please log in to export data');
        }

        // Call export API
        const response = await fetch(`/api/admin/export?type=${type}&format=${format}`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Export failed');
        }

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        a.download = filenameMatch ? filenameMatch[1] : `${type}_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return a.download;
    } catch (error) {
        throw error;
    }
}
