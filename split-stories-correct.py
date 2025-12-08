import re

# Read the original file
with open('illustrated-stories-5.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: story div followed by its illustration div
# <div class="story">...</div></div><div class="story-illustration">...</div>
pattern = r'<div class="story">.*?</div>\s*</div>\s*<div class="story-illustration".*?</div>'
story_blocks = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(story_blocks)} complete story+image blocks")

# Split into 10 files (100 stories per file)
stories_per_file = 100

# Extract header (everything before first story)
header_match = re.search(r'(.*?)<div class="story">', content, re.DOTALL)
header = header_match.group(1) if header_match else ''

# Footer
footer = '\n</body>\n</html>'

# Create 10 part files
for i in range(10):
    start_idx = i * stories_per_file
    end_idx = min((i + 1) * stories_per_file, len(story_blocks))
    part_stories = story_blocks[start_idx:end_idx]
    
    part_content = header + '\n'.join(part_stories) + footer
    
    filename = f'illustrated-stories-part-{i+1}.html'
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(part_content)
    
    file_size = len(part_content) / (1024 * 1024)
    print(f"Created {filename} with {len(part_stories)} stories ({file_size:.1f}MB)")

# Create loader HTML
loader_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tales from Chickenopolis</title>
</head>
<body>
    <div id="loading">Loading stories...</div>
    <div id="content"></div>
    
    <script>
        async function loadStories() {
            const contentDiv = document.getElementById('content');
            const loadingDiv = document.getElementById('loading');
            
            for (let i = 1; i <= 10; i++) {
                const response = await fetch(`illustrated-stories-part-${i}.html`);
                const html = await response.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const stories = doc.querySelectorAll('.story, .story-illustration');
                
                stories.forEach(story => contentDiv.appendChild(story.cloneNode(true)));
                
                loadingDiv.textContent = `Loaded ${i * 10}% of stories...`;
            }
            
            loadingDiv.remove();
        }
        
        loadStories();
    </script>
</body>
</html>'''

with open('illustrated-stories-loader.html', 'w', encoding='utf-8') as f:
    f.write(loader_html)

print("\nCreated illustrated-stories-loader.html")
