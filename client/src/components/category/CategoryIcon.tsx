const CATEGORY_ICONS: Record<string, string> = {
  '消费购物': '🛍️', '网购': '📦', '线下购物': '🏬',
  '食品饮食': '🍜', '早午晚餐': '🍽️', '水果零食': '🍎', '饮料饮品': '🧋',
  '休闲娱乐': '🎮', '影音娱乐': '🎬', '游戏': '🕹️', '旅游出行': '✈️',
  '交通出行': '🚗', '公共交通': '🚇', '打车租车': '🚕',
  '居住生活': '🏠', '房租物业': '🔑', '水电燃气': '💡',
  '医疗健康': '💊', '门诊就医': '🏥', '药品保健': '💊',
  '教育学习': '📚', '课程培训': '🎓', '书籍文具': '📖',
  '人情往来': '🎁', '红包礼金': '🧧', '请客吃饭': '🍻',
  '金融保险': '🏦', '保险': '🛡️', '利息手续费': '💸',
  '其他支出': '📌',
  '工资薪酬': '💰', '兼职外快': '💼', '投资理财': '📈',
  '补贴补助': '🧧', '奖金': '🏆', '其他收入': '💵',
};

interface CategoryIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryIcon({ name, size = 'md' }: CategoryIconProps) {
  const emoji = CATEGORY_ICONS[name] || '📁';
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
  return <span className={sizeClasses[size]}>{emoji}</span>;
}
