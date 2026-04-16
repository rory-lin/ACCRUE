const CATEGORY_ICONS: Record<string, string> = {
  // 消费购物
  '消费购物': '🛍️', '网购': '📦', '线下购物': '🏬', '日用百货': '🧴', '服装鞋帽': '👗', '美妆护肤': '💄', '数码电器': '📱', '母婴用品': '🧸',
  // 食品饮食
  '食品饮食': '🍜', '早午晚餐': '🍽️', '水果零食': '🍎', '饮料饮品': '🧋', '早餐': '🥣', '午餐': '🍱', '晚餐': '🍲', '外卖': '🥡', '咖啡奶茶': '☕', '甜品蛋糕': '🍰',
  // 休闲娱乐
  '休闲娱乐': '🎮', '影音娱乐': '🎬', '游戏': '🕹️', '旅游出行': '✈️', '运动健身': '🏃', '演唱会': '🎤', '电影': '🎥', '追星': '🌟',
  // 交通出行
  '交通出行': '🚗', '公共交通': '🚇', '打车租车': '🚕', '自驾加油': '⛽', '停车费': '🅿️', '地铁公交': '🚌', '火车高铁': '🚄', '飞机': '✈️',
  // 居住生活
  '居住生活': '🏠', '房租物业': '🔑', '水电燃气': '💡', '通讯话费': '📞', '日用品': '🧴', '快递物流': '📦',
  // 医疗健康
  '医疗健康': '💊', '门诊就医': '🏥', '药品保健': '💊', '体检': '🩺', '牙科': '🦷', '中医': '🌿',
  // 教育学习
  '教育学习': '📚', '课程培训': '🎓', '书籍文具': '📖', '学费': '🎓', '辅导班': '📝', '文具': '✏️',
  // 人情往来
  '人情往来': '🎁', '红包礼金': '🧧', '请客吃饭': '🍻', '礼物': '🎀', '结婚': '💒', '满月': '🎉',
  // 金融保险
  '金融保险': '🏦', '保险': '🛡️', '利息手续费': '💸', '投资亏损': '📉', '还款': '💳',
  // 美容美发
  '美容美发': '💇', '理发': '💇', '美容': '💆', '美甲': '💅', '化妆': '💄',
  // 宠物
  '宠物': '🐾', '宠物食品': '🦴', '宠物医疗': '🏥', '宠物用品': '🐕',
  // 其他支出
  '其他支出': '📌', '其他': '📌', '未知': '❓',
  // 收入
  '工资薪酬': '💰', '兼职外快': '💼', '投资理财': '📈', '理财收入': '📊', '补贴补助': '💵', '奖金': '🏆', '其他收入': '💵', '报销': '🧾',
};

// Export so CategoryManagePage can build emoji picker
export { CATEGORY_ICONS };

interface CategoryIconProps {
  name: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryIcon({ name, icon, size = 'md' }: CategoryIconProps) {
  const isUrl = icon?.startsWith('/') || icon?.startsWith('http') || icon?.startsWith('data:');
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' };

  if (isUrl) {
    return (
      <img
        src={icon}
        alt={name}
        className={`object-cover rounded ${sizeClasses[size]}`}
      />
    );
  }

  const emoji = icon || CATEGORY_ICONS[name] || '📁';
  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
  return <span className={textSizes[size]}>{emoji}</span>;
}
