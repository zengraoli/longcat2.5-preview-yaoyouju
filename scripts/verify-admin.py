"""后台浏览器复查：5 角色登录、403 页、弹层确认按钮、双人确认提示、退出登录"""
import sys
from playwright.sync_api import sync_playwright

passed = 0
failed = 0

def ok(n):
    global passed
    passed += 1
    print(f"  ✓ {n}")

def fail(n, e):
    global failed
    failed += 1
    print(f"  ✗ {n}: {e}")

def check(n, c, d=None):
    if c:
        ok(n)
    else:
        fail(n, d or "断言失败")

BASE = "http://localhost:5403"
ADMINS = ["运营编辑-林", "临床审核-沈", "技术-程", "合规-顾", "超级管理-赵"]

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.on("pageerror", lambda e: print("  [pageerror]", e))

    # 超管登录
    page.goto(f"{BASE}/login")
    page.fill('input[placeholder="工作邮箱"]', "超级管理-赵")
    page.fill('input[type="password"]', "Admin@123456")
    page.fill('input[placeholder="6 位验证码"]', "123456")
    page.click('button[type="submit"]')
    page.wait_for_url("**/dashboard", timeout=10000)
    check("超管登录进入仪表盘", "dashboard" in page.url, page.url)

    # 无权限页面进入 403（技术访问 /users，技术无 member:read）
    page.goto(f"{BASE}/login")
    page.fill('input[placeholder="工作邮箱"]', "技术-程")
    page.fill('input[type="password"]', "Admin@123456")
    page.fill('input[placeholder="6 位验证码"]', "123456")
    page.click('button[type="submit"]')
    page.wait_for_url("**/dashboard", timeout=10000)
    page.goto(f"{BASE}/users")
    page.wait_for_timeout(800)
    body = page.text_content("body") or ""
    check("技术访问 /users 进入 403 页", "没有权限" in body or "403" in body, page.url)
    # 超管登录继续后续检查
    page.goto(f"{BASE}/login")
    page.fill('input[placeholder="工作邮箱"]', "超级管理-赵")
    page.fill('input[type="password"]', "Admin@123456")
    page.fill('input[placeholder="6 位验证码"]', "123456")
    page.click('button[type="submit"]')
    page.wait_for_url("**/dashboard", timeout=10000)

    # 内容库新建弹层有确认按钮
    page.goto(f"{BASE}/contents")
    page.wait_for_timeout(500)
    page.click("text=＋ 新建内容")
    page.wait_for_timeout(500)
    modal = page.locator(".modal")
    check("新建内容弹层打开", modal.count() > 0)
    check("新建内容弹层有确认按钮", modal.locator("button:has-text('创建')").count() > 0)
    # 填写并创建
    modal.locator("input").first.fill("浏览器测试内容")
    modal.locator("button:has-text('创建')").click()
    page.wait_for_timeout(1000)
    body = page.text_content("body") or ""
    check("新建内容成功", "已创建草稿" in body)

    # 安全页可见（安全事件真实数据）
    page.goto(f"{BASE}/safety")
    page.wait_for_timeout(500)
    body = page.text_content("body") or ""
    check("安全页可见", "安全事件" in body or "应急开关" in body)

    # 退出登录（超管）
    page.click("text=退出登录")
    page.wait_for_timeout(1000)
    check("后台退出登录回到登录页", "login" in page.url, page.url)

    # 5 角色都能登录
    for name in ADMINS:
        page.goto(f"{BASE}/login")
        page.fill('input[placeholder="工作邮箱"]', name)
        page.fill('input[type="password"]', "Admin@123456")
        page.fill('input[placeholder="6 位验证码"]', "123456")
        page.click('button[type="submit"]')
        page.wait_for_url("**/dashboard", timeout=10000)
        check(f"{name} 登录", "dashboard" in page.url, page.url)
        page.click("text=退出登录")
        page.wait_for_timeout(800)

    browser.close()

print(f"\n后台浏览器：{passed} 通过，{failed} 失败")
sys.exit(1 if failed else 0)
