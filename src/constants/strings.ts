export type Language = 'en' | 'ar';

export const strings = {
  versionNumber: '1.1.0',

  en: {
    // App
    appName: 'FinVista',
    tagline: 'Your Financial Future',

    // Tabs
    dashboard: 'Home',
    goals: 'Goals',
    analytics: 'Analytics',
    settings: 'Settings',

    // Dashboard
    totalSaved: 'Total Saved',
    activeGoals: 'Active Goals',
    overallProgress: 'Overall Progress',
    recentActivity: 'Recent Activity',
    noGoals: 'No goals yet',
    noGoalsDesc: 'Create your first financial goal to get started',
    createGoal: 'Create Goal',
    addGoal: 'Add Goal',

    // Goals
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    startDate: 'Start Date',
    deadline: 'Deadline',
    saved: 'Saved',
    remaining: 'Remaining',
    progress: 'Progress',
    daysLeft: 'Days Left',
    completed: 'Completed!',
    dailySavings: 'Daily Needed',
    weeklySavings: 'Weekly Needed',
    monthlySavings: 'Monthly Needed',
    addSavings: 'Add Savings',
    savingsHistory: 'Savings History',
    editGoal: 'Edit Goal',
    deleteGoal: 'Delete Goal',
    confirmDelete: 'Confirm Delete',
    confirmDeleteMsg: 'Are you sure you want to delete this goal? All savings data will be lost.',
    confirmDeleteEntry: 'Are you sure you want to delete this savings entry?',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    amount: 'Amount',
    date: 'Date',
    edit: 'Edit',
    noSavings: 'No savings entries yet',
    addFirstSaving: 'Add your first saving to track progress',

    // Analytics
    analyticsTitle: 'Analytics',
    totalGoals: 'Total Goals',
    totalEntries: 'Total Entries',
    avgSavingPerEntry: 'Avg. per Entry',
    mostProgress: 'Most Progress',
    goalBreakdown: 'Goal Breakdown',

    // Settings
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    language: 'Language',
    notifications: 'Notifications',
    remindersEnabled: 'Enable Reminders',
    reminderFrequency: 'Reminder Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    about: 'About',
    version: 'Version',

    // Validation
    required: 'This field is required',
    invalidAmount: 'Please enter a valid amount',
    invalidDate: 'Please enter a valid date',
    deadlineAfterStart: 'Deadline must be after start date',

    // Misc
    currency: 'EGP',
    of: 'of',
    day: 'day',
    days: 'days',
    noData: 'No data available',

    // Search & Filter
    searchGoals: 'Search goals...',
    filter: 'Filter',
    filterGoals: 'Filter Goals',
    sortBy: 'Sort By',
    statusFilter: 'Status',
    allGoals: 'All Goals',
    activeGoals2: 'Active',
    completedGoals2: 'Completed',
    sortNameAZ: 'Name (A → Z)',
    sortNameZA: 'Name (Z → A)',
    sortProgressHigh: 'Most Progress',
    sortProgressLow: 'Least Progress',
    sortDeadline: 'Nearest Deadline',
    sortAmountHigh: 'Highest Target',
    applyFilter: 'Apply',
    resetFilter: 'Reset',
    noResults: 'No goals match your search',
    noResultsDesc: 'Try a different search term or reset filters',
  },

  ar: {
    appName: 'FinVista',
    tagline: 'مستقبلك المالي',

    dashboard: 'الرئيسية',
    goals: 'الأهداف',
    analytics: 'التحليلات',
    settings: 'الإعدادات',

    totalSaved: 'إجمالي المدخرات',
    activeGoals: 'الأهداف النشطة',
    overallProgress: 'التقدم الكلي',
    recentActivity: 'النشاط الأخير',
    noGoals: 'لا توجد أهداف بعد',
    noGoalsDesc: 'أنشئ هدفك المالي الأول للبدء',
    createGoal: 'إنشاء هدف',
    addGoal: 'إضافة هدف',

    goalName: 'اسم الهدف',
    targetAmount: 'المبلغ المستهدف',
    startDate: 'تاريخ البداية',
    deadline: 'الموعد النهائي',
    saved: 'تم توفيره',
    remaining: 'المتبقي',
    progress: 'التقدم',
    daysLeft: 'أيام متبقية',
    completed: 'مكتمل!',
    dailySavings: 'المطلوب يومياً',
    weeklySavings: 'المطلوب أسبوعياً',
    monthlySavings: 'المطلوب شهرياً',
    addSavings: 'إضافة مدخرات',
    savingsHistory: 'سجل المدخرات',
    editGoal: 'تعديل الهدف',
    deleteGoal: 'حذف الهدف',
    confirmDelete: 'تأكيد الحذف',
    confirmDeleteMsg: 'هل أنت متأكد من حذف هذا الهدف؟ ستُفقد جميع بيانات المدخرات.',
    confirmDeleteEntry: 'هل أنت متأكد من حذف هذا الإدخال؟',
    cancel: 'إلغاء',
    delete: 'حذف',
    save: 'حفظ',
    amount: 'المبلغ',
    date: 'التاريخ',
    edit: 'تعديل',
    noSavings: 'لا توجد إدخالات مدخرات بعد',
    addFirstSaving: 'أضف أول مدخراتك لتتبع التقدم',

    analyticsTitle: 'التحليلات',
    totalGoals: 'إجمالي الأهداف',
    totalEntries: 'إجمالي الإدخالات',
    avgSavingPerEntry: 'متوسط كل إدخال',
    mostProgress: 'أكثر تقدماً',
    goalBreakdown: 'تفاصيل الأهداف',

    settingsTitle: 'الإعدادات',
    appearance: 'المظهر',
    darkMode: 'الوضع الداكن',
    language: 'اللغة',
    notifications: 'الإشعارات',
    remindersEnabled: 'تفعيل التذكيرات',
    reminderFrequency: 'تكرار التذكير',
    daily: 'يومياً',
    weekly: 'أسبوعياً',
    monthly: 'شهرياً',
    about: 'حول التطبيق',
    version: 'الإصدار',

    required: 'هذا الحقل مطلوب',
    invalidAmount: 'يرجى إدخال مبلغ صحيح',
    invalidDate: 'يرجى إدخال تاريخ صحيح',
    deadlineAfterStart: 'يجب أن يكون الموعد النهائي بعد تاريخ البداية',

    currency: 'جنيه',
    of: 'من',
    day: 'يوم',
    days: 'أيام',
    noData: 'لا توجد بيانات',

    // Search & Filter
    searchGoals: 'ابحث عن أهداف...',
    filter: 'تصفية',
    filterGoals: 'تصفية الأهداف',
    sortBy: 'ترتيب حسب',
    statusFilter: 'الحالة',
    allGoals: 'كل الأهداف',
    activeGoals2: 'نشطة',
    completedGoals2: 'مكتملة',
    sortNameAZ: 'الاسم (أ → ي)',
    sortNameZA: 'الاسم (ي → أ)',
    sortProgressHigh: 'الأعلى تقدماً',
    sortProgressLow: 'الأقل تقدماً',
    sortDeadline: 'أقرب موعد نهائي',
    sortAmountHigh: 'أعلى مبلغ مستهدف',
    applyFilter: 'تطبيق',
    resetFilter: 'إعادة تعيين',
    noResults: 'لا توجد أهداف تطابق بحثك',
    noResultsDesc: 'جرب كلمة بحث مختلفة أو أعد تعيين الفلتر',
  },
};

export interface Category {
  label: string;
  icons: string[];
}

export const CATEGORIES: Category[] = [
  {
    label: '👕 Clothes',
    icons: ['👕', '👗', '👖', '🧥', '👔', '👟', '🎒', '⌚', '🕶️', '🧢'],
  },
  {
    label: '🏠 Life',
    icons: ['🏠', '🏡', '🛋️', '🔑', '🏗️', '🏢', '🏘️', '🛏️', '🚿', '🪴'],
  },
  {
    label: '🚗 Travel',
    icons: ['🚗', '✈️', '🏖️', '⛵', '🚀', '🏕️', '🗺️', '🧳', '🚢', '🚂'],
  },
  {
    label: '💻 Tech',
    icons: ['💻', '📱', '🎮', '📷', '🎧', '⌚', '🖥️', '📺', '🎙️', '🔋'],
  },
  {
    label: '📚 Education',
    icons: ['📚', '🎓', '✏️', '🏫', '🔬', '💡', '📖', '🎨', '🖌️', '🧪'],
  },
  {
    label: '❤️ Health',
    icons: ['❤️', '💪', '🏃', '🧘', '🍎', '🏋️', '⚽', '🚴', '🧠', '🏊'],
  },
  {
    label: '💰 Finance',
    icons: ['💰', '💎', '🏦', '📈', '💳', '🪙', '💵', '🏆', '🎯', '⭐'],
  },
  {
    label: '🎉 Fun',
    icons: ['🎉', '🎂', '🎁', '🎸', '🎬', '🎭', '🎪', '🛍️', '👗', '👟'],
  },
  {
    label: '👨‍👩‍👧 Family',
    icons: ['👨‍👩‍👧', '👶', '🐶', '🐱', '💍', '💒', '🤝', '🫂', '🧸', '🌸'],
  },
];
