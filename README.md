# ScanSave - Team 10

By Sebastian (set29), Ash (at613), Patrick (pgc8) and Yunus (ya129)

**View the deployed project at [scansave.in](https://scansave.in)!**

A modern web application that helps users scan food products to understand their nutritional value, environmental impact, and get AI-powered insights about their food choices.

## Features

- Barcode scanning using device camera
- Detailed nutritional information
- AI-powered insights and recommendations
- Price tracking and comparison
- Budget tracking and savings goal setting
- Environmental impact and recycling information
- Dark/Light theme support
- Responsive design for all devices

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A modern web browser
- A device with a camera (for barcode scanning)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/evisos-ons/ibm-hackathon-2025
cd ibm-hackathon-2025
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

Alternatively, you can export the Gemini API key in your terminal:
```bash
export GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key for client-side access
- `GEMINI_API_KEY`: Your Google Gemini API key for AI features

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend and authentication
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI insights
- [HTML5-QRCode](https://github.com/mebjas/html5-qrcode) - Barcode scanning
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library

## Features in Detail

### Barcode Scanning
- Camera-based barcode scanning
- Manual barcode entry option
- Support for various barcode formats

### Product Information
- Detailed nutritional values
- Ingredient lists
- Allergen information
- Environmental impact assessment
- Recycling guidelines

### AI Insights
- Health analysis
- Alternative product suggestions
- Usage tips and recommendations
- Environmental impact analysis

### User Experience
- Intuitive step-by-step flow
- Portion size selection
- Price tracking
- Dark/Light theme toggle
- Responsive design for all screen sizes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
