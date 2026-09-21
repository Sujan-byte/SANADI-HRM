# configurations/choices_config.py

# 🔢 Number format dropdowns
NUMBER_FORMAT_CHOICES = [
    ('1.2-2', '1.2-2 (Exactly 2 decimals)'),
    ('1.3-3', '1.3-3 (Exactly 3 decimals)'),
    ('1.4-4', '1.4-4 (Exactly 4 decimals)'),
    ('1.5-5', '1.5-5 (Exactly 5 decimals)'),
    ('1.6-6', '1.6-6 (Exactly 6 decimals)'),
]


# 🌍 Locale dropdowns
NUMBER_LOCALE_CHOICES = [
    ('en-US', 'English - United States (en-US)'),
    ('en-GB', 'English - United Kingdom (en-GB)'),
    ('hi-IN', 'Hindi - India (hi-IN)'),
    ('fr-FR', 'French - France (fr-FR)'),
    ('de-DE', 'German - Germany (de-DE)'),
    ('ja-JP', 'Japanese - Japan (ja-JP)'),
    ('ar-SA', 'Arabic - Saudi Arabia (ar-SA)'),
    ('es-ES', 'Spanish - Spain (es-ES)'),
    ('zh-CN', 'Chinese - China (zh-CN)'),
    ('pt-BR', 'Portuguese - Brazil (pt-BR)'),
    ('ru-RU', 'Russian - Russia (ru-RU)'),
    ('ko-KR', 'Korean - South Korea (ko-KR)'),
]
INVENTORY_METHOD_CHOICES = [
    ('FIFO', 'FIFO (First In First Out)'),
    ('LIFO', 'LIFO (Last In First Out)'),
    ('WEIGHTED_AVERAGE', 'Weighted Average'),
]


# 💰 Currency dropdowns
CURRENCY_CHOICES = [
    ('USD', 'United States (USD $)'),
    ('INR', 'India (INR ₹)'),
    ('EUR', 'Eurozone (EUR €)'),
    ('GBP', 'United Kingdom (GBP £)'),
    ('JPY', 'Japan (JPY ¥)'),
    ('SAR', 'Saudi Arabia (SAR ﷼)'),
    ('AUD', 'Australia (AUD $)'),
    ('CAD', 'Canada (CAD $)'),
    ('CHF', 'Switzerland (CHF Fr)'),
    ('CNY', 'China (CNY ¥)'),
    ('HKD', 'Hong Kong (HKD $)'),
    ('SGD', 'Singapore (SGD $)'),
    ('MYR', 'Malaysia (MYR RM)'),
    ('THB', 'Thailand (THB ฿)'),
    ('PHP', 'Philippines (PHP ₱)'),
    ('PKR', 'Pakistan (PKR ₨)'),
    ('BDT', 'Bangladesh (BDT ৳)'),
    ('ILS', 'Israel (ILS ₪)'),
    ('RUB', 'Russia (RUB ₽)'),
    ('AED', 'United Arab Emirates (AED)')
]

FOREIGN_DOMESTIC_CHOICES = [
    ('FOREIGN', 'Foreign'),
    ('DOMESTIC', 'Domestic'),
]
DECIMAL_CHOICES = [
    (2, 2),
    (3, 3),
    (4, 4),
    (5, 5),
    (6, 6)
]