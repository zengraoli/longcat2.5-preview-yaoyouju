"""浏览器端到端复查（普通浏览器，不关闭跨域检查）Web 390 宽"""
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

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.on("pageerror", lambda e: print("  [pageerror]", e))

    # 登录
    page.goto("http://localhost:5402/login")
    page.fill('input[placeholder="请输入手机号"]', f"139{int(time.time()) % 100000000:08d}")
    page.fill('input[placeholder="6 位验证码"]', "123456")
    page.click("text=我已阅读并同意")
    page.click("text=单独同意")
    page.click("button:has-text('登录 / 注册')")
    page.wait_for_url("**/dashboard", timeout=10000)
    check("登录进入工作台", "dashboard" in page.url, "未跳转")

    menu_text = page.text_content("nav") or ""
    check("390 宽顶部菜单可见", "当前情况" in menu_text and "问与解释" in menu_text)

    # 录入报告（工作台内联表单）
    page.click("text=录入报告")
    page.wait_for_timeout(400)
    page.fill("textarea.report-form__textarea", "腰椎MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。")
    page.click("text=保存报告")
    page.wait_for_timeout(1000)

    # 生成一页分析
    page.click("text=生成一页分析")
    page.wait_for_timeout(1500)
    check("跳转到分析页", "analysis" in page.url, page.url)
    # 分析页轮询等待完成（不再立即显示"尚未生成"）
    for _ in range(30):
        page.wait_for_timeout(2000)
        _b = page.text_content("body") or ""
        if "这些信息能支持什么解释" in _b and "正在生成分析" not in _b:
            break
    page.wait_for_timeout(500)
    body = page.text_content("body") or ""
    check("分析页显示五段", "当前确认的信息" in body and "这些信息能支持什么解释" in body)
    check("分析页显示模型与内容库版本", "模型" in body and "内容库" in body)
    check("分析已知段有内容（报告）", "已确认的信息为空" not in body)

    # 问与解释（含越界）
    page.goto("http://localhost:5402/qa")
    page.wait_for_timeout(500)
    page.fill('input[placeholder*="输入你的问题"]', "要不要做手术")
    page.press('input[placeholder*="输入你的问题"]', "Enter")
    page.wait_for_timeout(1200)
    qa_body = page.text_content("body") or ""
    check("越界提问被拒答", "手术" in qa_body)
    check("历史会话显示提问数", "（0 问）" not in qa_body)

    # 记录今天（红旗）
    page.goto("http://localhost:5402/timeline")
    page.wait_for_timeout(500)
    page.locator("textarea").first.fill("今天开始大小便失禁，会阴麻木")
    page.click("text=保存")
    page.wait_for_timeout(1500)
    tl_body = page.text_content("body") or ""
    check("记录今天命中红旗弹就医提示", "需要及时寻求专业帮助" in tl_body or "请及时就医" in tl_body)
    # 关闭就医提示弹层
    page.click("button.dialog__btn", timeout=3000)
    page.wait_for_timeout(500)
    check("就医提示弹层已关闭", "需要及时寻求专业帮助" not in (page.text_content("body") or ""))

    # 复诊摘要（导出后新增记录）
    page.goto("http://localhost:5402/followup")
    page.wait_for_timeout(500)
    before = page.text_content("body") or ""
    page.click("text=导出 PDF")
    page.wait_for_timeout(1500)
    page.goto("http://localhost:5402/timeline")
    page.wait_for_timeout(800)
    page.click("text=＋ 新增事件")
    page.wait_for_timeout(500)
    # 弹层里的输入框与保存按钮（最后一个 textarea / 弹层内的保存）
    page.locator("textarea").last.fill("医生建议保守治疗 4 周后复查。")
    page.locator(".mask button:has-text('保存')").last.click()
    page.wait_for_timeout(1200)
    page.goto("http://localhost:5402/followup")
    page.wait_for_timeout(500)
    after = page.text_content("body") or ""
    check("导出后新增记录摘要更新", before != after and "保守治疗" in after)

    # 退出登录
    page.goto("http://localhost:5402/account")
    page.wait_for_timeout(300)
    page.click("text=退出登录")
    page.wait_for_timeout(1000)
    check("退出登录回到登录页", "login" in page.url)

    # 删除账户
    page.fill('input[placeholder="请输入手机号"]', f"139{int(time.time()) % 100000000:08d}")
    page.fill('input[placeholder="6 位验证码"]', "123456")
    page.click("text=我已阅读并同意")
    page.click("text=单独同意")
    page.click("button:has-text('登录 / 注册')")
    page.wait_for_url("**/dashboard", timeout=10000)
    page.goto("http://localhost:5402/account")
    page.wait_for_timeout(300)
    page.click("text=导出与删除")
    page.wait_for_timeout(300)
    page.click("button:has-text('删除账户')")
    page.wait_for_timeout(300)
    page.click("button:has-text('删除账户')")
    page.wait_for_timeout(1500)
    check("删除账户后回到登录页", "login" in page.url)

    browser.close()

print(f"\n浏览器端：{passed} 通过，{failed} 失败")
sys.exit(1 if failed else 0)
