'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AppLanguage } from '@/lib/i18n'
import { useLanguage } from '@/components/language-provider'

type Dictionary = Record<string, string>

const TRANSLATIONS: Record<AppLanguage, Dictionary> = {
  en: {},
  am: {
    'About': 'Sile',
    'Dashboard': 'Dashibord',
    'Applications': 'Meleketoch',
    'Logout': 'Weta',
    'Profile': 'Meregaja',
    'My Profile': 'Yene Meregaja',
    'My Documents': 'Yene Senedoch',
    'Loading...': 'Yichekela...',
    'Save Profile': 'Meregaja Asebez',
    'Documents': 'Senedoch',
    'Upload Document': 'Sened Sibelachu',
    'Document Type': 'Sened Aynet',
    'File': 'File',
    'Uploading...': 'Yisibelachu...',
    'View': 'Yay',
    'Delete': 'Afig',
    'Download': 'Awerd',
    'Status': 'Huneta',
    'My Applications': 'Yene Meleketoch',
    'Available Jobs': 'Yalut Siraoch',
    'Search Jobs': 'Sira Felig',
    'Country': 'Hager',
    'Job Type': 'Sira Aynet',
    'Skill Category': 'Kifil',
    'No jobs found': 'Sira Altegenyem',
    'Clear Filters': 'Filter Atnesa',
    'View Job & Apply': 'Sira Yayina Aplai',
    'Apply': 'Aplai',
    'No Vacancies': 'Kifet yellem',
    'Confirm Profile Details': 'Meregaja Asred',
    'Cover Letter': 'Mekelakecha Dembdabie',
    'Submit Application': 'Meleket Lak',
    'Submit Job': 'Sira Lak',
    'Post a Job': 'Sira Lakat',
    'Cancel': 'Serrez',
    'Partner Applications': 'Partner Meleketoch',
    'Request Interview': 'Interview Teyek',
    'Send Request': 'Tiyakie Lak',
    'Get in Touch': 'Yagenyugn',
    'Send us a Message': 'Melikt Lakuln',
    'Send Message': 'Melikt Lak',
    'Sending...': 'Yilakal...',
    'Frequently Asked Questions': 'Betedegagami Tiyaqewoch',
    'Ask a question': 'Tiyaqe Teyik',
    'Ask Question': 'Tiyaqe Lak',
    'Foreign Agency Registration': 'Yewuchi Agency Mzgeba',
    'Submit for Approval': 'Lefekad Lak',
    'Login': 'Geba',
    'Join Hijra Today': 'Zare Hijra Litezgabu',
    'Registration': 'Mizgeba',
    'Profile Details': 'Meregaja Zrzr',
    'Agreement': 'Simment',
    'Back': 'Temeles',
    'Continue': 'Ketel',
    'Create Account': 'Acount Feter',
    'Creating Account...': 'Acount Yifeteral...',
    'Already have an account?': 'Kadmo acount aleh?',
    'Log in here': 'Ezih Geba',
    'About Hijra': 'Sile Hijra',
    'Partner Countries': 'Partner Hageroch',
    'Featured Services': 'Tewataki Agelglotoch',
    'Quick Job Search': 'Fetash Sira Felig',
    'Search': 'Felig',
    'Latest Job Listings': 'Anew Sira Zrzroch',
    'View all': 'Hulum Yay',
    'Clear Search': 'Felig Atnesa',
    'Services Offered by Hijira Agency': 'BeHijira Yetesetu Agelglotoch',
    'Description': 'Glecha',
    'Qualification Requirements': 'Yekwalifikeshin Felagot',
    'Target Countries': 'Mekr Hageroch',
    'Application Instructions': 'Meleket Meriyawoch',
  },
  ar: {
    'About': 'حول',
    'Dashboard': 'لوحة التحكم',
    'Applications': 'الطلبات',
    'Logout': 'تسجيل الخروج',
    'Profile': 'الملف الشخصي',
    'My Profile': 'ملفي الشخصي',
    'My Documents': 'مستنداتي',
    'Loading...': 'جاري التحميل...',
    'Save Profile': 'حفظ الملف الشخصي',
    'Documents': 'المستندات',
    'Upload Document': 'رفع مستند',
    'Document Type': 'نوع المستند',
    'File': 'الملف',
    'Uploading...': 'جاري الرفع...',
    'View': 'عرض',
    'Delete': 'حذف',
    'Download': 'تنزيل',
    'Status': 'الحالة',
    'My Applications': 'طلباتي',
    'Available Jobs': 'الوظائف المتاحة',
    'Search Jobs': 'بحث عن وظائف',
    'Country': 'الدولة',
    'Job Type': 'نوع الوظيفة',
    'Skill Category': 'فئة المهارة',
    'No jobs found': 'لم يتم العثور على وظائف',
    'Clear Filters': 'مسح التصفية',
    'View Job & Apply': 'عرض الوظيفة والتقديم',
    'Apply': 'تقديم',
    'No Vacancies': 'لا توجد شواغر',
    'Confirm Profile Details': 'تأكيد بيانات الملف الشخصي',
    'Cover Letter': 'خطاب التغطية',
    'Submit Application': 'إرسال الطلب',
    'Submit Job': 'إرسال الوظيفة',
    'Post a Job': 'نشر وظيفة',
    'Cancel': 'إلغاء',
    'Partner Applications': 'طلبات الشركاء',
    'Request Interview': 'طلب مقابلة',
    'Send Request': 'إرسال الطلب',
    'Get in Touch': 'تواصل معنا',
    'Send us a Message': 'أرسل لنا رسالة',
    'Send Message': 'إرسال الرسالة',
    'Sending...': 'جاري الإرسال...',
    'Frequently Asked Questions': 'الأسئلة الشائعة',
    'Ask a question': 'اطرح سؤالا',
    'Ask Question': 'إرسال السؤال',
    'Foreign Agency Registration': 'تسجيل وكالة أجنبية',
    'Submit for Approval': 'إرسال للموافقة',
    'Login': 'تسجيل الدخول',
    'Join Hijra Today': 'انضم إلى هجرة اليوم',
    'Registration': 'التسجيل',
    'Profile Details': 'تفاصيل الملف الشخصي',
    'Agreement': 'الاتفاق',
    'Back': 'رجوع',
    'Continue': 'متابعة',
    'Create Account': 'إنشاء حساب',
    'Creating Account...': 'جاري إنشاء الحساب...',
    'Already have an account?': 'لديك حساب بالفعل؟',
    'Log in here': 'سجل الدخول هنا',
    'About Hijra': 'عن هجرة',
    'Partner Countries': 'الدول الشريكة',
    'Featured Services': 'الخدمات المميزة',
    'Quick Job Search': 'بحث سريع عن وظيفة',
    'Search': 'بحث',
    'Latest Job Listings': 'أحدث الوظائف',
    'View all': 'عرض الكل',
    'Clear Search': 'مسح البحث',
    'Services Offered by Hijira Agency': 'الخدمات المقدمة من وكالة هجرة',
    'Description': 'الوصف',
    'Qualification Requirements': 'متطلبات التأهيل',
    'Target Countries': 'الدول المستهدفة',
    'Application Instructions': 'تعليمات التقديم',
  },
  or: {
    'About': 'Waaee',
    'Dashboard': 'Daashboordii',
    'Applications': 'Iyyannoowwan',
    'Logout': 'Baahi',
    'Profile': 'Profaayilii',
    'My Profile': 'Profaayilii Koo',
    'My Documents': 'Dokumantii Koo',
    'Loading...': 'Feenaa jira...',
    'Save Profile': 'Profaayilii Kuusi',
    'Documents': 'Dokumantoota',
    'Upload Document': 'Dokumantii Olkaasi',
    'Document Type': 'Gosa Dokumantii',
    'File': 'Faayilii',
    'Uploading...': 'Olkaasaa jira...',
    'View': 'Ilaali',
    'Delete': 'Haqi',
    'Download': 'Buusi',
    'Status': 'Haala',
    'My Applications': 'Iyyannoo Koo',
    'Available Jobs': 'Hojii Argamuu',
    'Search Jobs': 'Hojii Barbaadi',
    'Country': 'Biyya',
    'Job Type': 'Gosa Hojii',
    'Skill Category': 'Ramaddii Dandeettii',
    'No jobs found': 'Hojii hin argamne',
    'Clear Filters': 'Filatamoota Haqi',
    'View Job & Apply': 'Hojii Ilaali fi Iyyadhu',
    'Apply': 'Iyyadhu',
    'No Vacancies': 'Bakka duwwaa hin jiru',
    'Confirm Profile Details': 'Balina Profaayilii Mirkaneessi',
    'Cover Letter': 'Xalayaa Iyyatamaa',
    'Submit Application': 'Iyyannoo Ergi',
    'Submit Job': 'Hojii Ergi',
    'Post a Job': 'Hojii Maxxansi',
    'Cancel': 'Dhiisi',
    'Partner Applications': 'Iyyannoo Paartinaraa',
    'Request Interview': 'Gaaffii Interview',
    'Send Request': 'Gaaffii Ergi',
    'Get in Touch': 'Nu Qunnamaa',
    'Send us a Message': 'Ergaa Nuuf Ergi',
    'Send Message': 'Ergaa Ergi',
    'Sending...': 'Ergaa jira...',
    'Frequently Asked Questions': 'Gaaffilee Yeroo Baayyee Gaafataman',
    'Ask a question': 'Gaaffii Gaafadhu',
    'Ask Question': 'Gaaffii Ergi',
    'Foreign Agency Registration': 'Galmee Ejensii Alaa',
    'Submit for Approval': 'Hayyamaaf Ergi',
    'Login': 'Seeni',
    'Join Hijra Today': 'Harra Hijratti Makami',
    'Registration': 'Galmee',
    'Profile Details': 'Balina Profaayilii',
    'Agreement': 'Waliigaltee',
    'Back': 'Duubatti',
    'Continue': 'Itti Fufi',
    'Create Account': 'Akoontii Uumi',
    'Creating Account...': 'Akoontii Uumamaa Jira...',
    'Already have an account?': 'Akoontii Qabdaa?',
    'Log in here': 'Asitti Seeni',
    'About Hijra': 'Waaee Hijra',
    'Partner Countries': 'Biyyoota Paartinaraa',
    'Featured Services': 'Tajaajiloota Filatamoo',
    'Quick Job Search': 'Barbaacha Hojii Ariifataa',
    'Search': 'Barbaadi',
    'Latest Job Listings': 'Tarree Hojii Haaraa',
    'View all': 'Hundaa Ilaali',
    'Clear Search': 'Barbaacha Haqi',
    'Services Offered by Hijira Agency': 'Tajaajiloota Ejensii Hijira',
    'Description': 'Ibsa',
    'Qualification Requirements': 'Ulaagaalee Dandeettii',
    'Target Countries': 'Biyyoota Kaayyoo',
    'Application Instructions': 'Qajeelfama Iyyannoo',
  },
}

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'])

function translateText(original: string, dictionary: Dictionary): string {
  const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/)
  if (!match) return original
  const leading = match[1]
  const core = match[2]
  const trailing = match[3]
  if (!core) return original
  const translated = dictionary[core] ?? core
  return `${leading}${translated}${trailing}`
}

export default function GlobalAutoTranslator() {
  const { language } = useLanguage()
  const dictionary = useMemo(() => TRANSLATIONS[language] ?? {}, [language])
  const textNodeSourceRef = useRef<WeakMap<Text, string>>(new WeakMap())

  useEffect(() => {
    const applyTranslations = () => {
      const root = document.body
      if (!root) return

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const textNodes: Text[] = []
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text)
      }

      for (const node of textNodes) {
        const parentElement = node.parentElement
        if (!parentElement) continue
        if (IGNORED_TAGS.has(parentElement.tagName)) continue
        if (parentElement.closest('[data-no-auto-i18n="true"]')) continue

        const currentValue = node.nodeValue ?? ''
        const original = textNodeSourceRef.current.get(node) ?? currentValue

        // In English mode, preserve live React text updates (counts, async values)
        // and refresh the source text used for later translations.
        if (language === 'en') {
          textNodeSourceRef.current.set(node, currentValue)
          continue
        }

        if (!textNodeSourceRef.current.has(node)) {
          textNodeSourceRef.current.set(node, original)
        }

        node.nodeValue = translateText(original, dictionary)
      }

      const attributeTargets = document.querySelectorAll('input[placeholder], textarea[placeholder], [title], [aria-label]')
      for (const element of attributeTargets) {
        const attrs = ['placeholder', 'title', 'aria-label']
        for (const attr of attrs) {
          const current = element.getAttribute(attr)
          if (!current) continue
          const originalAttrKey = `data-auto-i18n-original-${attr}`
          const storedOriginal = element.getAttribute(originalAttrKey)

          if (language === 'en') {
            // Keep dynamic placeholders/labels as rendered and update translation source.
            element.setAttribute(originalAttrKey, current)
            continue
          }

          const original = storedOriginal ?? current
          if (!storedOriginal) {
            element.setAttribute(originalAttrKey, original)
          }
          const translated = dictionary[original] ?? original
          element.setAttribute(attr, translated)
        }
      }
    }

    let raf = 0
    const scheduleApply = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(applyTranslations)
    }

    scheduleApply()

    const observer = new MutationObserver(() => scheduleApply())
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false,
    })

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [language, dictionary])

  return null
}
