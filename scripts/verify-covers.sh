#!/bin/bash
# 校验所有文章的封面图是否存在

echo "🔍 检查封面图..."

ERRORS=0

# 遍历所有文章的 cover.image 配置
for img in $(grep -rh "image:" content/articles/ | awk '{print $2}' | sort -u); do
  # 去掉首尾引号和空格
  img=$(echo "$img" | tr -d '"' | tr -d ' ')
  
  if [ -z "$img" ]; then
    continue
  fi
  
  filepath="static$img"
  
  if [ ! -f "$filepath" ]; then
    echo "❌ 缺失: $filepath (文章中引用: $img)"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "✅ 所有封面图完整"
  exit 0
else
  echo "❌ 共 $ERRORS 个封面图缺失"
  exit 1
fi
