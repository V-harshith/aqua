// Utility function for exporting data - add this to EnhancedAdminDashboard
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

// Replace line 77-97 in EnhancedAdminDashboard.tsx with:
const exportData = async (type: string, format: 'csv' | 'json' = 'csv') => {
    try {
        setIsExporting(true);
        const filename = await exportDataToFile(type, format);
        success({
            title: `${type.toUpperCase()} Export Complete!`,
            message: `Downloaded ${filename}`
        });
    } catch (err: any) {
        console.error('Export error:', err);
        error({
            title: 'Export Failed',
            message: err.message || 'Unknown error occurred'
        });
    } finally {
        setIsExporting(false);
    }
};
