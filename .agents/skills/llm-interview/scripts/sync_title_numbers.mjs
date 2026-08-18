#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../../..");
const sidebarPath = path.join(repoRoot, "src/.vuepress/sidebar.ts");
const articleDir = path.join(repoRoot, "src/backend_series/llm_interview");
const shouldWrite = process.argv.includes("--write");

const sidebarSource = fs.readFileSync(sidebarPath, "utf8");
const groupsStart = sidebarSource.indexOf("const llmInterviewGroups = [");
const groupsEnd = sidebarSource.indexOf("// 左侧侧边栏", groupsStart);

if (groupsStart < 0 || groupsEnd < 0) {
  throw new Error("无法在 sidebar.ts 中定位 llmInterviewGroups");
}

const groupsSource = sidebarSource.slice(groupsStart, groupsEnd);
const groupPattern = /text:\s*"([^"]+)"\s*,\s*collapsible:\s*true\s*,\s*children:\s*numberedInterviewQuestions\(\[([\s\S]*?)\]\)\s*,?\s*\}/g;
const itemPattern = /\{\s*text:\s*"((?:[^"\\]|\\.)*)"\s*,\s*link:\s*"([^"]+)"\s*,?\s*\}/g;
const groups = [];
const linkedFiles = new Set();

for (const groupMatch of groupsSource.matchAll(groupPattern)) {
  const [, groupName, itemsSource] = groupMatch;
  const items = [];

  for (const itemMatch of itemsSource.matchAll(itemPattern)) {
    const [, rawText, link] = itemMatch;
    if (!link.startsWith("/backend_series/llm_interview/") || !link.endsWith(".md")) {
      continue;
    }

    const fileName = path.basename(link);
    if (linkedFiles.has(fileName)) {
      throw new Error(`侧边栏重复引用: ${fileName}`);
    }

    linkedFiles.add(fileName);
    items.push({
      fileName,
      question: JSON.parse(`"${rawText}"`),
    });
  }

  if (items.length === 0) {
    throw new Error(`分类未解析到题目: ${groupName}`);
  }

  groups.push({ groupName, items });
}

if (groups.length === 0) {
  throw new Error("未解析到任何 LLM 面试题分类");
}

const articleFiles = fs
  .readdirSync(articleDir)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();
const unlinkedFiles = articleFiles.filter((fileName) => !linkedFiles.has(fileName));

if (unlinkedFiles.length > 0) {
  throw new Error(`以下文章未加入侧边栏: ${unlinkedFiles.join(", ")}`);
}

const mismatches = [];

for (const { groupName, items } of groups) {
  for (const [index, item] of items.entries()) {
    const expectedNumber = index + 1;
    const articlePath = path.join(articleDir, item.fileName);

    if (!fs.existsSync(articlePath)) {
      throw new Error(`侧边栏指向的文章不存在: ${item.fileName}`);
    }

    const source = fs.readFileSync(articlePath, "utf8");
    const titleMatch = source.match(/^title:\s*(\d+)\.\s*(.+)$/m);

    if (!titleMatch) {
      throw new Error(`文章缺少可识别的 frontmatter title: ${item.fileName}`);
    }

    const currentNumber = Number(titleMatch[1]);
    if (currentNumber === expectedNumber) {
      continue;
    }

    mismatches.push({
      groupName,
      fileName: item.fileName,
      currentNumber,
      expectedNumber,
    });

    if (shouldWrite) {
      const updated = source.replace(
        /^title:\s*\d+\.\s*(.+)$/m,
        `title: ${expectedNumber}. $1`,
      );
      fs.writeFileSync(articlePath, updated, "utf8");
    }
  }
}

if (mismatches.length === 0) {
  console.log(`编号检查通过：${groups.length} 个分类、${linkedFiles.size} 篇文章与侧边栏完全一致。`);
  process.exit(0);
}

for (const mismatch of mismatches) {
  console.log(
    `${mismatch.groupName} | ${mismatch.fileName}: ${mismatch.currentNumber} -> ${mismatch.expectedNumber}`,
  );
}

if (shouldWrite) {
  console.log(`已修复 ${mismatches.length} 篇文章的 frontmatter 编号。`);
  process.exit(0);
}

console.error(`发现 ${mismatches.length} 处编号不一致。使用 --write 自动修复。`);
process.exit(1);
