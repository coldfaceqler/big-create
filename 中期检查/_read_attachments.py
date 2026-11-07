import sys, os
sys.path.insert(0, r"C:\Users\sages\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\Lib\site-packages")

base = r"D:\work\26fw\ainsurance pt2\中期检查"

# 附件2 docx
try:
    from docx import Document
    d = Document(os.path.join(base, "附件2 2026年度大学生创新创业训练计划创业训练、创业实践项目中期答辩安排.docx"))
    print("="*30, "附件2 docx", "="*30)
    for p in d.paragraphs:
        if p.text.strip():
            print(p.text)
    for t in d.tables:
        for row in t.rows:
            print(" | ".join(c.text for c in row.cells))
except Exception as e:
    print("docx err", e)

# 附件1 xlsx
try:
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(base, "附件1 2026年大学生创新创业训练计划项目立项名单.xlsx"), data_only=True)
    print("="*30, "附件1 xlsx", "="*30)
    for ws in wb.worksheets:
        print("--- sheet:", ws.title, ws.max_row, ws.max_column)
        for row in ws.iter_rows(values_only=True):
            vals = [str(v) for v in row if v is not None]
            if vals:
                print(" | ".join(vals))
except Exception as e:
    print("xlsx err", e)
