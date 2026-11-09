import type {
  Annotation,
  AnnotationPresentation,
  Clause,
  Verification,
} from "../types";

// 全部为专门编写的虚构演示条款，不对应真实产品，也不代表算法输出。
export const demoClauses: Clause[] = [
  {
    id: "第二条",
    title: "等待期",
    section: "保障开始之前",
    page: 2,
    paragraphs: [
      "本合同生效后，保险责任按照本条约定的时间开始。",
      "自本合同生效之日起 180 日为等待期。等待期内首次确诊本合同约定的重大疾病，我们退还已交保险费，本合同终止。",
      "因意外伤害导致的本合同约定的重大疾病，不受上述等待期限制。具体适用条件见本合同有关定义。",
    ],
  },
  {
    id: "第三条",
    title: "重大疾病保险金",
    section: "保险责任",
    page: 3,
    paragraphs: [
      "在本合同保险期间内，被保险人符合本合同约定的重大疾病保险金给付条件的，我们按照约定的基本保险金额给付保险金。",
      "重大疾病的范围、诊断及治疗条件以本合同疾病定义章节的相应条目为准。不同责任的适用条件应分别阅读。",
    ],
  },
  {
    id: "第五条",
    title: "持续治疗条件",
    section: "疾病定义",
    page: 4,
    paragraphs: [
      "本条为某项疾病定义的虚构示例，用于展示持续时间条件。",
      "须由专科医生确诊，并且接受本条约定的持续治疗不少于 180 日；满足本条全部条件后，按基本保险金额给付。",
      "本条所称持续治疗，应有相应医疗记录。疾病名称、治疗方式及其他要求应结合本章全文核对。",
    ],
  },
  {
    id: "第六条",
    title: "手术条件",
    section: "疾病定义",
    page: 5,
    paragraphs: [
      "本条仅展示“疾病诊断”与“实施治疗”的条件关系，不对应任何真实病种的行业定义。",
      "须同时满足以下条件：经专科医生明确诊断；已经实际实施本条约定的手术。符合上述条件的，按基本保险金额给付。",
      "手术名称、医院及其他适用条件见本条完整定义。",
    ],
  },
  {
    id: "第七条",
    title: "如实告知",
    section: "投保人的义务",
    page: 6,
    paragraphs: [
      "订立本合同时，我们就您和被保险人的有关情况提出询问，您应当如实告知。",
      "本条的适用还涉及实际询问内容、投保记录及其他事实。这些记录不包含在这份示例条款中。",
    ],
  },
  {
    id: "第九条",
    title: "犹豫期",
    section: "合同权益",
    page: 7,
    paragraphs: [
      "自您签收本合同之日起，有 15 日的犹豫期。在此期间，请您认真审视本合同。",
      "您在犹豫期内申请解除合同的，我们按本条约定退还所交保险费。犹豫期后解除合同的，按合同约定退还现金价值。",
      "申请方式、所需资料和现金价值计算依据，请参见合同解除条款。",
    ],
  },
  {
    id: "第十条",
    title: "其他疾病定义",
    section: "补充定义",
    page: 8,
    paragraphs: [
      "本合同另列的疾病，须符合相应条目中写明的诊断、程度及治疗条件。",
      "本示例尚未提供这一疾病与行业规范的对应关系，因此不能据此判断定义是否偏离规范。",
    ],
  },
];

export const demoAnnotations: Annotation[] = [
  {
    clauseId: "第二条",
    quote: demoClauses[0]!.paragraphs[1]!,
    plain:
      "等待期内首次确诊约定的重大疾病 → 生效后 180 日内适用这段约定 → 合同写明退还已交保费并终止合同。",
    riskLevel: "高",
    riskReason:
      "这段约定写在保障开始条款中。需要同时注意等待期的起算时间，以及期间内给付的是已交保费。",
    visibility: "保障开始条款中",
    benchmark: "contract_own",
    layer: 1,
    confidence: "高",
    needsReview: false,
  },
  {
    clauseId: "第六条",
    quote: demoClauses[3]!.paragraphs[1]!,
    plain:
      "本条约定的疾病情形 → 须同时满足确诊和实际实施约定手术 → 满足本条条件后按基本保险金额给付。",
    riskLevel: "高",
    riskReason:
      "“确诊”与“已经实施手术”是同时满足的条件，单看病名容易遗漏后一个要求。这里未进行行业规范比对。",
    visibility: "嵌在疾病定义中",
    benchmark: "not_compared",
    layer: 1,
    confidence: "高",
    needsReview: false,
  },
  {
    clauseId: "第五条",
    quote: demoClauses[2]!.paragraphs[1]!,
    plain:
      "本条约定的疾病情形 → 须由专科医生确诊且持续治疗不少于 180 日 → 满足本条全部条件后按基本保险金额给付。",
    riskLevel: "中",
    riskReason:
      "除确诊外，还写有持续治疗的时间条件。这里的 180 日是治疗时长，需要与第二条的等待期分别理解。",
    visibility: "嵌在疾病定义中",
    benchmark: "contract_own",
    layer: 1,
    confidence: "高",
    needsReview: false,
  },
  {
    clauseId: "第七条",
    quote: demoClauses[4]!.paragraphs[0]!,
    plain:
      "订立合同时接受询问 → 应如实回答保险人的有关询问 → 这一句规定告知义务，没有写明具体给付金额。",
    riskLevel: "中",
    riskReason:
      "合同条款不能代替实际健康告知问卷。询问范围及作答内容需要结合当时的投保记录核实。",
    visibility: "投保人义务条款中",
    benchmark: "contract_own",
    layer: 1,
    confidence: "高",
    needsReview: false,
  },
  {
    clauseId: "第九条",
    quote: demoClauses[5]!.paragraphs[1]!,
    plain:
      "申请解除合同 → 需要区分是否仍在犹豫期内 → 条款分别约定退还保险费或现金价值。",
    riskLevel: "低",
    riskReason:
      "犹豫期内外的退款依据不同。此处只摘出规则句，未计算或还原具体现金价值。",
    visibility: "合同权益条款中",
    benchmark: "contract_own",
    layer: 1,
    confidence: "高",
    needsReview: false,
  },
  {
    clauseId: "第十条",
    quote: demoClauses[6]!.paragraphs[0]!,
    plain:
      "合同另列的疾病 → 需符合相应条目的诊断、程度和治疗条件 → 这一句未写明具体给付，需结合对应责任阅读。",
    riskLevel: "未知",
    riskReason:
      "本演示没有这一病种的统一基准和比对结果。未知表示无法在这一维判断，不等于低风险。",
    visibility: "补充定义中",
    benchmark: "not_compared",
    layer: 2,
    confidence: "需复核",
    needsReview: true,
  },
];

export const presentation: Record<string, AnnotationPresentation> = {
  第二条: { title: "等待期内，给付方式有所不同", category: "等待期" },
  第六条: { title: "确诊之外，还要求实际实施手术", category: "附加条件" },
  第五条: { title: "持续治疗的时间，也是一项条件", category: "时间条件" },
  第七条: { title: "如实告知，需要结合实际问卷", category: "告知义务" },
  第九条: { title: "犹豫期前后，退款依据不同", category: "合同权益" },
  第十条: { title: "这项疾病定义，仍需进一步核实", category: "需复核" },
};

export const verifications: Verification[] = [
  {
    clauseId: "第二条",
    question: "这份合同的等待期从哪一天开始？",
    reason: "示例条款只有起算规则，没有你的实际生效日期。",
    contact: "保险公司",
  },
  {
    clauseId: "第七条",
    question: "投保时具体询问了哪些健康情况？",
    reason: "实际健康告知问卷和作答记录不在合同条款里。",
    contact: "保险公司",
  },
  {
    clauseId: "第十条",
    question: "这项疾病定义采用了什么基准？",
    reason: "当前示例未包含完整定义及适用规范版本。",
    contact: "保险公司或持牌顾问",
  },
];

export const mutualClauses: Clause[] = [
  {
    id: "第一节",
    title: "计划性质",
    section: "示例互助计划",
    page: 1,
    paragraphs: [
      "本计划由会员自愿加入，通过会员分摊方式承担互助支出。",
      "本材料为虚构互助计划样例，不是保险合同。",
    ],
  },
  {
    id: "第二节",
    title: "分摊安排",
    section: "示例互助计划",
    page: 1,
    paragraphs: [
      "成员根据计划约定参与分摊，具体安排以该计划规则为准。",
      "当前页面仅演示原文索引，不生成保险条款风险批注。",
    ],
  },
];
