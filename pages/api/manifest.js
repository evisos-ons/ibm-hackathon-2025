export default function handler(req, res) {
  const theme = req.query.theme || 'light';
  
  const manifest = {
    name: "ScanSave",
    short_name: "ScanSave",
    description: "Scan and track your product purchases",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: theme === 'dark' ? '#020817' : '#ffffff',
    theme_color: theme === 'dark' ? '#020817' : '#ffffff',
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.status(200).json(manifest);
} 