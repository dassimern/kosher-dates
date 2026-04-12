# Running Kosher Restaurants Locally

## 🚀 Quick Start

### Option 1: Using the Start Script (Recommended)

**Open Terminal and run:**
```bash
cd /Users/dassieliach/Documents/GitHub/kosher-dates
./start-server.sh
```

Then open your browser to: **http://localhost:8000/index.html**

---

### Option 2: Direct Python Command

**Open Terminal and run:**
```bash
cd /Users/dassieliach/Documents/GitHub/kosher-dates
python3 -m http.server 8000
```

Then open your browser to: **http://localhost:8000/index.html**

---

### Option 3: Using VS Code Live Server

If you have VS Code installed:

1. Install the **Live Server** extension (by Ritwick Dey)
2. Right-click on `index.html`
3. Click "Open with Live Server"
4. Browser will open automatically

---

### Option 4: Using Node.js (if you have it)

```bash
cd /Users/dassieliach/Documents/GitHub/kosher-dates
npx http-server -p 8000
```

---

## 📄 Pages to Access

Once the server is running, open these URLs in your browser:

- **Main Page (List View)**: http://localhost:8000/index.html
- **Map View**: http://localhost:8000/map.html
- **Manager Panel**: http://localhost:8000/manager.html
- **API Test**: http://localhost:8000/test-api.html
- **Map Debug**: http://localhost:8000/map-debug.html

---

## ⚠️ Stopping the Server

Press **Ctrl+C** in the terminal to stop the server.

---

## 🔧 Troubleshooting

### "Port 8000 is already in use"

If you get this error, either:
- Stop the other process using port 8000
- Use a different port: `python3 -m http.server 8001`

### "Command not found: python3"

Try:
```bash
python -m http.server 8000
```

### "Permission denied"

Make the script executable:
```bash
chmod +x start-server.sh
```

### Page loads but shows errors

- Check browser console (F12)
- Make sure Google Apps Script is configured (see BACKEND_UPDATE.md)
- Verify your API key is correct in both HTML files

---

## 📱 Access from Phone/Tablet on Same Network

1. Start the server
2. Find your computer's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. On your phone/tablet, open: `http://YOUR_IP:8000/index.html`

Example: `http://192.168.1.100:8000/index.html`

---

## 🌐 Deployment

To deploy to production, you can:

1. **GitHub Pages**: 
   - Push to GitHub
   - Enable GitHub Pages in repository settings
   - Access at: `https://yourusername.github.io/kosher-dates/`

2. **Netlify** (Recommended):
   - Drag and drop the folder to https://app.netlify.com/drop
   - Get instant live URL

3. **Vercel**:
   - Run: `npx vercel`
   - Follow prompts

---

## ✅ Verification

After starting the server, you should see:
- No errors in terminal
- Browser opens the page successfully
- Restaurants load (or show error if backend not configured)

If you see restaurants loading, everything is working! 🎉
