# Codex：Font Manager 最終整合與驗收

請直接在使用者 macOS Apple Silicon 主機下載 GitHub 分支，先執行 `INSTALL_CODEX.md`，再完成以下工作。**已有 16 款免費字體完整安裝，請不要重灌，也不能擅自下載五款授權未確認的字體**。

## P1 Skill 佈署 — 必做
- 驗證 `~/.agents/skills/font-manager/SKILL.md` 存在且 metadata 合法。對七種 preset 執行 `font_profile.py`，記錄輸出及 Hash。
- 透過 Codex 載入 `$font-manager`，確定可從自然語言喚起；失敗則依當地 Codex 版本及官方文件修正。
- 現有其它個人 Skills 不受影響，不修改既有全域 AGENTS.md，除非必須且先備份。

## P2 CoreText 字體驗證 — 必做
- 讀取已驗收的 `/Users/borongchen/Documents/Codex/2026-10-25/codex-task-md-mac-21/verify-font-glyphs.swift`，沿用已實證的測試方法；不可猜測 CLI。
- 確認選用的實際 macOS family/face 名稱與「天玥社區管理委員會選舉辦法會議紀錄規約」字形涵蓋。
- 先前已知辰宇落雁體等寬 face 及隨峰體缺字「玥」，必須有實際字形回退測試。
- `system_profiler` 若仍有舊快取，以 CoreText、字體簿及 PDF 結果分別報告，不要假報快取修好。

## P3 Word/PDF 實際整合 — 必做
- 在本機尋找 P5/P11 `audio-to-word`、`governance-to-word`、`p11_governance_to_word.py` 工作流程與原樣板。未找到就報 `BLOCKED`，不可臆造路徑。
- 接入 Font Manager 選字、CoreText 全文缺字檢查和成品 PDF 驗收。以最小增量方式修改：先備份、記錄 diff、維持既有驗收 PASS。
- 實際產出兩組 DOCX/PDF：A. 天玥正式公告 B. 天玥選舉辦法。兩組都要有「天玥」、標題、內文、表格。
- 驗證 DOCX 的 `w:eastAsia`、輸出 PDF 的文字與字型嵌入（如 `pdffonts`），以及 PDF 視覺呈現。留下檔案路徑、測試及截圖證據。未經驗證不可回報 PASS。

## P4 Canva 實帳號驗證 — 獨立狀態
- 只在使用者已登入且允許操作的 Canva 帳戶中檢查。Mac 字體存在不等於 Canva 網頁內建字體可選。
- 確認 Canva 方案、品牌套件功能及字體下拉選單。逐項核對指定 16 字體哪些內建可選；找不到如實列為不可用或未驗證。
- 搜尋「可畫柔圓－繁」是否可在 Canva 使用，區別 Canva 可用和 macOS 本機已安裝兩種狀態。
- 如需上傳字體，先查證授權與 Canva 權限。未經使用者授權不改任何 Canva 品牌套件，不繞過登入/付費。

## P5 五款授權問題 — 不強制處置
- UD角ゴC70、筑紫A丸ゴシック、モード明朝、はるなごみ Std：檢查是否已有合法原廠授權。若無則維持待授權，不下載、不購買。
- 可畫柔圓－繁：桌面字體來源與授權未核實時不安裝；如 Canva 已內建可用，獨立標示。
- 這五項不計入免費字體安裝失敗數。

## 輸出
寫入 `~/Documents/字體安裝報告/FONT_MANAGER_FINAL_ACCEPTANCE.md`，逐項標明 PASS/PARTIAL/BLOCKED、執行環境、日期、指令、文件產物位置及證據；列清楚「字體安裝完成」「Skill 部署完成」「Word/PDF 整合完成」「Canva 帳戶驗證狀態」「商業授權狀態」。P1~P3 全 PASS 才稱本地 AI 文件整合完成。