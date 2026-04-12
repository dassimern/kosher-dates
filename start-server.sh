#!/bin/bash
# Start local server for Kosher Restaurants project

echo "🚀 Starting local server..."
echo "📂 Project directory: $(pwd)"
echo ""
echo "🌐 Server will be available at:"
echo "   http://localhost:8000"
echo ""
echo "📄 Pages:"
echo "   • Main page (List): http://localhost:8000/index.html"
echo "   • Map view: http://localhost:8000/map.html"
echo "   • Manager panel: http://localhost:8000/manager.html"
echo ""
echo "⚠️  Press Ctrl+C to stop the server"
echo ""
echo "Starting server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 -m http.server 8000
