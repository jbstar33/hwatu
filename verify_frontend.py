from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Start server in background? No, assume server is running.
        # I will start it in a separate tool call before this script runs.
        page.goto("http://localhost:3000")

        # Wait for game to initialize
        page.wait_for_selector(".game-wrap")

        # 1. Check for restart button in DOM
        restart_btn = page.locator("#restartBtn")
        if restart_btn.count() > 0:
            print("✅ Restart button found in DOM")
        else:
            print("❌ Restart button NOT found")

        # 2. Check for captured cards stacking style
        # We can check computed style of a card if we had cards, but initially might be empty.
        # We can check if the CSS rule exists by evaluating JS or just trusting the file update.
        # Let's try to simulate a game end to see the modal.

        # Force game end via JS
        page.evaluate("if(typeof endGame !== 'undefined') { endGame({id:'human', name:'나', score:10}, 'Test reason', 10); } else { console.log('endGame not found'); }")

        # Wait for modal to appear
        try:
            page.wait_for_selector("#resultModal:not(.hidden)", timeout=3000)
            print("✅ Result modal appeared")

            # Check restart button visibility
            if restart_btn.is_visible():
                print("✅ Restart button is visible in modal")
            else:
                print("❌ Restart button is NOT visible")

        except Exception as e:
            print(f"❌ Failed to show result modal: {e}")

        # Screenshot
        page.screenshot(path="verification_screenshot.png")
        print("✅ Screenshot saved to verification_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
