from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_layout(page: Page):
    # Homepage
    print("Verifying homepage...")
    page.goto("http://localhost:4173/")
    expect(page).to_have_title("George O. Wood")
    page.screenshot(path="/home/jules/verification/homepage.png")

    # Theme Switcher (click to open)
    print("Verifying theme switcher...")
    page.get_by_role("button", name="Theme: Auto (follows system)").click()
    page.screenshot(path="/home/jules/verification/theme-menu.png")

    # Blog Index
    print("Verifying blog index...")
    page.goto("http://localhost:4173/blog/")
    expect(page).to_have_title("Blog - George O. Wood")
    page.screenshot(path="/home/jules/verification/blog-index.png")

    # Blog Post
    print("Verifying blog post...")
    page.goto("http://localhost:4173/blog/hello-world.html")
    expect(page).to_have_title("Hello World - George O. Wood")
    page.screenshot(path="/home/jules/verification/blog-post.png")

if __name__ == "__main__":
    if not os.path.exists("/home/jules/verification"):
        os.makedirs("/home/jules/verification")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_layout(page)
        finally:
            browser.close()
