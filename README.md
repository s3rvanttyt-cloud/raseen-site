# رصين: موقع نادي الأبحاث الطبية، جامعة نجران

موقع ثابت (HTML/CSS/JS بلا خطوة بناء) مع قاعدة بيانات Supabase.

## الصفحات
- `#/` الرئيسية · `#/events` الإعلانات · `#/archive` الفعاليات الماضية
- `#/team` الهيكل الإداري والأعضاء · `#/circles` الحلقات البحثية · `#/suggest` الاقتراحات
- `admin.html` لوحة الإدارة (بريد وكلمة مرور)

## النشر على Cloudflare Pages
Workers & Pages ← Create ← Pages ← Connect to Git ← اختر هذا المستودع.
Framework preset: None · Build command: (فارغ) · Build output directory: `/`

## الاستدامة
`.github/workflows/keepalive.yml` يقرأ من قاعدة البيانات مرتين أسبوعياً حتى لا يوقف Supabase المشروع المجاني.

## تغيير الشعار
استبدل `assets/logo.svg` بشعار النادي (أو ضع `logo.png` وعدّل المسار في `index.html` و`admin.html`).

## إضافة مسؤول جديد
1. Supabase ← Authentication ← Add user (بريد وكلمة مرور).
2. SQL Editor: `insert into public.admins values ('email@example.com');`
