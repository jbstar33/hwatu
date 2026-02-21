import time
import subprocess
import sys
from playwright.sync_api import sync_playwright

def run():
    # Start server
    server = subprocess.Popen(["node", "server.js"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2) # Wait for server

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to a desktop size to verify side panel layout
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        try:
            page.goto("http://localhost:3000")

            # Inject state for verification
            page.evaluate("""
                const me = game.players[0];
                // Add dummy captured cards
                // Gwang (Jan, Mar)
                me.captured.push({id:101, month:1, type:'gwang', spriteCol:0, spriteRow:0});
                me.captured.push({id:102, month:3, type:'gwang', spriteCol:2, spriteRow:0});

                // Animal (Feb, Apr)
                me.captured.push({id:103, month:2, type:'animal', spriteCol:1, spriteRow:0});
                me.captured.push({id:104, month:4, type:'animal', spriteCol:3, spriteRow:0});

                // Ribbon (Jan, Feb)
                me.captured.push({id:105, month:1, type:'ribbon', ribbonKind:'hong', spriteCol:0, spriteRow:1});
                me.captured.push({id:106, month:2, type:'ribbon', ribbonKind:'hong', spriteCol:1, spriteRow:1});

                // Junk (Multiple to force scroll/wrap)
                for(let i=1; i<=10; i++) {
                    me.captured.push({id:200+i, month:i, type:'junk', spriteCol:(i-1)%12, spriteRow:2});
                }

                // Add a ppuk pile
                game.ppukPiles.push({
                    id: 'ppuk-test',
                    month: 12,
                    cards: [
                        {id:301, month:12, type:'gwang', spriteCol:11, spriteRow:0},
                        {id:302, month:12, type:'animal', spriteCol:11, spriteRow:1},
                        {id:303, month:12, type:'ribbon', spriteCol:11, spriteRow:2}
                    ]
                });

                render();
            """)

            # Wait a bit for render
            time.sleep(1.0)

            # Take screenshot
            page.screenshot(path="verification_ui.png", full_page=True)
            print("Screenshot saved to verification_ui.png")

        finally:
            browser.close()
            server.terminate()

if __name__ == "__main__":
    run()
