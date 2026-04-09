import csv
import io
import json
from openpyxl import Workbook
from db.database import get_connection
from dao import transaction_dao
from models.transaction import TransactionQuery


def export_csv(date_from: str = None, date_to: str = None) -> str:
    """Export transactions as CSV string."""
    conn = get_connection()
    try:
        query = TransactionQuery(date_from=date_from, date_to=date_to, page=1, page_size=10000)
        items, _ = transaction_dao.find_all(conn, query)

        output = io.StringIO()
        output.write('\ufeff')  # BOM for Excel
        writer = csv.writer(output)
        writer.writerow(['日期', '类型', '金额', '一级分类', '二级分类', '账户', '备注', '标签'])
        for item in items:
            tags_str = ''
            if item.get('tags'):
                try:
                    tags_str = ','.join(json.loads(item['tags'])) if isinstance(item['tags'], str) else str(item['tags'])
                except:
                    tags_str = str(item.get('tags', ''))
            writer.writerow([
                item.get('date', ''),
                '收入' if item.get('type') == 'income' else '支出',
                item.get('amount', 0),
                item.get('category_name', ''),
                item.get('sub_category_name', ''),
                item.get('account_name', ''),
                item.get('note', ''),
                tags_str,
            ])
        return output.getvalue()
    finally:
        conn.close()


def export_excel(date_from: str = None, date_to: str = None) -> bytes:
    """Export transactions as Excel bytes."""
    conn = get_connection()
    try:
        query = TransactionQuery(date_from=date_from, date_to=date_to, page=1, page_size=10000)
        items, _ = transaction_dao.find_all(conn, query)

        wb = Workbook()
        ws = wb.active
        ws.title = "交易明细"
        ws.append(['日期', '类型', '金额', '一级分类', '二级分类', '账户', '备注', '标签'])
        for item in items:
            tags_str = ''
            if item.get('tags'):
                try:
                    tags_str = ','.join(json.loads(item['tags'])) if isinstance(item['tags'], str) else str(item['tags'])
                except:
                    tags_str = str(item.get('tags', ''))
            ws.append([
                item.get('date', ''),
                '收入' if item.get('type') == 'income' else '支出',
                float(item.get('amount', 0)),
                item.get('category_name', ''),
                item.get('sub_category_name', ''),
                item.get('account_name', ''),
                item.get('note', ''),
                tags_str,
            ])

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()
    finally:
        conn.close()
