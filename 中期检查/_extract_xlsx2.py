import sys, os
sys.path.insert(0, r"C:\Users\sages\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\Lib\site-packages")

base = r"D:\work\26fw\ainsurance pt2\中期检查"

import openpyxl
wb = openpyxl.load_workbook(os.path.join(base, "附件1 2026年大学生创新创业训练计划项目立项名单.xlsx"), data_only=True)
ws = wb.worksheets[0]
header = [str(c.value) for c in ws[1]]
print("HEADER:", " | ".join(header))
print("=" * 80)
kw = ["重疾", "保险", "合同", "批注", "DYOLL", "条款", "健康险", "风险"]
for row in ws.iter_rows(min_row=2, values_only=True):
    joined = " | ".join(str(v) for v in row if v is not None)
    if any(k in joined for k in kw):
        print(joined)
