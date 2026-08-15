export type Language = 'ar' | 'fr';

export const translations = {
  ar: {
    appTitle: 'نظام إدارة وجدولة استعمال الزمن المدرسي',
    schoolNameDefault: 'المؤسسة التعليمية',
    academicYear: 'الموسم الدراسي',
    
    // Ribbon Header Tabs & Buttons
    fileMenu: 'ملف',
    dataMenu: 'البيانات',
    timetableMenu: 'جدول الحصص',
    reportsMenu: 'التقارير والمخططات',
    viewMenu: 'العرض والطباعة',
    
    newSchedule: 'جدول جديد',
    savedProfiles: 'استعمالات مسجلة',
    saveProfile: 'حفظ النسخة الحالية',
    exportData: 'تصدير JSON',
    importData: 'استيراد JSON',
    
    subjects: 'المواد',
    teachers: 'الأساتذة',
    classes: 'الفصول',
    rooms: 'القاعات',
    lessons: 'إسناد الحصص',
    
    autoGenerate: 'توليد تلقائي',
    clearPlacements: 'تفريع الجدول',
    unplacedCards: 'الحصص غير المعينة',
    
    teacherWorkload: 'حصص الأساتذة',
    teacherMatrix: 'مخطط الأساتذة',
    classMatrix: 'بنية الأقسام',
    
    printPreview: 'طباعة ومعاينة',
    fullscreen: 'ملء الشاشة',
    exitFullscreen: 'تصغير',
    languageToggle: 'اللغة / Langue',
    
    // Matrix Views
    viewByClass: 'عرض حسب الفصول',
    viewByTeacher: 'عرض حسب الأساتذة',
    viewByRoom: 'عرض حسب القاعات',
    
    // Common Table & Modal Terms
    day: 'اليوم',
    period: 'الحصة',
    subject: 'المادة',
    teacher: 'الأستاذ',
    classGroup: 'الفصل',
    room: 'القاعة',
    totalHours: 'مجموع الساعات',
    actions: 'إجراءات',
    close: 'إغلاق',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    print: 'طباعة',
    logoUpload: 'شعار / لوجو المؤسسة',
    logoUploadDesc: 'قم بتحميل صورة لوجو المؤسسة لظهوره وسط رأس صفحة الطباعة',
    
    // Print Header
    kingdomMinistry: 'المملكة المغربية - وزارة التربية الوطنية والتعليم الأولية والرياضة',
    weeklyTimetableTitle: 'جدول الحصص الأسبوعي - استعمال الزمن',
    headmasterSignature: 'توقيع السيد مدير المؤسسة:',
    inspectorSignature: 'توقيع وتأشير المفتش التربوي:',
    
    // Unplaced Tray
    unplacedTitle: 'شريط الحصص غير المعينة (قيد الانتظار)',
    remaining: 'متبقي',
    autoPlace: 'تسكين تلقائي',
    collapse: 'طي الشريط',
    expand: 'توسيع الشريط',
    moveTop: 'نقل للأعلى',
    moveBottom: 'نقل للأسفل',
    
    // Saved Profiles Modal
    savedProfilesTitle: 'إدارة وحفظ استعمالات الزمن المدرسية',
    profileName: 'اسم استعمال الزمن / النسخة',
    lastUpdated: 'تاريخ التحديث',
    loadProfile: 'فتح وتحميل',
    duplicateProfile: 'نسخ لمسودة جديدة',
    saveCurrentAsNew: 'حفظ الاستعمال الحالي كنسخة جديدة',
  },
  fr: {
    appTitle: "Système de Gestion de l'Emploi du Temps Scolaire",
    schoolNameDefault: 'Établissement Scolaire',
    academicYear: 'Année Scolaire',
    
    // Ribbon Header Tabs & Buttons
    fileMenu: 'Fichier',
    dataMenu: 'Données',
    timetableMenu: 'Emploi du Temps',
    reportsMenu: 'Rapports & Matrices',
    viewMenu: 'Affichage & Impression',
    
    newSchedule: 'Nouveau',
    savedProfiles: 'Versions Enregistrées',
    saveProfile: 'Enregistrer Version',
    exportData: 'Exporter JSON',
    importData: 'Importer JSON',
    
    subjects: 'Matières',
    teachers: 'Enseignants',
    classes: 'Classes',
    rooms: 'Salles',
    lessons: 'Affectations',
    
    autoGenerate: 'Génération Auto',
    clearPlacements: 'Vider la Grille',
    unplacedCards: 'Séances Non Placées',
    
    teacherWorkload: 'Heures Enseignants',
    teacherMatrix: 'Matrice Enseignants',
    classMatrix: 'Structure Classes',
    
    printPreview: 'Aperçu & Impression',
    fullscreen: 'Plein Écran',
    exitFullscreen: 'Quitter Plein Écran',
    languageToggle: 'Langue / اللغة',
    
    // Matrix Views
    viewByClass: 'Par Classes',
    viewByTeacher: 'Par Enseignants',
    viewByRoom: 'Par Salles',
    
    // Common Table & Modal Terms
    day: 'Jour',
    period: 'Séance',
    subject: 'Matière',
    teacher: 'Enseignant',
    classGroup: 'Classe',
    room: 'Salle',
    totalHours: 'Total Heures',
    actions: 'Actions',
    close: 'Fermer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    print: 'Imprimer',
    logoUpload: 'Logo de l\'Établissement',
    logoUploadDesc: 'Téléchargez l\'image du logo de votre établissement pour l\'en-tête d\'impression.',
    
    // Print Header
    kingdomMinistry: 'Royaume du Maroc - Ministère de l\'Éducation Nationale',
    weeklyTimetableTitle: 'Emploi du Temps Hebdomadaire',
    headmasterSignature: 'Signature du Chef d\'Établissement:',
    inspectorSignature: 'Signature de l\'Inspecteur Pédagogique:',
    
    // Unplaced Tray
    unplacedTitle: 'Séances en attente de placement',
    remaining: 'restantes',
    autoPlace: 'Placement Auto',
    collapse: 'Réduire',
    expand: 'Développer',
    moveTop: 'Déplacer en Haut',
    moveBottom: 'Déplacer en Bas',
    
    // Saved Profiles Modal
    savedProfilesTitle: 'Gestion des Versions d\'Emplois du Temps',
    profileName: 'Nom de la version / Profil',
    lastUpdated: 'Dernière mise à jour',
    loadProfile: 'Charger cette version',
    duplicateProfile: 'Dupliquer en brouillon',
    saveCurrentAsNew: 'Enregistrer la version actuelle sous un nouveau nom',
  },
};
