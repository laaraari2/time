import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TimeTables Mobile — استعمال الزمن',
    short_name: 'TimeTables',
    description: 'تطبيق الهاتف لاستعمالات الزمن المدرسية',
    start_url: '/mobile-v2',
    scope: '/mobile-v2/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#123E70',
    dir: 'rtl',
    lang: 'ar',
    orientation: 'portrait',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon', purpose: 'any' },
    ],
  };
}
