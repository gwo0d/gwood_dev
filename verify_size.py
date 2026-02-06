from playwright.sync_api import sync_playwright

def verify_size():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:4175/")
            page.goto("http://localhost:4175/")
            page.wait_for_selector("h1")

            print("Checking icon size...")
            # Select the SVG with class .icon
            icon_svg = page.locator("a[aria-label='BlueSky (opens in new tab)'] svg.icon")

            width = icon_svg.evaluate("element => getComputedStyle(element).width")
            height = icon_svg.evaluate("element => getComputedStyle(element).height")

            print(f"Computed Width: {width}")
            print(f"Computed Height: {height}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_size()
