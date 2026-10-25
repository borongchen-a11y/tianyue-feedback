# Codex 本機執行任務：21 款字體安裝與驗收

**執行環境限定：使用者的 macOS Apple Silicon 主機，禁止在遠端／容器模擬結果。**

任務：安裝清單中的 16 款合法免費字體（含 13 款 Homebrew Cask、3 款原作者來源）；對 4 款 Fontworks 商業字體與 Canva「可畫柔圓－繁」，僅核對已取得的合法授權與既有安裝狀態，不允許破解、轉載下載或冒用已安裝。

## 下載

公開下載網址：
https://github.com/borongchen-a11y/tianyue-feedback/archive/refs/heads/codex-fonts-installer-20261025.zip

在 Mac 上可直接使用：
curl -fL --retry 3 -o /tmp/codex-fonts-installer.zip "https://github.com/borongchen-a11y/tianyue-feedback/archive/refs/heads/codex-fonts-installer-20261025.zip"
unzip -q /tmp/codex-fonts-installer.zip -d /tmp/codex-fonts-package
cd /tmp/codex-fonts-package/tianyue-feedback-codex-fonts-installer-20261025/mac-fonts-installer

請先閱讀本文件與安裝腳本，確認來源、授權與寫入路徑，然後執行 bash ./install-fonts.command。

## TODO
1. uname -s 必須為 Darwin；記錄 uname -m、brew --version、python3 --version。
2. 讀取 install-fonts.command、install-extras.py，確認僅透過 Homebrew、GitHub 原作者、cjkfonts.io 取得免費字體。
3. 執行 bash ./install-fonts.command。
4. 查看 ~/Documents/字體安裝報告/ 內最新的安裝紀錄 TSV，檢查錯誤訊息。
5. Homebrew 項目須驗證 brew list --cask --versions 與 ~/Library/Fonts 實際字型檔；非 Homebrew 項目檢查 Curated 前綴檔案格式。
6. 透過 system_profiler SPFontsDataType 或 Font Book 驗證 macOS 辨識，並檢查繁體中文顯示。無法驗證時標記「尚待驗證」，不得推斷成功。
7. 逐項回報 21 款結果：成功、已存在、失敗、商業授權待處理、來源待確認。
8. 失敗免費字體僅從官方／原作者來源修復；保留日誌與備份，不得刪除其他個人字體。

## 已列入清單的字體

可自動處理：源流明朝、ㄅ注音芫荽、獅尾繁中黑體、霞鶩文楷 TC、悠哉字體、隨峰體、粉圓、WDXL 滑油字、ㄅ字嗨注音標楷、辰宇落雁體、思源宋體、霞鶩漫黑、源泉圓體、芫荽、思源黑體、宇文天穹。

需要授權／來源確認：可畫柔圓－繁、UD角ゴC70、筑紫A丸ゴシック、モード明朝、はるなごみ Std。

## 驗收門檻

有本機可辨識的字型檔證據，方能回報已安裝。對每一項失敗詳述原因；未取得授權的商業字體不得安裝。安裝套件本身不包含任何字型檔。
