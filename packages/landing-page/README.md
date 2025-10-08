# Ask Akasha Landing Page

A modern, responsive landing page for the Ask Akasha AI Knowledge Base Platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Modern Landing Page**: Hero section, features, pricing, and call-to-action
- **Admin Dashboard**: Login, registration, and dashboard interface
- **Mobile App Page**: Download links and app information
- **Contact Form**: Contact page with form submission
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **SEO Optimized**: Proper meta tags and structured data

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Email**: Resend (ready for integration)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the landing page directory:
   ```bash
   cd packages/landing-page
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
packages/landing-page/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/page.tsx      # Admin login page
│   │   │   ├── register/page.tsx   # Admin registration
│   │   │   └── dashboard/page.tsx  # Admin dashboard
│   │   ├── mobile/page.tsx         # Mobile app download page
│   │   ├── contact/page.tsx        # Contact form page
│   │   ├── layout.tsx              # Root layout with navigation
│   │   └── page.tsx                # Home page
│   └── components/
│       ├── Hero.tsx                # Hero section
│       ├── Features.tsx            # Features section
│       ├── Pricing.tsx             # Pricing section
│       ├── CTA.tsx                 # Call to action
│       └── Footer.tsx              # Footer
├── public/                         # Static assets
├── package.json
└── README.md
```

## Pages

### Home Page (`/`)
- Hero section with main value proposition
- Features showcase
- Pricing tiers
- Call to action
- Footer with links

### Admin Pages (`/admin/*`)
- **Login** (`/admin/login`): Admin authentication
- **Register** (`/admin/register`): Admin account creation
- **Dashboard** (`/admin/dashboard`): Admin dashboard with stats and quick actions

### Mobile App (`/mobile`)
- App download links for iOS and Android
- Feature highlights
- QR code for easy download

### Contact (`/contact`)
- Contact form with validation
- Company contact information
- Success/error states

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env.local` file for local development:

```env
# Email service (Resend)
RESEND_API_KEY=your_resend_api_key

# Backend API
NEXT_PUBLIC_API_BASE_URL=https://your-railway-backend.railway.app
```

## Integration with Backend

The landing page is designed to integrate with your existing Railway backend:

- Admin login/registration connects to your auth endpoints
- Contact form can send emails via Resend
- User invites can be managed through the admin dashboard

## Customization

### Branding
- Update colors in `tailwind.config.js`
- Replace logo and favicon in `public/`
- Modify company information in components

### Content
- Edit text content in component files
- Update pricing in `Pricing.tsx`
- Modify features in `Features.tsx`

### Styling
- Customize Tailwind classes in components
- Add custom CSS in `globals.css`
- Modify responsive breakpoints as needed

## Future Enhancements

- [ ] Email verification system
- [ ] User invite functionality
- [ ] Admin invite system
- [ ] Analytics integration
- [ ] A/B testing
- [ ] Blog section
- [ ] Documentation pages

## Support

For questions or support, please contact:
- Email: hello@askakasha.com
- GitHub Issues: [Create an issue](../../issues)

## License

This project is part of the Ask Akasha platform. All rights reserved.