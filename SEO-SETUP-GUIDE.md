# SEO & Social Media Setup Guide

## 📋 Current Status

### ✅ What's Already Set Up:
- Basic metadata in `layout.tsx`
- Robots.txt (`robots.ts`)
- Dynamic sitemap (`sitemap.ts`)
- Open Graph tags
- Twitter Card tags

### ❌ What Needs to Be Done:
1. **Favicon** - Currently has basic favicon, needs modern formats
2. **OG Image** - Referenced but doesn't exist (`/og-image.jpg`)
3. **Dynamic Metadata** - Poet and poem pages need individual metadata
4. **Google Verification** - Placeholder code needs real verification

---

## 1. 🎨 Favicon Requirements

### File Location:
- Place in: `public/` directory
- Next.js will automatically serve from `public/favicon.ico`

### Required Formats & Sizes:

#### **Primary Favicon (favicon.ico)**
- **Format:** ICO (Windows icon format)
- **Sizes:** Multi-size ICO file containing:
  - 16x16 pixels
  - 32x32 pixels
  - 48x48 pixels (optional, but recommended)

#### **Modern Favicon Set (Optional but Recommended)**
Place these in `public/`:

1. **apple-touch-icon.png**
   - Size: 180x180 pixels
   - Format: PNG
   - Used by iOS devices

2. **favicon-32x32.png**
   - Size: 32x32 pixels
   - Format: PNG

3. **favicon-16x16.png**
   - Size: 16x16 pixels
   - Format: PNG

4. **android-chrome-192x192.png**
   - Size: 192x192 pixels
   - Format: PNG
   - Used by Android devices

5. **android-chrome-512x512.png**
   - Size: 512x512 pixels
   - Format: PNG
   - Used by Android devices

### Design Tips:
- Use your logo or a simple, recognizable icon
- Ensure it's readable at small sizes (16x16)
- Test in both light and dark backgrounds
- Consider RTL/language context (Persian text might be too small)

### Tools to Create:
- [Favicon.io](https://favicon.io/) - Generate from image or text
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Complete favicon generator
- [Canva](https://canva.com/) - Design tool

---

## 2. 📱 Social Media Preview Image (OG Image)

### File Location:
- Place in: `public/og-image.jpg` (or `.png`)
- Currently referenced in `layout.tsx` as `/og-image.jpg`

### Required Specifications:

#### **Primary OG Image**
- **Format:** JPG or PNG (JPG recommended for smaller file size)
- **Size:** 1200x630 pixels (1.91:1 aspect ratio)
- **File Size:** Under 1MB (aim for 200-500KB)
- **Colors:** RGB color space

#### **What to Include:**
- Site name: "دفتر گنج" (Defter Ganj)
- Tagline/subtitle: "مجموعه‌ای از بهترین اشعار فارسی"
- Visual elements: Persian poetry theme, calligraphy, or elegant design
- Brand colors: Match your site's color scheme

#### **Platforms Using This:**
- Facebook
- Twitter/X
- LinkedIn
- WhatsApp
- Telegram
- Most messaging apps

### Design Tips:
- Keep text large and readable
- Use high contrast
- Include your logo/branding
- Test how it looks when cropped (some platforms crop differently)
- Consider both light and dark mode appearances

### Tools to Create:
- [Canva](https://canva.com/) - Templates available
- [Figma](https://figma.com/) - Design tool
- [Photoshop](https://www.adobe.com/products/photoshop.html) - Professional design

---

## 3. 🔍 SEO Improvements Needed

### A. Dynamic Metadata for Pages

#### **Poet Pages** (`/poet/[id]`)
Need to add metadata export:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch poet data
  // Return dynamic title, description, OG image, etc.
}
```

#### **Poem Pages** (`/poem/[id]`)
Need to add metadata export:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch poem data
  // Return dynamic title, description, OG image with poem preview
}
```

### B. Structured Data (JSON-LD)

Add structured data for:
- **Organization** - Site information
- **WebSite** - Search functionality
- **BreadcrumbList** - Navigation structure
- **Article** (for poems) - Poem content

### C. Google Search Console

1. Update verification code in `layout.tsx`:
   ```typescript
   verification: {
     google: 'your-actual-verification-code',
   },
   ```

2. Submit sitemap to Google Search Console:
   - `https://www.ganj.directory/sitemap.xml`

### D. Additional Meta Tags

Consider adding:
- **Alternate languages** (if multi-language)
- **Author tags** (for poems)
- **Article tags** (for poems)
- **Canonical URLs** (already partially implemented)

---

## 📝 Next Steps

1. **Prepare Assets:**
   - Create favicon (ICO format with multiple sizes)
   - Create OG image (1200x630px JPG)

2. **After Assets Ready:**
   - I'll update the code to:
     - Add favicon links to HTML head
     - Add dynamic metadata for poet/poem pages
     - Add structured data (JSON-LD)
     - Update verification codes

3. **Testing:**
   - Test OG image: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Test Twitter card: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - Test favicon: [Favicon Checker](https://realfavicongenerator.net/favicon_checker)

---

## 🎯 Priority

1. **High Priority:**
   - OG Image (needed for social sharing)
   - Favicon (basic branding)

2. **Medium Priority:**
   - Dynamic metadata for pages
   - Structured data

3. **Low Priority:**
   - Additional favicon formats
   - Google verification

---

Ready when you are! Just prepare the favicon and OG image, and I'll handle the code updates. 🚀

