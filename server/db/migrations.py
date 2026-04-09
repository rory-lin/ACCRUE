MIGRATIONS = {
    1: [
        """CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  icon VARCHAR(50) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",
        """CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type ENUM('expense', 'income') NOT NULL,
  parent_id INT DEFAULT NULL,
  icon VARCHAR(50) DEFAULT '',
  sort_order INT DEFAULT 0,
  is_system TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",
        """CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('expense', 'income') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category_id INT NOT NULL,
  sub_category_id INT DEFAULT NULL,
  account_id INT NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  tags JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (sub_category_id) REFERENCES categories(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",
        """CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  month VARCHAR(7) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE KEY uk_category_month (category_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",
        """CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",
    ],
    2: [
        "CREATE INDEX idx_transactions_date ON transactions(date);",
        "CREATE INDEX idx_transactions_type_date ON transactions(type, date);",
        "CREATE INDEX idx_transactions_account ON transactions(account_id);",
        "CREATE INDEX idx_transactions_category ON transactions(category_id);",
    ],
    3: [
        "ALTER TABLE categories ADD COLUMN expense_nature ENUM('fixed', 'variable', 'discretionary') DEFAULT NULL;",
        "ALTER TABLE transactions ADD COLUMN expense_nature ENUM('fixed', 'variable', 'discretionary') DEFAULT NULL;",
        "UPDATE categories SET expense_nature = 'fixed' WHERE name = '居住生活' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'fixed' WHERE name = '金融保险' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'variable' WHERE name = '食品饮食' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'variable' WHERE name = '交通出行' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'variable' WHERE name = '医疗健康' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'variable' WHERE name = '教育学习' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'variable' WHERE name = '人情往来' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'discretionary' WHERE name = '消费购物' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'discretionary' WHERE name = '休闲娱乐' AND type = 'expense';",
        "UPDATE categories SET expense_nature = 'discretionary' WHERE name = '其他支出' AND type = 'expense';",
    ],
}


def run_migrations(conn):
    """Run all pending schema migrations."""
    with conn.cursor() as cursor:
        # Check if migration 1 needs re-run (partial failure recovery)
        cursor.execute(
            """CREATE TABLE IF NOT EXISTS schema_version (
                version INT PRIMARY KEY
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"""
        )
        conn.commit()

        # Check if transactions table exists with bad schema
        cursor.execute("SHOW TABLES LIKE 'transactions'")
        txn_exists = cursor.fetchone()
        if txn_exists:
            # Check if note column has default
            cursor.execute("SHOW COLUMNS FROM transactions LIKE 'note'")
            col = cursor.fetchone()
            if col and col.get("Default") is not None:
                # Bad schema - drop all tables and re-migrate
                print("Detected bad schema, re-creating tables...")
                for table in ["transactions", "budgets", "categories", "accounts", "settings", "schema_version"]:
                    cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
                conn.commit()

        cursor.execute("SELECT MAX(version) AS ver FROM schema_version")
        row = cursor.fetchone()
        current_version = row["ver"] if row and row["ver"] is not None else 0

        for version in sorted(MIGRATIONS.keys()):
            if version > current_version:
                try:
                    for sql in MIGRATIONS[version]:
                        cursor.execute(sql)
                    cursor.execute(
                        "INSERT INTO schema_version (version) VALUES (%s)",
                        (version,),
                    )
                    conn.commit()
                    print(f"Migration {version} applied.")
                except Exception:
                    conn.rollback()
                    raise
