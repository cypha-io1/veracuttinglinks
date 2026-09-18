export type Social = {
  name: string;
  link: string;
  handle?: string;
  helpWith?: string;
};

export const SOCIALS: Social[] = [
  {
    name: 'Snapchat',
    link: 'https://snapchat.com/t/ZUch8xYy',
    handle: 'ZUch8xYy',
    helpWith: 'Snap quick product updates and behind-the-scenes',
  },
  {
    name: 'TikTok',
    link: 'https://www.tiktok.com/@.zhilakaii',
    handle: '@zhilakaii',
    helpWith: 'Watch our jewelry styling tips and behind-the-scenes',
  },
  {
    name: 'Instagram',
    link: 'https://www.instagram.com/zhilakaii_?igsh=MXhnZHNhNGw0N3FwYg%3D%3D&utm_source=qr',
    handle: '@zhilakaii_',
    helpWith: 'Follow us for the latest collections and inspiration',
  },
  {
    name: 'WhatsApp',
    link: 'https://wa.me/+233206742769',
    handle: '+233 206 742 769',
    helpWith: 'Direct messaging for concierge and support',
  },
  {
    name: 'Email',
    link: 'mailto:shopzhilakaii@gmail.com',
    handle: 'shopzhilakaii@gmail.com',
    helpWith: 'Send us an email for detailed inquiries',
  },
];

export default SOCIALS;
