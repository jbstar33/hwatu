from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000")

    # Start new game
    page.click("#newGameBtn")

    # Wait for cards to appear
    page.wait_for_selector(".human-lane .card")

    # Check attributes of the first card
    first_card = page.locator(".human-lane .card").first

    # Check tabindex
    tabindex = first_card.get_attribute("tabindex")
    print(f"tabindex: {tabindex}")

    # Check role
    role = first_card.get_attribute("role")
    print(f"role: {role}")

    # Check aria-label
    aria_label = first_card.get_attribute("aria-label")
    print(f"aria-label: {aria_label}")

    # Check status text attributes
    status_text = page.locator("#statusText")
    aria_live = status_text.get_attribute("aria-live")
    print(f"status aria-live: {aria_live}")

    # Take screenshot
    page.screenshot(path="verification_screenshot.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
