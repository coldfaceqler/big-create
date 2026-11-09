<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  FileText,
  FileUp,
  FolderOpen,
  List,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  AlertCircle,
  Info,
  Link2,
} from "lucide-vue-next";
import AnnotationCard from "./components/AnnotationCard.vue";
import SourceExcerpt from "./components/SourceExcerpt.vue";
import {
  demoAnnotations,
  demoClauses,
  mutualClauses,
  presentation,
  verifications,
} from "./data/demo";
import type { RiskLevel } from "./types";

type Scene = "demo" | "scan" | "parse" | "mutual" | "local";
const view = ref<"upload" | "processing" | "reader">("upload");
const readerTab = ref<"annotations" | "index">("annotations");
const selectedClause = ref("第二条");
const expandedClause = ref("第二条");
const riskFilter = ref<"全部" | RiskLevel>("全部");
const search = ref("");
const selectedName = ref("");
const selectedSize = ref("");
const fileStatus = ref<"none" | "checking" | "ready" | "invalid">("none");
const notice = ref<{
  title: string;
  body: string;
  type: "error" | "info";
} | null>(null);
const dragging = ref(false);
const isMutual = ref(false);
const processStep = ref(0);
const currentScene = ref<Scene>("demo");
const fileInput = ref<HTMLInputElement>();
const helpDialog = ref<HTMLDialogElement>();
const sourceDialog = ref<HTMLDialogElement>();
const sourcePanel = ref<HTMLElement>();
const filterOptions: ("全部" | RiskLevel)[] = [
  "全部",
  "高",
  "中",
  "低",
  "未知",
];
const timers: ReturnType<typeof setTimeout>[] = [];
let selectionVersion = 0;

const clauses = computed(() => (isMutual.value ? mutualClauses : demoClauses));
const currentClause = computed(
  () =>
    clauses.value.find((c) => c.id === selectedClause.value) ??
    clauses.value[0]!,
);
const currentAnnotation = computed(() =>
  isMutual.value
    ? undefined
    : demoAnnotations.find((a) => a.clauseId === currentClause.value.id),
);
const visibleAnnotations = computed(() =>
  demoAnnotations.filter(
    (a) =>
      (riskFilter.value === "全部" || a.riskLevel === riskFilter.value) &&
      [presentation[a.clauseId]?.title, a.quote, a.clauseId, a.plain]
        .join(" ")
        .includes(search.value.trim()),
  ),
);
const visibleClauses = computed(() =>
  clauses.value.filter((c) =>
    [c.id, c.title, ...c.paragraphs].join(" ").includes(search.value.trim()),
  ),
);
const highCount = demoAnnotations.filter((a) => a.riskLevel === "高").length;
const steps = computed(() =>
  currentScene.value === "local"
    ? ["检查所选文件", "等待解析服务"]
    : ["载入演示条款", "整理批注与索引", "准备阅读界面"],
);

function clearTimers() {
  timers.forEach(clearTimeout);
  timers.length = 0;
}
function goHome() {
  clearTimers();
  view.value = "upload";
  notice.value = null;
  sourceDialog.value?.close();
  window.scrollTo({ top: 0 });
}
function resetFile() {
  selectionVersion++;
  selectedName.value = "";
  selectedSize.value = "";
  fileStatus.value = "none";
  notice.value = null;
  if (fileInput.value) fileInput.value.value = "";
}
async function acceptFile(file?: File) {
  if (!file) return;
  const token = ++selectionVersion;
  notice.value = null;
  selectedName.value = file.name;
  selectedSize.value =
    file.size < 1024 * 1024
      ? `${Math.max(1, Math.round(file.size / 1024))} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  fileStatus.value = "checking";
  let error = "";
  if (!/\.pdf$/i.test(file.name)) error = "请选择 PDF 文件。";
  else if (file.size > 20 * 1024 * 1024)
    error = "此演示支持选择 20 MB 以内的 PDF。";
  else {
    try {
      const header = await file.slice(0, 5).text();
      if (header !== "%PDF-")
        error = "没有识别到有效的 PDF 文件头，请检查文件。";
    } catch {
      error = "无法读取这个文件，请重新选择。";
    }
  }
  if (token !== selectionVersion) return;
  fileStatus.value = error ? "invalid" : "ready";
  if (error)
    notice.value = {
      type: "error",
      title: "这个文件暂时无法使用",
      body: error,
    };
}
function onDrop(event: DragEvent) {
  dragging.value = false;
  void acceptFile(event.dataTransfer?.files[0]);
}
function onFileChange(event: Event) {
  void acceptFile((event.target as HTMLInputElement).files?.[0]);
}
function runScene(scene: Scene) {
  if (scene === "local" && fileStatus.value !== "ready") return;
  clearTimers();
  notice.value = null;
  currentScene.value = scene;
  processStep.value = 0;
  view.value = "processing";
  window.scrollTo({ top: 0 });
  timers.push(
    setTimeout(() => {
      processStep.value = 1;
    }, 550),
  );
  if (scene !== "local")
    timers.push(
      setTimeout(() => {
        processStep.value = 2;
      }, 1150),
    );
  timers.push(setTimeout(() => finishScene(scene), 1750));
}
function finishScene(scene: Scene) {
  if (scene === "scan" || scene === "parse" || scene === "local") {
    view.value = "upload";
    notice.value =
      scene === "scan"
        ? {
            type: "error",
            title: "扫描件情景：未能提取足够文字",
            body: "这是一条模拟失败提示。请使用可选择、复制文字的 PDF；第一阶段不提供扫描件文字识别。",
          }
        : scene === "parse"
          ? {
              type: "error",
              title: "解析失败情景：未完成分析",
              body: "这是一条模拟失败提示。文件可能已加密或损坏，请检查后重新选择。失败不会被显示为分析完成。",
            }
          : {
              type: "info",
              title: "文件已选择，等待接入解析服务",
              body: `“${selectedName.value}”仅完成了本地文件类型检查，未上传、未解析。你可以先打开示例合同体验批注阅读。`,
            };
    return;
  }
  isMutual.value = scene === "mutual";
  readerTab.value = isMutual.value ? "index" : "annotations";
  selectedClause.value = isMutual.value ? "第一节" : "第二条";
  expandedClause.value = selectedClause.value;
  search.value = "";
  riskFilter.value = "全部";
  view.value = "reader";
}
async function showSource(id: string, openMobile = true) {
  selectedClause.value = id;
  expandedClause.value = id;
  await nextTick();
  if (openMobile && window.matchMedia("(max-width: 1100px)").matches)
    sourceDialog.value?.showModal();
  else if (sourcePanel.value) sourcePanel.value.scrollTop = 0;
}
function selectAnnotation(id: string) {
  selectedClause.value = id;
  expandedClause.value = expandedClause.value === id ? "" : id;
}
function selectIndex(id: string) {
  void showSource(id);
}
function selectSidebar(id: string) {
  readerTab.value = "index";
  search.value = "";
  selectedClause.value = id;
  if (window.matchMedia("(max-width: 760px)").matches) void showSource(id);
}
function changeReaderTab(tab: "annotations" | "index") {
  readerTab.value = tab;
  search.value = "";
}
function riskCount(risk: string) {
  return risk === "全部"
    ? demoAnnotations.length
    : demoAnnotations.filter((a) => a.riskLevel === risk).length;
}
function closeBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget)
    (event.currentTarget as HTMLDialogElement).close();
}
onBeforeUnmount(clearTimers);
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="app-shell" :class="{ 'reading-shell': view === 'reader' }">
    <header class="app-header">
      <button
        class="brand"
        aria-label="DYOLL一结合大语言模型的保险合同分析软件，返回上传页面"
        @click="goHome"
      >
        <span class="brand-mark"
          ><BookOpen :size="22" :stroke-width="1.8" /></span
        ><span class="brand-name">DYOLL</span><span class="brand-divider"></span
        ><span class="brand-description">结合大语言模型的保险合同分析软件</span>
      </button>
      <nav class="header-nav" aria-label="主导航">
        <button :class="{ 'nav-active': view !== 'reader' }" @click="goHome">
          工作台</button
        ><button @click="helpDialog?.showModal()">使用说明</button>
      </nav>
      <span class="demo-badge"><span></span>中期演示</span>
    </header>

    <main v-if="view === 'upload'" id="main-content" class="upload-page">
      <section class="welcome-heading">
        <div class="small-intro">
          <span class="intro-line"></span>让每一项条件，都被看见
        </div>
        <h1>合同里的小字，<br />值得被<span>认真读懂。</span></h1>
        <p>
          读清等待期、给付条件与容易忽略的限制。<br
            class="desktop-break"
          />每一条解释，都有合同原文可以回看。
        </p>
      </section>
      <div class="upload-grid">
        <section class="upload-card" aria-labelledby="upload-heading">
          <div class="card-heading">
            <div class="heading-icon"><FileUp :size="20" /></div>
            <div>
              <h2 id="upload-heading">从一份合同开始</h2>
              <p>选择你的重疾险合同 PDF</p>
            </div>
            <span class="step-tag">01 / 上传</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,application/pdf"
            class="sr-only"
            aria-label="选择 PDF 合同"
            @change="onFileChange"
          />
          <div
            class="drop-zone"
            :class="{ dragging, 'has-file': selectedName }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            <template v-if="!selectedName"
              ><div class="upload-symbol">
                <Upload :size="27" :stroke-width="1.6" />
              </div>
              <h3>把合同拖到这里</h3>
              <p>或从电脑中选择文件</p>
              <button
                class="button secondary choose-button"
                @click="fileInput?.click()"
              >
                <FolderOpen :size="16" />选择 PDF 文件</button
              ><span class="file-hint">PDF 格式 · 最大 20 MB</span></template
            >
            <template v-else
              ><div class="selected-file-icon"><FileText :size="29" /></div>
              <h3 class="selected-filename">{{ selectedName }}</h3>
              <p>
                {{ selectedSize }} ·
                {{
                  fileStatus === "checking"
                    ? "正在检查文件…"
                    : fileStatus === "invalid"
                      ? "请重新选择文件"
                      : "已在本地选择"
                }}
              </p>
              <div class="file-actions">
                <button class="text-button" @click="fileInput?.click()">
                  更换文件</button
                ><button class="text-button muted" @click="resetFile">
                  移除
                </button>
              </div></template
            >
          </div>
          <div
            v-if="notice"
            class="status-notice"
            :class="notice.type"
            role="status"
          >
            <AlertCircle v-if="notice.type === 'error'" :size="19" /><Info
              v-else
              :size="19"
            />
            <div>
              <strong>{{ notice.title }}</strong>
              <p>{{ notice.body }}</p>
            </div>
            <button
              class="icon-button"
              aria-label="关闭提示"
              @click="notice = null"
            >
              <X :size="15" />
            </button>
          </div>
          <button
            class="button primary upload-primary"
            :disabled="fileStatus === 'checking' || fileStatus === 'invalid'"
            @click="runScene(fileStatus === 'none' ? 'demo' : 'local')"
          >
            <LoaderCircle
              v-if="fileStatus === 'checking'"
              :size="17"
              class="spin"
            /><span>{{
              fileStatus === "none" ? "打开示例合同" : "继续阅读"
            }}</span
            ><ArrowRight :size="18" />
          </button>
          <p class="upload-privacy">
            <ShieldCheck
              :size="15"
            />本演示只在本地选择文件，不上传或存储你的合同。
          </p>
          <div class="demo-invite">
            <div>
              <strong>手边没有合同？</strong
              ><span>用一份示例，看看批注如何帮助阅读。</span>
            </div>
            <button class="text-button" @click="runScene('demo')">
              体验示例<ArrowRight :size="16" />
            </button>
          </div>
        </section>

        <aside class="preview-card" aria-label="批注样式预览">
          <div class="preview-top">
            <span><Sparkles :size="16" />一条批注，读清三件事</span
            ><span class="mini-label">示例预览</span>
          </div>
          <div class="preview-paper">
            <div class="preview-doc-title">
              <FileText :size="16" /><span>示例重疾险条款</span
              ><span>第 2 页</span>
            </div>
            <div class="preview-lines"><i></i><i></i></div>
            <p>
              <span
                >自本合同生效之日起
                <mark>180 日为等待期</mark
                >。等待期内首次确诊约定的重大疾病，<mark>退还已交保险费</mark>，本合同终止。</span
              >
            </p>
            <div class="preview-lines bottom"><i></i><i></i></div>
          </div>
          <div class="preview-connector">
            <span></span><Link2 :size="15" /><span></span>
          </div>
          <div class="preview-annotation">
            <div class="preview-annotation-head">
              <span class="risk-badge high"
                ><span class="risk-dot"></span>高关注</span
              ><span>等待期 · 第二条</span>
            </div>
            <h3>时间条件，也会影响给付方式</h3>
            <p>等待期内确诊 → 生效后 180 日内 →<br />合同写明退还已交保费。</p>
            <div class="preview-annotation-bottom">
              <span><CheckCheck :size="14" />原句可回溯</span
              ><button class="text-button" @click="runScene('demo')">
                展开看看<ArrowUpRight :size="15" />
              </button>
            </div>
          </div>
          <p class="preview-caption">原文、白话、关注点，放在一起看。</p>
        </aside>
      </div>
      <section class="principles" aria-label="阅读方式">
        <div>
          <span class="principle-icon"><Search :size="20" /></span>
          <div>
            <h3>把条件找出来</h3>
            <p>留意等待期、时间及手术要求</p>
          </div>
        </div>
        <div>
          <span class="principle-icon"><BookOpen :size="20" /></span>
          <div>
            <h3>用白话读清楚</h3>
            <p>分开看情形、附加条件与给付</p>
          </div>
        </div>
        <div>
          <span class="principle-icon"><Link2 :size="20" /></span>
          <div>
            <h3>随时回到原文</h3>
            <p>每一条批注，都能核对上下文</p>
          </div>
        </div>
      </section>
      <details class="scenario-tools">
        <summary><CircleHelp :size="15" />演示其他处理情况</summary>
        <div>
          <button @click="runScene('scan')">扫描件无法解析</button
          ><button @click="runScene('parse')">文件解析失败</button
          ><button @click="runScene('mutual')">材料不是重疾险合同</button>
        </div>
        <p>这些按钮载入预设情景，不会识别或分析你选择的文件。</p>
      </details>
    </main>

    <main
      v-else-if="view === 'processing'"
      id="main-content"
      class="processing-page"
      aria-live="polite"
    >
      <div class="processing-card">
        <div class="processing-orbit"><FileText :size="36" /><span></span></div>
        <span class="mini-label">{{
          currentScene === "local" ? "本地文件" : "演示流程"
        }}</span>
        <h1>
          {{
            currentScene === "local" ? "准备你的阅读界面" : "正在打开演示内容"
          }}
        </h1>
        <p>
          {{
            currentScene === "local"
              ? selectedName
              : currentScene === "mutual"
                ? "示例互助计划"
                : "示例重疾险条款.pdf"
          }}
        </p>
        <ol class="processing-steps">
          <li
            v-for="(step, i) in steps"
            :key="step"
            :class="{ current: processStep === i, done: processStep > i }"
          >
            <Check v-if="processStep > i" :size="17" /><LoaderCircle
              v-else-if="processStep === i"
              :size="17"
              class="spin"
            /><span v-else class="step-circle"></span>{{ step }}
          </li>
        </ol>
        <p class="process-disclosure">
          {{
            currentScene === "local"
              ? "仅检查文件类型，当前尚未接入分析后端。"
              : "正在载入预设的虚构样例，不是真实算法分析。"
          }}
        </p>
        <button class="text-button muted" @click="goHome">取消并返回</button>
      </div>
    </main>

    <main v-else id="main-content" class="reader-page">
      <div class="reader-topbar">
        <button class="back-button" @click="goHome">
          <ArrowLeft :size="17" />返回工作台
        </button>
        <div class="reader-top-actions">
          <span><span class="demo-dot"></span>演示数据 · 非真实分析</span
          ><button class="button secondary small" @click="goHome">
            <Upload :size="15" />选择其他合同
          </button>
        </div>
      </div>
      <section class="document-heading">
        <div class="document-icon">
          <FileText :size="27" :stroke-width="1.5" />
        </div>
        <div>
          <div class="document-title-row">
            <h1>{{ isMutual ? "示例互助计划" : "示例重疾险条款" }}</h1>
            <span class="document-tag">虚构样例</span>
          </div>
          <p>
            {{
              isMutual
                ? "性质提醒情景 · 仅展示原文索引"
                : "重疾险 · 单份合同阅读"
            }}<span class="dot-separator">·</span
            >{{ clauses.length }} 段原文可查
          </p>
        </div>
        <div v-if="!isMutual" class="document-summary">
          <span
            ><b>{{ demoAnnotations.length }}</b> 条批注</span
          ><span
            ><b class="warm-text">{{ highCount }}</b> 条高关注</span
          ><span><b>3</b> 项待核实</span>
        </div>
      </section>
      <div v-if="isMutual" class="nature-warning" role="status">
        <AlertCircle :size="23" />
        <div>
          <strong>这份材料看起来不是一份由保险公司出具的重疾险合同。</strong>
          <p>
            示例材料出现“会员分摊”等表述。已停止深度批注，下面仅保留原文索引。这是性质提示，不是法律裁定。
          </p>
        </div>
      </div>
      <div v-else class="coverage-strip">
        <span
          ><CheckCheck :size="16" /><b>第一层批注样式已展示</b
          ><span class="coverage-detail">等待期、条件句、告知义务等</span></span
        ><span
          ><CircleHelp :size="15" />疾病定义比对未完成<span
            class="coverage-detail"
            >· 无真实召回评测</span
          ></span
        >
      </div>
      <div class="reader-layout">
        <aside class="clause-sidebar">
          <h2>
            <List :size="16" />条款目录<span>{{ clauses.length }}</span>
          </h2>
          <button
            v-for="clause in clauses"
            :key="clause.id"
            class="clause-nav-item"
            :class="{ selected: selectedClause === clause.id }"
            @click="selectSidebar(clause.id)"
          >
            <span>{{ clause.id }}</span
            ><strong>{{ clause.title }}</strong
            ><ChevronRight :size="14" />
          </button>
          <div class="sidebar-footnote">
            <ShieldCheck :size="17" />
            <p>解释来自条款，<br />决定留给你自己。</p>
          </div>
        </aside>
        <section class="annotation-column" aria-label="批注与索引">
          <div class="reader-tabs" role="tablist" aria-label="阅读方式">
            <button
              v-if="!isMutual"
              role="tab"
              :aria-selected="readerTab === 'annotations'"
              :class="{ active: readerTab === 'annotations' }"
              @click="changeReaderTab('annotations')"
            >
              风险批注<span>{{ demoAnnotations.length }}</span></button
            ><button
              role="tab"
              :aria-selected="readerTab === 'index'"
              :class="{ active: readerTab === 'index' }"
              @click="changeReaderTab('index')"
            >
              原文索引<span>{{ clauses.length }}</span>
            </button>
          </div>
          <div class="list-controls">
            <div
              v-if="readerTab === 'annotations'"
              class="risk-filters"
              aria-label="按关注等级筛选"
            >
              <button
                v-for="risk in filterOptions"
                :key="risk"
                :class="{ active: riskFilter === risk }"
                :aria-pressed="riskFilter === risk"
                @click="riskFilter = risk"
              >
                {{
                  risk === "全部"
                    ? "全部"
                    : risk === "未知"
                      ? "未知"
                      : risk + "关注"
                }}<span>{{ riskCount(risk) }}</span>
              </button>
            </div>
            <label class="search-field"
              ><Search :size="16" /><input
                v-model="search"
                :placeholder="
                  readerTab === 'index'
                    ? '搜索条款编号或正文…'
                    : '搜索批注或关键词…'
                "
                :aria-label="
                  readerTab === 'index' ? '搜索条款' : '搜索批注'
                " /><button
                v-if="search"
                class="icon-button"
                aria-label="清空搜索"
                @click="search = ''"
              >
                <X :size="14" /></button
            ></label>
          </div>
          <template v-if="readerTab === 'annotations'"
            ><div class="list-note">
              <span>按关注程度排列，未知不代表低风险</span
              ><span>{{ visibleAnnotations.length }} 条</span>
            </div>
            <div class="annotation-list">
              <AnnotationCard
                v-for="(annotation, i) in visibleAnnotations"
                :key="annotation.clauseId"
                :annotation="annotation"
                :details="presentation[annotation.clauseId]!"
                :active="expandedClause === annotation.clauseId"
                :index="i"
                @select="selectAnnotation(annotation.clauseId)"
                @source="showSource(annotation.clauseId)"
              />
            </div>
            <div v-if="!visibleAnnotations.length" class="empty-state">
              <Search :size="29" />
              <h3>没有找到对应批注</h3>
              <p>试试其他关键词，或查看全部关注等级。</p>
              <button
                class="text-button"
                @click="
                  search = '';
                  riskFilter = '全部';
                "
              >
                清除筛选
              </button>
            </div>
            <section class="verification-section">
              <div class="verification-heading">
                <CircleHelp :size="20" />
                <div>
                  <h2>还需要你核实的事项</h2>
                  <p>有些信息，单靠这份合同无法回答。</p>
                </div>
                <span>{{ verifications.length }} 项</span>
              </div>
              <article
                v-for="(item, i) in verifications"
                :key="item.clauseId"
                class="verification-item"
              >
                <span class="verification-number">{{ i + 1 }}</span>
                <div>
                  <h3>{{ item.question }}</h3>
                  <p>{{ item.reason }}</p>
                  <div>
                    <span>建议询问：{{ item.contact }}</span
                    ><button
                      class="text-button"
                      @click="showSource(item.clauseId)"
                    >
                      {{ item.clauseId }}<ArrowUpRight :size="13" />
                    </button>
                  </div>
                </div>
              </article></section
          ></template>
          <template v-else
            ><p class="index-intro">
              按条款顺序浏览原文，点击条目查看完整上下文。
            </p>
            <div class="index-list">
              <button
                v-for="clause in visibleClauses"
                :key="clause.id"
                class="index-card"
                :class="{ active: selectedClause === clause.id }"
                @click="selectIndex(clause.id)"
              >
                <span class="index-card-heading"
                  ><span>{{ clause.id }}</span
                  ><strong>{{ clause.title }}</strong
                  ><ArrowUpRight :size="16"
                /></span>
                <p>{{ clause.paragraphs[0] }}</p>
                <span class="index-meta"
                  >{{ clause.section
                  }}<span>第 {{ clause.page }} 页</span></span
                >
              </button>
            </div>
            <div v-if="!visibleClauses.length" class="empty-state">
              <Search :size="27" />
              <h3>没有找到对应条款</h3>
              <button class="text-button" @click="search = ''">清空搜索</button>
            </div></template
          >
          <p class="reading-boundary">
            本工具辅助阅读合同，不判断是否值得购买，也不作具体赔付结论。
          </p>
        </section>
        <aside ref="sourcePanel" class="source-panel" aria-label="原文上下文">
          <div class="source-panel-title">
            <h2><BookOpen :size="18" />原文回溯</h2>
            <span>随批注定位</span>
          </div>
          <SourceExcerpt
            :clause="currentClause"
            :quote="currentAnnotation?.quote"
          />
        </aside>
      </div>
    </main>
    <footer v-if="view !== 'reader'" class="app-footer">
      <span>DYOLL<span class="dot-separator">·</span>大学生创新训练项目</span
      ><span>辅助阅读，不作购买或赔付判断</span
      ><button @click="helpDialog?.showModal()">
        关于本演示<ArrowUpRight :size="13" />
      </button>
    </footer>
  </div>

  <dialog
    ref="helpDialog"
    class="help-dialog"
    aria-labelledby="help-title"
    @click="closeBackdrop"
  >
    <div class="dialog-header">
      <span class="brand-mark"><BookOpen :size="21" /></span
      ><button
        class="icon-button"
        aria-label="关闭说明"
        @click="helpDialog?.close()"
      >
        <X :size="20" />
      </button>
    </div>
    <h2 id="help-title">先体验一次，把条款读清楚。</h2>
    <p class="dialog-lead">这是 DYOLL 的中期前端交互原型。</p>
    <ol class="help-steps">
      <li>
        <span>1</span>
        <div>
          <strong>打开示例合同</strong>
          <p>无需准备文件，即可进入完整阅读流程。</p>
        </div>
      </li>
      <li>
        <span>2</span>
        <div>
          <strong>读一条批注</strong>
          <p>一起看合同原文、白话解释和需要关注的条件。</p>
        </div>
      </li>
      <li>
        <span>3</span>
        <div>
          <strong>回到原文核对</strong>
          <p>点击“查看原文与上下文”，找到对应句子。</p>
        </div>
      </li>
    </ol>
    <div class="help-disclosure">
      <Info :size="18" />
      <p>
        批注、关注等级和条款均为预设的虚构演示数据。目前未接入 PDF
        解析、风险识别或模型分析；选择本地文件不会上传。批注样例仍需产品同学确认。
      </p>
    </div>
    <button
      class="button primary"
      @click="
        helpDialog?.close();
        runScene('demo');
      "
    >
      打开示例合同<ArrowRight :size="17" />
    </button>
  </dialog>
  <dialog
    ref="sourceDialog"
    class="mobile-source-dialog"
    aria-labelledby="mobile-source-title"
    @click="closeBackdrop"
  >
    <div class="dialog-header">
      <h2 id="mobile-source-title"><BookOpen :size="19" />原文回溯</h2>
      <button
        class="icon-button"
        aria-label="关闭原文"
        @click="sourceDialog?.close()"
      >
        <X :size="20" />
      </button>
    </div>
    <SourceExcerpt
      :clause="currentClause"
      :quote="currentAnnotation?.quote"
    /><button
      class="button secondary full-width"
      @click="sourceDialog?.close()"
    >
      返回阅读
    </button>
  </dialog>
</template>
