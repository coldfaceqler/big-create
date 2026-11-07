#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重疾险条款爬虫：只下载与本项目相关的「重大疾病保险条款」PDF。

用法（在仓库根目录执行）：
    python tools/crawl_clauses.py

设计：
- SEEDS 是人工维护的种子清单，只放「保险公司官网公开披露的重疾险条款」直链。
  每个种子的 name 即保存文件名，url 即 PDF 直链。
- 下载前先做「相关性」过滤：文件名或来源含 KEYWORDS 之一才下载；
  种子清单本身就是按此筛选过的，过滤只是双保险。
- 下载到 docs/资料/条款库/，并写一份 _下载清单.csv 记录来源与结果。
- 只依赖 Python 标准库，无需安装任何包。
"""
import os, re, ssl, time, csv, urllib.request, urllib.parse

# ---------------------------------------------------------------------------
# 相关性关键词：命中任一即认为与本项目相关
KEYWORDS = ["重大疾病", "重疾", "恶性肿瘤疾病", "疾病保险", "重大疾病保险"]

# 种子清单：只放重疾险条款。name = 保存文件名（不含扩展名），url = 直链
SEEDS = [
    ("北京人寿_京康安护重大疾病保险_互联网专属", "https://www.beijinglife.com.cn/zcms/contentcore/resource/download?ID=28774"),
    ("恒安标准_瑞享福尊享版重大疾病保险_互联网", "https://www.hengansl.com/hengan/attachDir/2024/09/2024092608354124501.pdf"),
    ("泰康_神奇宝贝2021款重大疾病保险", "https://e.boc.cn/cmsimage/ezcms/public/92119/7adc63bfd4ce427f8861c8342e9d1f4a/7adc63bfd4ce427f8861c8342e9d1f4a.pdf"),
    ("平安养老_关爱一生2024团体终身重大疾病保险", "https://yl.pingan.com/app_upload/file/20240902/P3760%20%E5%B9%B3%E5%AE%89%E5%85%B3%E7%88%B1%E4%B8%80%E7%94%9F%EF%BC%882024%EF%BC%89%E5%9B%A2%E4%BD%93%E7%BB%88%E8%BA%AB%E9%87%8D%E5%A4%A7%E7%96%BE%E7%97%85%E4%BF%9D%E9%99%A9%E6%9D%A1%E6%AC%BE-%E5%B9%B3%E4%BF%9D%E5%85%BB%E5%8F%91%E3%80%942024%E3%80%95220%E5%8F%B7_5058.pdf"),
    ("国寿_康宁女性重大疾病保险_互联网专属", "https://www.e-chinalife.com/upload/resources/file/productBasicInfo/8a3dc63e7b2e41e9acb58991823d77d2/100_%e5%9b%bd%e5%af%bf%e5%ba%b7%e5%ae%81%e4%bf%9d%e5%a5%b3%e6%80%a7%e9%87%8d%e5%a4%a7%e7%96%be%e7%97%85%e4%bf%9d%e9%99%a9(%e4%ba%92%e8%81%94%e7%bd%91%e4%b8%93%e5%b1%9e)%e6%9d%a1%e6%ac%be.pdf"),
    ("太保_钛强PAI团体重大疾病保险", "https://www.cpic.com.cn/upload/resources/file/2025/07/03/87871.pdf"),
    ("平安_个人重大疾病保险2021A款_互联网版", "https://yl.pingan.com/app_upload/file/20230620/P4331%E5%B9%B3%E5%AE%89%E4%B8%AA%E4%BA%BA%E9%87%8D%E5%A4%A7%E7%96%BE%E7%97%85%E4%BF%9D%E9%99%A9%EF%BC%882021A%E6%AC%BE%EF%BC%89%EF%BC%88%E4%BA%92%E8%81%94%E7%BD%91%E7%89%88%EF%BC%89%E6%9D%A1%E6%AC%BE-%E5%B9%B3%E4%BF%9D%E5%85%BB%E5%8F%91%E3%80%942021%E3%80%95606%E5%8F%B7_9593.pdf"),
    ("太保_金生无忧少儿版重大疾病保险", "http://life.cpic.com.cn/upload/resources/file/2023/04/11/70487.pdf"),
]

# ---------------------------------------------------------------------------
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE, "docs", "资料", "条款库")
LOG_PATH = os.path.join(OUT_DIR, "_下载清单.csv")

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
CTX = ssl._create_unverified_context()  # 部分官网证书配置不规范，仅对下载放宽校验


def relevant(name, url):
    """相关性过滤：名称或 URL 命中关键词之一才认为相关。"""
    text = (name + " " + urllib.parse.unquote(url))
    return any(k in text for k in KEYWORDS)


def safe_name(name):
    """保留中英文/数字/下划线/连字符，去掉路径危险字符。"""
    name = re.sub(r'[\\/:*?"<>|]', "_", name).strip()
    return name or "unnamed"


def download(name, url):
    req = urllib.request.Request(url, headers=UA)
    data = urllib.request.urlopen(req, timeout=60, context=CTX).read()
    if data[:4] != b"%PDF":
        return None, f"非 PDF（头部 {data[:16]!r}）"
    path = os.path.join(OUT_DIR, safe_name(name) + ".pdf")
    with open(path, "wb") as f:
        f.write(data)
    return len(data), path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    rows = []
    for name, url in SEEDS:
        if not relevant(name, url):
            rows.append([name, url, "SKIP-不相关", ""])
            print(f"跳过（不相关）: {name}")
            continue
        try:
            size, path = download(name, url)
            rows.append([name, url, "OK", f"{size} B"])
            print(f"OK  {name}  ({size} B)")
        except Exception as e:
            rows.append([name, url, "FAIL", repr(e)[:120]])
            print(f"FAIL {name}  {repr(e)[:120]}")
        time.sleep(0.5)

    with open(LOG_PATH, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["文件名", "来源URL", "状态", "大小"])
        w.writerows(rows)
    print(f"\n完成，清单写入 {LOG_PATH}")


if __name__ == "__main__":
    main()
