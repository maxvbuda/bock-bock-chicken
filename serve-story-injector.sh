#!/bin/bash
echo "🚀 Starting local server for Story Image Injector..."
echo "📂 Serving from: $(pwd)"
echo ""
echo "Open in your browser:"
echo "👉 http://localhost:8000/story-image-injector.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000
