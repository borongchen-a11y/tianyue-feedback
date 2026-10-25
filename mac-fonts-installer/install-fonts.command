#!/bin/bash
# macOS 字體批次安裝器。僅用於使用者本人電腦，從 Homebrew 與字體原作者來源取得免費字體。
set -u
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
REPORT_DIR="$HOME/Documents/字體安裝報告"
mkdir -p "$REPORT_DIR"
REPORT="$REPORT_DIR/安裝紀錄_$(date +%Y%m%d_%H%M%S).tsv"
LOG="$REPORT_DIR/執行日誌_$(date +%Y%m%d_%H%M%S).log"

exec > >(tee -a "$LOG") 2>&1

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo '錯誤：必須在 macOS 執行。此安裝器尚未對你的 Mac 執行任何操作。'
  exit 2
fi

if ! command -v brew >/dev/null 2>&1; then
  if [[ -x /opt/homebrew/bin/brew ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
  elif [[ -x /usr/local/bin/brew ]]; then
    export PATH="/usr/local/bin:$PATH"
  else
    echo '錯誤：找不到 Homebrew。請交由 Codex 安裝或修復 Homebrew 後再執行。'
    exit 3
  fi
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo '錯誤：找不到 Python 3。'
  exit 4
fi

printf '編號\t字體名稱\t方式\t狀態\t備註\n' > "$REPORT"

FONTS=$(cat <<'EOF'
1|源流明朝／源流明體|font-genryumin
1b|ㄅ注音芫荽 Bpmf Iansui|font-bpmf-iansui
2|獅尾繁中黑體|MANUAL_GITHUB
3|霞鶩文楷 TC|font-lxgw-wenkai-tc
4|悠哉字體|MANUAL_GITHUB
5|隨峰體|MANUAL_ORIGIN
6|粉圓 Huninn|font-huninn
7|WDXL 滑油字 TC|font-wdxl-lubrifont-tc
8|ㄅ字嗨注音標楷|font-bpmf-zihi-kai-std
9|辰宇落雁體|font-chenyuluoyan
10|思源宋體 Noto Serif TC|font-noto-serif-tc
11|霞鶩漫黑 LXGW Marker Gothic|font-lxgw-marker-gothic
12|源泉圓體|font-gensenrounded
13|芫荽 Iansui|font-iansui
14|思源黑體 Noto Sans TC|font-noto-sans-tc
15|宇文天穹|font-uoqmunthenkhung
EOF
)

while IFS='|' read -r id name cask; do
  [[ -z "$id" ]] && continue
  if [[ "$cask" == MANUAL_* ]]; then
    continue
  fi
  echo "【$id】 $name — $cask"
  if brew list --cask "$cask" >/dev/null 2>&1; then
    status='已存在'; note='Homebrew 紀錄已安裝；未重新安裝'
  elif HOMEBREW_NO_AUTO_UPDATE=0 brew install --cask "$cask"; then
    status='成功'; note='Homebrew 安裝指令完成'
  else
    status='失敗'; note='請檢查日誌及網路；未假定成功'
  fi
  printf '%s\t%s\tHomebrew %s\t%s\t%s\n' "$id" "$name" "$cask" "$status" "$note" >> "$REPORT"
done <<< "$FONTS"

python3 "$BASE_DIR/install-extras.py" --report "$REPORT" --report-dir "$REPORT_DIR"
extra_code=$?

cat >> "$REPORT" <<'EOF'
首組-2	可畫柔圓－繁	需確認授權／Canva	未安裝	未取得可供 macOS 本機安裝的官方授權字型檔
首組-3	UD角ゴC70	Fontworks LETS 商業字體	未安裝	需要有效授權或官方字體服務
首組-4	筑紫A丸ゴシック	Fontworks LETS 商業字體	未安裝	需要有效授權或官方字體服務
首組-5	モード明朝	Fontworks LETS 商業字體	未安裝	需要有效授權或官方字體服務
首組-6	はるなごみ Std	Fontworks LETS 商業字體	未安裝	需要有效授權或官方字體服務
EOF

echo
printf '執行完成。Codex 應核對最後報告中的每個狀態，不要僅以本訊息宣稱全部成功。\n'
printf '安裝紀錄：%s\n' "$REPORT"
printf '執行日誌：%s\n' "$LOG"
echo '付費或 Canva 限定字體不會從未授權的第三方來源下載。'
if [[ "$extra_code" -ne 0 ]]; then
  echo '注意：部分 GitHub／官方免費字體下載或驗證失敗，詳見 TSV 安裝紀錄。'
fi
exit 0
