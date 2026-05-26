# NEHS Awards Certificate Studio

國立新竹科學園區實驗高級中等學校運動會獎狀名次查詢與批量列印工具。

## 功能

- 依類型、年級子頁、比賽名稱、部別與搜尋文字篩選名單
- 自動判斷 T1-T5 獎狀模板
- 支援中文姓名與英文姓名分離顯示
- 可切換獎狀底圖或純文字模式
- 可調整獎狀標題、日期與模板文字位置
- 勾選多筆後可預覽多張獎狀並批量列印
- 存成 PDF 時會產生一個多頁 PDF，每頁一張獎狀
- 勾選多筆後可產生 A4 頒獎清單
- 可用 Python 腳本自動抓取成績網站並更新名單資料

## 資料夾結構

```text
nehs-awards/
  award-site/              # 靜態網站
    assets/                # 字體與獎狀背景圖
    index.html
    app.js
    styles.css
    awards-data.js         # 匯入後的名單資料
  scripts/                 # 資料匯入與樣張產生腳本
  docs/                    # 獎狀模板與座標文件
  original-templates/      # 原始 PDF 模板
  sample-output/           # 樣張輸出
```

## 本機預覽

在此資料夾內執行：

```bash
python3 -m http.server 4174
```

開啟：

```text
http://localhost:4174/award-site/
```

## 重新匯入名單

先將來源 HTML 存成檔案，例如 `/private/tmp/award2.html`，再執行：

```bash
node scripts/import_awards_from_html.mjs /private/tmp/award2.html award-site/awards-data.js
```

## 全自動更新名單

可直接用 Python 抓取學校成績網站並覆蓋 `award-site/awards-data.js`：

```bash
python3 scripts/update_awards.py
```

若要每 5 分鐘自動更新一次，可長駐執行：

```bash
python3 scripts/update_awards.py --watch-seconds 300
```

若要用 macOS/Linux 排程，建議用 cron 或 launchd 定時執行這個指令：

```bash
cd "/Users/ibsh-it_assistant/Desktop/field day/nehs-awards"
python3 scripts/update_awards.py --backup
```

更新成功後，重新整理網站就會讀到新的 `awards-data.js`。

### GitHub Actions 自動更新

此專案已包含 `.github/workflows/update-awards.yml`。放到 GitHub 後，Actions 會每 10 分鐘執行一次 `scripts/update_awards.py`，如果 `award-site/awards-data.js` 有變更，就自動 commit 並推回 repo。

也可以在 GitHub 網頁手動執行：

```text
Actions -> Update Award Records -> Run workflow
```

如果 workflow 無法推送，請到 GitHub repo 設定確認：

```text
Settings -> Actions -> General -> Workflow permissions -> Read and write permissions
```

## GitHub 注意事項

`award-site/awards-data.js` 內含學生姓名、班級、成績等名單資料。若要放到 GitHub，建議使用 private repository，或先確認資料可以公開。
