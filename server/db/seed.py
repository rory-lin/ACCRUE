SEED_ACCOUNTS = [
    ("支付宝", "alipay", 0),
    ("微信钱包", "wechat", 0),
    ("银行卡", "bank_card", 0),
    ("信用卡", "credit_card", 0),
    ("现金", "cash", 0),
]

SEED_EXPENSE_CATEGORIES = [
    ("消费购物", 1),
    ("食品饮食", 2),
    ("休闲娱乐", 3),
    ("交通出行", 4),
    ("居住生活", 5),
    ("医疗健康", 6),
    ("教育学习", 7),
    ("人情往来", 8),
    ("金融保险", 9),
    ("其他支出", 10),
]

SEED_INCOME_CATEGORIES = [
    ("工资薪酬", 1),
    ("兼职外快", 2),
    ("投资理财", 3),
    ("补贴补助", 4),
    ("奖金", 5),
    ("其他收入", 6),
]

SEED_SUB_CATEGORIES = {
    "食品饮食": ["早餐", "午餐", "晚餐", "零食", "饮品"],
    "消费购物": ["日用品", "服饰鞋帽", "数码电器", "美妆护肤"],
    "交通出行": ["公交", "地铁", "打车", "加油", "共享单车"],
    "休闲娱乐": ["电影", "游戏", "旅行", "KTV", "运动"],
    "居住生活": ["房租", "水电费", "物业费", "网费", "维修"],
    "医疗健康": ["门诊", "药品", "体检"],
    "教育学习": ["书籍", "培训", "考试"],
    "工资薪酬": ["基本工资", "绩效奖金"],
    "投资理财": ["股票", "基金", "利息"],
}


def run_seed(conn):
    """Seed initial data if tables are empty."""
    _seed_accounts(conn)
    _seed_categories(conn)


def _seed_accounts(conn):
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS cnt FROM accounts")
        row = cursor.fetchone()
        if row["cnt"] > 0:
            return
        for name, type_, balance in SEED_ACCOUNTS:
            cursor.execute(
                "INSERT INTO accounts (name, type, balance) VALUES (%s, %s, %s)",
                (name, type_, balance),
            )
        conn.commit()


def _seed_categories(conn):
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS cnt FROM categories")
        row = cursor.fetchone()
        if row["cnt"] > 0:
            return

        # Insert top-level expense categories
        for name, sort_order in SEED_EXPENSE_CATEGORIES:
            cursor.execute(
                "INSERT INTO categories (name, type, sort_order, is_system) VALUES (%s, 'expense', %s, 1)",
                (name, sort_order),
            )

        # Insert top-level income categories
        for name, sort_order in SEED_INCOME_CATEGORIES:
            cursor.execute(
                "INSERT INTO categories (name, type, sort_order, is_system) VALUES (%s, 'income', %s, 1)",
                (name, sort_order),
            )

        conn.commit()

        # Insert sub-categories
        for parent_name, children in SEED_SUB_CATEGORIES.items():
            cursor.execute(
                "SELECT id, type FROM categories WHERE name = %s", (parent_name,)
            )
            parent = cursor.fetchone()
            if parent is None:
                continue
            parent_id = parent["id"]
            parent_type = parent["type"]
            for idx, child_name in enumerate(children, start=1):
                cursor.execute(
                    "INSERT INTO categories (name, type, parent_id, sort_order, is_system) VALUES (%s, %s, %s, %s, 1)",
                    (child_name, parent_type, parent_id, idx),
                )

        conn.commit()
