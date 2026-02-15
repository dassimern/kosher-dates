# Google Maps API Setup Instructions

To enable address autocomplete functionality, you need to get a Google Maps API key and configure it in your project.

## Steps to Get Google Maps API Key:

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" at the top
4. Click "New Project"
5. Enter a project name (e.g., "Kosher Restaurants")
6. Click "Create"

### 2. Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Places API"
3. Click on "Places API" and click "Enable"
4. Also search for and enable "Maps JavaScript API"

### 3. Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Your API key will be created and displayed
4. Copy the API key

### 4. Restrict Your API Key (Recommended for Security)
1. Click on your newly created API key
2. Under "Application restrictions", select "HTTP referrers (websites)"
3. Add your website URLs:
   - For local testing: `http://localhost:*` or `http://127.0.0.1:*`
   - For production: `https://yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Check only:
   - Places API
   - Maps JavaScript API
6. Click "Save"

### 5. Configure Your Project

Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key in these files:

**In `index.html`:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places&language=iw"></script>
```

**In `manager.html`:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places&language=iw"></script>
```

## Important Notes:

- **Billing**: Google Maps requires billing to be enabled, but provides $200 of free usage per month, which is more than enough for most small projects
- **Security**: Always restrict your API key to specific domains to prevent unauthorized use
- **Language**: The API is configured with `language=iw` for Hebrew addresses
- **Country**: The autocomplete is restricted to Israel (`componentRestrictions: { country: 'il' }`)

## Testing

After adding your API key:
1. Open your website
2. Click "Add New Restaurant"
3. Start typing an address in the Address field
4. You should see autocomplete suggestions from Google Maps

## Troubleshooting

If autocomplete doesn't work:
1. Check the browser console for errors
2. Verify your API key is correct
3. Ensure Places API and Maps JavaScript API are enabled
4. Check that billing is enabled in Google Cloud Console
5. Verify the API key restrictions allow your domain

## Cost Estimation

- **Autocomplete - Per Session**: $2.83 per 1,000 sessions
- **Free tier**: First $200 per month is free
- **Typical usage**: With the free tier, you can have thousands of address searches per month at no cost

For most small to medium projects, the free tier will be sufficient.
