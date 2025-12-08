#!/usr/bin/env python3
"""Split illustrated-stories-5.html into smaller parts for GitHub"""

import re
import os

# Read the full file
with open('illustrated-stories-5.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all story divs (including the wrapper div with image)
stories = re.findall(r'<div>\s*<img[^>]*>.*?<div class="story">.*?</div>\s*</div>', content, re.DOTALL)
print(f"Found {len(stories)} stories")

# Extract header (everything before first story)
header_match = re.search(r'^(.*?)<div class="story">', content, re.DOTALL)
header = header_match.group(1) if header_match else ''

# Extract footer (everything after last story)
footer = '</body></html>'

# Split into 10 parts
stories_per_part = len(stories) // 10 + 1
parts = []

for i in range(10):
    start_idx = i * stories_per_part
    end_idx = min((i + 1) * stories_per_part, len(stories))
    part_stories = stories[start_idx:end_idx]
    
    if not part_stories:
        break
    
    # Create part file
    part_content = header + '\n'.join(part_stories) + '\n' + footer
    filename = f'illustrated-stories-part{i+1}.html'
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(part_content)
    
    file_size = os.path.getsize(filename) / (1024 * 1024)
    print(f"Created {filename}: {len(part_stories)} stories, {file_size:.1f}MB")

# Create the loader page
loader_html = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Illustrated Stories - The Cluckington Family</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 0; background: #fffef9; }
    .loading { text-align: center; padding: 50px; font-size: 1.5em; color: #d97428; }
    .top-menu {
      width: 100%;
      background: linear-gradient(to right, #fffdf7, #fff5e1);
      border-bottom: 3px solid #e6d1a3;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .top-menu ul {
      list-style: none;
      margin: 0;
      padding: 8px 0;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .top-menu li { display: inline; }
    .top-menu a {
      display: inline-block;
      padding: 12px 24px;
      font-size: 1em;
      color: #fff;
      background: linear-gradient(135deg, #d97428 0%, #c96620 100%);
      border: none;
      border-radius: 12px;
      font-family: 'Quicksand', 'Georgia', serif;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(217, 116, 40, 0.3);
      transition: all 0.3s;
    }
    .top-menu a:hover {
      background: linear-gradient(135deg, #a85c1a 0%, #8a4a15 100%);
      transform: translateY(-2px);
    }
    .top-menu a.active {
      background: linear-gradient(135deg, #fffbe7 0%, #fff5d6 100%);
      color: #d97428;
      border: 2px solid #d97428;
    }
  </style>
</head>
<body>
  <nav class="top-menu">
    <ul>
      <li><a href="index.html">The Cluckington Family</a></li>
      <li><a href="family-members.html">Family Members</a></li>
      <li><a href="golden-knight.html">The Golden Knight</a></li>
      <li><a href="homework.html">Homework Kanban</a></li>
      <li><a href="games.html">Games</a></li>
      <li><a href="sailing-data-tool.html">Wind Forecaster</a></li>
      <li><a href="teach-me-anything.html">Teach Me Anything</a></li>
      <li><a href="chat-with-peep.html">Chat with Sir Peepius</a></li>
      <li><a href="bedtime-stories.html">Bedtime Stories</a></li>
      <li><a href="illustrated-stories-5.html" class="active">Illustrated Stories</a></li>
    </ul>
  </nav>
  
  <div class="loading">Loading 1000 illustrated stories...</div>
  <div id="content"></div>
  
  <script>
    // Load all parts and combine them
    async function loadAllParts() {
      const contentDiv = document.getElementById('content');
      const loadingDiv = document.querySelector('.loading');
      
      for (let i = 1; i <= 10; i++) {
        try {
          const response = await fetch(`illustrated-stories-part${i}.html`);
          const html = await response.text();
          
          // Extract just the story divs (remove duplicate headers/footers)
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const stories = doc.querySelectorAll('.story');
          
          stories.forEach(story => {
            contentDiv.appendChild(story.parentElement.cloneNode(true));
          });
          
          loadingDiv.textContent = `Loading stories... ${i * 100} / 1000`;
        } catch (error) {
          console.error(`Failed to load part ${i}:`, error);
        }
      }
      
      loadingDiv.style.display = 'none';
    }
    
    loadAllParts();
  </script>
</body>
</html>
'''

with open('illustrated-stories-5-loader.html', 'w', encoding='utf-8') as f:
    f.write(loader_html)

print("\nCreated illustrated-stories-5-loader.html (master page)")
print("\nTo use:")
print("1. Push all illustrated-stories-part*.html files to GitHub")
print("2. Rename illustrated-stories-5-loader.html to illustrated-stories-5.html")
print("3. Push illustrated-stories-5.html to GitHub")
