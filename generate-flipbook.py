import os

input_file = 'illustrated-stories-5.html'
output_file = 'illustrated-stories-flipbook.html'

flipbook_styles = """
<style id="flipbook-styles">
    /* Keep body scrollable to allow sticky menu */
    body {
        background-color: #2c3e50;
        overflow: visible;
    }
    
    /* Don't hide the menu - keep it sticky and visible */
    .top-menu {
        position: sticky;
        top: 0;
        z-index: 10000;
    }
    
    /* Hide original content wrapper */
    .content-wrapper {
        display: none;
    }

    #flipbook-container {
        width: 100%;
        min-height: 100vh;
        padding-top: 80px;
        display: flex;
        justify-content: center;
        align-items: center;
        perspective: 2000px;
        padding: 80px 20px 40px;
        box-sizing: border-box;
    }

    #book {
        width: min(90vw, 800px);
        height: min(85vh, 700px);
        position: relative;
        transform-style: preserve-3d;
    }

    .page {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background: #fffef9;
        padding: 40px;
        box-sizing: border-box;
        transform-origin: left center;
        transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
        box-shadow: inset 0 0 30px rgba(0,0,0,0.1), 0 0 15px rgba(0,0,0,0.2);
        border-radius: 0 10px 10px 0;
        overflow-y: auto; /* Allow scrolling if content is long */
        backface-visibility: hidden;
        display: flex;
        flex-direction: column;
    }
    
    /* Scrollbar styling for pages */
    .page::-webkit-scrollbar {
        width: 8px;
    }
    .page::-webkit-scrollbar-track {
        background: #f1f1f1; 
    }
    .page::-webkit-scrollbar-thumb {
        background: #d97428; 
        border-radius: 4px;
    }

    .page.flipped {
        transform: rotateY(-180deg);
        pointer-events: none; /* Can't interact with flipped pages */
    }
    
    /* Z-index management is handled by JS */

    .controls {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        gap: 20px;
        background: rgba(255,255,255,0.95);
        padding: 15px 30px;
        border-radius: 30px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        align-items: center;
    }

    .btn {
        padding: 12px 24px;
        background: linear-gradient(135deg, #d97428 0%, #c96620 100%);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-family: 'Georgia', serif;
        font-weight: bold;
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 1em;
    }

    .btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 15px rgba(217, 116, 40, 0.4);
    }
    
    .btn:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    #pageInfo {
        font-weight: bold;
        color: #333;
        min-width: 150px;
        text-align: center;
    }

    .page-number {
        position: absolute;
        bottom: 15px;
        right: 20px;
        color: #888;
        font-size: 0.9em;
    }
    
    /* Cover styling */
    .page.cover {
        background: linear-gradient(135deg, #d97428 0%, #8a4a15 100%);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
    }
    .page.cover h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    .page.cover h2 { color: #ffe4b3; border-color: #ffe4b3; }

</style>
"""

flipbook_script = """
<script>
document.addEventListener('DOMContentLoaded', function() {
    const originalWrapper = document.querySelector('.content-wrapper');
    if (!originalWrapper) return;

    // Create Flipbook Structure
    const body = document.body;
    const flipbookContainer = document.createElement('div');
    flipbookContainer.id = 'flipbook-container';
    
    const book = document.createElement('div');
    book.id = 'book';
    
    flipbookContainer.appendChild(book);
    body.appendChild(flipbookContainer);

    // Create Controls
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
        <button id="prevBtn" class="btn">← Previous</button>
        <span id="pageInfo">Cover</span>
        <button id="nextBtn" class="btn">Next →</button>
    `;
    body.appendChild(controls);

    // Extract Stories
    const stories = Array.from(originalWrapper.querySelectorAll('.story'));
    const title = originalWrapper.querySelector('h1') ? originalWrapper.querySelector('h1').innerText : 'Stories';
    
    // Create Cover Page
    const coverPage = document.createElement('div');
    coverPage.className = 'page cover';
    coverPage.style.zIndex = stories.length + 2;
    coverPage.innerHTML = `
        <h1>${title}</h1>
        <h2>A Collection of ${stories.length} Stories</h2>
        <p>Click Next to begin reading</p>
    `;
    book.appendChild(coverPage);

    // Create Story Pages
    stories.forEach((story, index) => {
        const page = document.createElement('div');
        page.className = 'page';
        // Reverse z-index so first pages are on top
        page.style.zIndex = stories.length - index; 
        
        // Copy content
        page.innerHTML = story.innerHTML;
        
        // Add page number
        const pageNum = document.createElement('div');
        pageNum.className = 'page-number';
        pageNum.innerText = index + 1;
        page.appendChild(pageNum);
        
        book.appendChild(page);
    });

    // Logic
    const pages = Array.from(document.querySelectorAll('.page'));
    let currentPage = 0; // 0 is cover

    function updateZIndexes() {
        pages.forEach((page, index) => {
            if (index < currentPage) {
                // Flipped pages
                page.style.zIndex = index; 
            } else {
                // Unflipped pages
                page.style.zIndex = pages.length - index;
            }
        });
    }

    function updateControls() {
        document.getElementById('prevBtn').disabled = currentPage === 0;
        document.getElementById('nextBtn').disabled = currentPage === pages.length;
        
        let label = "";
        if (currentPage === 0) label = "Cover";
        else if (currentPage > stories.length) label = "End";
        else label = `Story ${currentPage} of ${stories.length}`;
        
        document.getElementById('pageInfo').innerText = label;
    }

    function flipNext() {
        if (currentPage < pages.length) {
            pages[currentPage].classList.add('flipped');
            currentPage++;
            updateControls();
            // updateZIndexes is not strictly needed if we handle z-index initially correctly, 
            // but for 3D effect, the flipped page should go 'behind' the current stack?
            // With transform rotateY(-180deg), it flips to the left.
            // We need to make sure it doesn't obscure the next page if it has a backface.
            // But we set backface-visibility: hidden.
        }
    }

    function flipPrev() {
        if (currentPage > 0) {
            currentPage--;
            pages[currentPage].classList.remove('flipped');
            updateControls();
        }
    }

    document.getElementById('nextBtn').addEventListener('click', flipNext);
    document.getElementById('prevBtn').addEventListener('click', flipPrev);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') flipNext();
        if (e.key === 'ArrowLeft') flipPrev();
    });

    updateControls();
});
</script>
"""

try:
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    print("Injecting styles...")
    # Inject styles before </head>
    if '</head>' in content:
        content = content.replace('</head>', flipbook_styles + '</head>')
    else:
        print("Warning: </head> not found, appending styles to body")
        content += flipbook_styles

    print("Injecting script...")
    # Inject script before </body>
    if '</body>' in content:
        content = content.replace('</body>', flipbook_script + '</body>')
    else:
        print("Warning: </body> not found, appending script to end")
        content += flipbook_script

    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Done!")

except Exception as e:
    print(f"Error: {e}")
