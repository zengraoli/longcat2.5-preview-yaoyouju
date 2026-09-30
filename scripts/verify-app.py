"""App（H5）端到端复查，375 宽（hash 路由）"""
import sys, time
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

BASE = "http://localhost:5401/#"

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 375, "height": 812})
    page = ctx.new_page()
    page.on("pageerror", lambda e: print("  [pageerror]", e))

    phone = f"139{int(time.time()) % 100000000:08d}"
    # 登录
    page.goto(f"{BASE}/pages/login/index")
    page.wait_for_selector("input", timeout=10000)
    page.locator("input").first.fill(phone)
    page.locator("input").nth(1).fill("123456")
    page.click("text=我已阅读并同意")
    page.click("text=单独同意")
    page.click("text=登录 / 注册")
    page.wait_for_timeout(1500)
    check("登录进入首页", "home" in page.url, page.url)

    # 新用户从首页"录入报告"应先进入第 1 步
    page.goto(f"{BASE}/pages/home/index")
    page.wait_for_timeout(500)
    page.click("text=录入报告")
    page.wait_for_timeout(800)
    check("新用户录入报告先进入第 1 步", "confirm" in page.url, page.url)

    # 报告录入（第 3 步）
    page.goto(f"{BASE}/pages/report/index")
    page.wait_for_selector("textarea", timeout=5000)
    page.locator("textarea").first.fill("腰椎MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。")
    page.click("text=下一步：核对信息")
    page.wait_for_timeout(500)
    check("进入核对页", "verify" in page.url, page.url)

    # 生成分析
    page.click("text=生成一页分析")
    page.wait_for_timeout(1500)
    check("跳转到分析页", "analysis" in page.url, page.url)
    for _ in range(30):
        page.wait_for_timeout(2000)
        _b = page.text_content("body") or ""
        if "这些信息能支持什么解释" in _b and "正在生成" not in _b:
            break
    body = page.text_content("body") or ""
    check("App 分析页显示五段", "当前确认的信息" in body and "这些信息能支持什么解释" in body)

    # 问与解释（越界）
    page.goto(f"{BASE}/pages/qa/index")
    page.wait_for_timeout(500)
    page.locator("input").last.fill("要不要做手术")
    page.press("input", "Enter")
    page.wait_for_timeout(1200)
    qa_body = page.text_content("body") or ""
    check("App 越界提问被拒答", "手术" in qa_body)

    # 记录今天（红旗）
    page.goto(f"{BASE}/pages/record/index")
    page.wait_for_timeout(500)
    page.locator("textarea").first.fill("今天开始大小便失禁，会阴麻木")
    page.click("text=保存")
    page.wait_for_timeout(1500)
    rec_body = page.text_content("body") or ""
    check("App 记录今天命中红旗弹就医提示", "需要及时寻求专业帮助" in rec_body or "请及时就医" in rec_body)
    # 关闭就医提示弹层（确定后跳转红旗页）
    page.locator(".uni-modal__btn_primary").click()
    page.wait_for_timeout(500)

    # 复诊摘要
    page.goto(f"{BASE}/pages/summary/index")
    page.wait_for_timeout(500)
    sum_body = page.text_content("body") or ""
    check("App 复诊摘要显示", "当前情况" in sum_body or "复诊" in sum_body)

    # 退出登录（验证令牌失效）
    page.goto(f"{BASE}/pages/mine/index")
    page.wait_for_timeout(500)
    page.click("text=退出登录")
    page.wait_for_timeout(1500)
    # 退出后受保护接口应失败（令牌已失效）
    me = page.evaluate("""async () => {
      const r = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + (window.localStorage.getItem('yaoyouju_token') || '') } });
      return r.status;
    }""")
    check("退出登录后令牌失效", me == 401, f"status={me}")

    # 删除账户
    page.wait_for_selector("input", timeout=10000)
    page.locator("input").first.fill(phone)
    page.locator("input").nth(1).fill("123456")
    page.click("text=我已阅读并同意")
    page.click("text=单独同意")
    page.click("text=登录 / 注册")
    page.wait_for_timeout(1500)
    page.goto(f"{BASE}/pages/mine/index")
    page.wait_for_timeout(500)
    page.click("text=删除账户与数据")
    page.wait_for_timeout(500)
    page.locator(".uni-modal__btn_primary").click()
    page.wait_for_timeout(1500)
    # 删除后受保护接口应失败（账户已删除）
    me2 = page.evaluate("""async () => {
      const r = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + (window.localStorage.getItem('yaoyouju_token') || '') } });
      return r.status;
    }""")
    check("删除账户后令牌失效", me2 == 401, f"status={me2}")

    browser.close()

print(f"\nApp 端：{passed} 通过，{failed} 失败")
sys.exit(1 if failed else 0)
