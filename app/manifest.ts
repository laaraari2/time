import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TimeTables — استعمال الزمن',
    short_name: 'TimeTables',
    description: 'إنشاء وتنظيم استعمالات الزمن المدرسية',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#20518D',
    dir: 'rtl',
    lang: 'ar',
    orientation: 'any',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
