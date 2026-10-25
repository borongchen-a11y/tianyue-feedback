---
name: font-manager
description: 在 macOS 製作繁體中文 Word、PDF、社區公告、會議紀錄、規約、簡報或海報時，自動建議已部署的中文字體，檢查「玥」等缺字問題並驗收字體回退及 PDF 嵌入。Canva 字體獨立查證。
---

# Font Manager v1

## 目標
所有文件工作流程使用可追溯的字體選擇、字形覆蓋檢查和輸出驗收；不修改原始資料、不下載商業字體、不擅自改變文件正文。

## 必要步驟
1. 依文件用途執行 `python3 scripts/font_profile.py --type announcement --text '天玥社區公告' --json` 選擇候選字體。選字偏好不等於已安裝，需實際驗證。
2. 使用 CoreText 核對候選字體真實存在，且指定 face 包含所需中文字；如已存在 `verify-font-glyphs.swift`，先閱讀其命令與測試內容再呼叫。不可依 `system_profiler` 快取判斷成功。
3. 須驗證包含「天玥社區管理委員會選舉辦法會議紀錄規約設備修繕」的全文；正式文件應對完整正文逐字檢查。
4. 若指定 face 缺字，改用已驗證覆蓋完整正文的 `Noto Sans TC` 或 `Noto Serif TC`；避免不可預測的隱性回退。逐次記錄選用與替代結果。
5. DOCX 使用明確 East Asia font 設定（如 python-docx 的 `w:eastAsia`）；PDF 輸出後使用 `pdffonts` 等工具驗證實際嵌入或替代，再視覺檢查「天玥」。檢查失敗不可宣稱通過。
6. 整合 P5/P11 文件流程時先找到實際原檔，備份，保留差異與回復方法。不得覆寫原 Word 範本或共用環境。
7. Canva 與 macOS 是不同字體環境：於已登入 Canva 編輯器逐字體實測，區分「內建可選」「已授權上傳」「不可用」「未驗證」。本機已安裝不代表網頁版可用。未經授權不可上傳。
8. 四款 Fontworks（UD角ゴC70、筑紫A丸ゴシック、モード明朝、はるなごみ Std）須有合法授權才可安裝；可畫柔圓－繁的獨立 macOS 字型來源和授權待查。禁止使用破解或第三方轉載檔。

## 用途對應（候選順序）
| 用途 | 標題 | 內文 |
|---|---|---|
| 正式公告 | Noto Sans TC、源泉圓體 | Noto Sans TC |
| 會議紀錄 | Noto Sans TC | Noto Sans TC、Noto Serif TC |
| 選舉辦法、規約 | Noto Serif TC | Noto Serif TC、Noto Sans TC |
| 年度工作報告 | Noto Serif TC | Noto Sans TC |
| 社區海報 | 源泉圓體、粉圓 | Noto Sans TC |
| 手寫風格 | 霞鶩文楷 TC、芫荽 | Noto Sans TC |
| 簡報 | Noto Sans TC | Noto Sans TC |

PostScript/Family 名稱以本機 CoreText 檢出的實際字體名稱為準。未證實的名稱不可直接用於批次文件。

## 驗收報告
記錄文件類型、選字規則、實際 family/face、全文缺字、DOCX East Asia 設定、PDF 文字嵌入、視覺結果與回退情形；任何缺失證據標示 `BLOCKED` 或 `UNVERIFIED`。