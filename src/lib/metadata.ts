import type { Metadata, Viewport } from "next";
// Centralized viewport configuration for all pages
export const defaultViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3B82F6",
};
// Base metadata for all pages
export const defaultMetadata: Metadata = {
  title: "Project Aqua - Water Management",
  description: "Water pump management system for rural Indian communities",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Project Aqua",
  },
  keywords: ["water management", "pump service", "rural community", "technician", "complaint tracking"],
  authors: [{ name: "Project Aqua Team" }],
  creator: "Project Aqua",
  publisher: "Project Aqua",
  robots: {
    index: true,
    follow: true,
  },
};
// Page-specific metadata generators
export const createPageMetadata = (title: string, description?: string): Metadata => ({
  title: `${title} | Project Aqua`,
  description: description || defaultMetadata.description,
});
// Generate viewport for consistency
export const createViewport = (): Viewport => defaultViewport; 