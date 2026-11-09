<script setup lang="ts">
import { FileText, CornerDownRight } from "lucide-vue-next";
import type { Clause } from "../types";

defineProps<{ clause: Clause; quote?: string }>();
</script>

<template>
  <div class="source-content">
    <div class="source-document">
      <FileText :size="15" /><span>虚构示例条款</span
      ><span class="source-page">第 {{ clause.page }} 页</span>
    </div>
    <div class="paper-sheet">
      <div class="paper-eyebrow">{{ clause.section }}</div>
      <h3>
        {{ clause.id }}<span>{{ clause.title }}</span>
      </h3>
      <p v-for="(paragraph, index) in clause.paragraphs" :key="index">
        <template v-if="quote && paragraph.includes(quote)"
          >{{ paragraph.slice(0, paragraph.indexOf(quote))
          }}<mark>{{ quote }}</mark
          >{{
            paragraph.slice(paragraph.indexOf(quote) + quote.length)
          }}</template
        >
        <template v-else>{{ paragraph }}</template>
      </p>
      <div class="paper-bottom">
        <span>DYOLL · 演示合同</span><span>{{ clause.page }}</span>
      </div>
    </div>
    <div class="source-note">
      <CornerDownRight :size="15" /><span>{{
        quote
          ? "黄色标记对应当前批注的原句。"
          : "本条提供完整段落，尚未生成对应批注。"
      }}</span>
    </div>
    <p class="source-disclaimer">
      示例内容为虚构，仅用于展示阅读交互。页面展示条款文本，不是 PDF 原件预览。
    </p>
  </div>
</template>
