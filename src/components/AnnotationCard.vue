<script setup lang="ts">
import {
  ArrowUpRight,
  CheckCheck,
  CircleHelp,
  ChevronDown,
} from "lucide-vue-next";
import type { Annotation, AnnotationPresentation } from "../types";

defineProps<{
  annotation: Annotation;
  details: AnnotationPresentation;
  active: boolean;
  index: number;
}>();
defineEmits<{ select: []; source: [] }>();
const tone = (risk: string) =>
  ({ 高: "high", 中: "medium", 低: "low", 未知: "unknown" })[risk];
</script>

<template>
  <article class="annotation-card" :class="{ active }">
    <div class="annotation-topline">
      <span class="risk-badge" :class="tone(annotation.riskLevel)"
        ><span class="risk-dot"></span
        >{{
          annotation.riskLevel === "未知"
            ? "风险未知"
            : annotation.riskLevel + "关注"
        }}</span
      ><span class="category-label">{{ details.category }}</span
      ><span class="annotation-number">{{
        String(index + 1).padStart(2, "0")
      }}</span>
    </div>
    <button
      class="annotation-title"
      :aria-expanded="active"
      @click="$emit('select')"
    >
      <h3>{{ details.title }}</h3>
      <ChevronDown :size="17" :class="{ rotated: active }" />
    </button>
    <div class="quote-block">
      <span class="quote-label">合同原文 · {{ annotation.clauseId }}</span>
      <p :class="{ clamped: !active }">{{ annotation.quote }}</p>
    </div>
    <div v-if="active" class="annotation-expanded">
      <div class="plain-block">
        <span class="section-caption">换个说法</span>
        <ol>
          <li v-for="(part, i) in annotation.plain.split(' → ')" :key="i">
            <span>{{ ["情形", "条件", "给付"][i] }}</span
            >{{ part }}
          </li>
        </ol>
      </div>
      <div class="risk-explanation">
        <span class="section-caption">为什么需要关注</span>
        <p>{{ annotation.riskReason }}</p>
      </div>
      <div class="evidence-row">
        <span
          ><CircleHelp v-if="annotation.needsReview" :size="14" /><CheckCheck
            v-else
            :size="14"
          />{{ annotation.needsReview ? "需复核" : "样例原句已对照" }}</span
        ><span>{{
          annotation.benchmark === "not_compared"
            ? "尚未进行规范比对"
            : "依据本合同示例"
        }}</span>
      </div>
    </div>
    <button class="source-link" @click="$emit('source')">
      查看原文与上下文<ArrowUpRight :size="15" />
    </button>
  </article>
</template>
