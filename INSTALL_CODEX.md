# Font Manager：Mac 安裝指南

Codex 請只在使用者 macOS 主機執行，不要把雲端工具環境視為 Mac。此 GitHub 分支與網站 main 分支分開。

公開原始壓縮檔：
https://github.com/borongchen-a11y/tianyue-feedback/archive/refs/heads/codex-fonts-installer-20261025.zip

## 下載、備份、安裝使用者層級 Skill

```bash
set -e
curl -fL --retry 3 -o /tmp/font-manager-workflow.zip 'https://github.com/borongchen-a11y/tianyue-feedback/archive/refs/heads/codex-fonts-installer-20261025.zip'
mkdir -p /tmp/font-manager-workflow
unzip -oq /tmp/font-manager-workflow.zip -d /tmp/font-manager-workflow
PKG='/tmp/font-manager-workflow/tianyue-feedback-codex-fonts-installer-20261025'
SOURCE="$PKG/.agents/skills/font-manager"
TARGET="$HOME/.agents/skills/font-manager"
test -f "$SOURCE/SKILL.md"
python3 -m py_compile "$SOURCE/scripts/font_profile.py"
mkdir -p "$HOME/.agents/skills"
if [[ -e "$TARGET" ]]; then mv "$TARGET" "$TARGET.backup-$(date +%Y%m%d_%H%M%S)"; fi
cp -R "$SOURCE" "$TARGET"
python3 "$TARGET/scripts/font_profile.py" --type announcement --text '天玥社區公告' --json
```

完成後讀取本分支根目錄的 `FONT_MANAGER_INTEGRATION_TASK.md` 執行剩餘實機驗收；建立 Skill 只是設定階段，不代表文件工作流程或 Canva 已通過測試。

官方文件說明的個人 Skill 路徑為 `~/.agents/skills`。若 Codex 沒有即時偵測到新 Skill，重新啟動 Codex 再試。
