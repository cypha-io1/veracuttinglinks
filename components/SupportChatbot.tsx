'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type TrackedOrderItem = {
  id: number;
  productName: string;
  quantity: number;
  lineTotal: number;
};

type TrackedOrder = {
  orderNumber: string;
  status: string;
  customerName: string;
  total: number;
  paymentCompleted: boolean;
  createdAt: string;
  items: TrackedOrderItem[];
};

type MessageOption = {
  label: string;
  action: string;
};

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  options?: MessageOption[];
  formType?: 'track' | 'stylist';
  trackingData?: TrackedOrder;
  trackingError?: string;
};
import { SOCIALS } from './socials';
import { FaInstagram, FaSnapchat, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import { FiMail } from 'react-icons/fi';

export default function SupportChatbot() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/admin') ||
                      pathname.startsWith('/dashboard') ||
                      pathname.startsWith('/manager') ||
                      pathname.startsWith('/kitchen');

  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // View States
  type ViewState = 'options' | 'contacts' | 'ticket' | 'chat';
  const [view, setView] = useState<ViewState>('options');

  // Forms states
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  // Ticket styling states (adapted to stylist request form)
  const [ticketName, setTicketName] = useState('');
  const [stylistMsg, setStylistMsg] = useState('');
  const [stylistContact, setStylistContact] = useState('');
  const [stylistLoading, setStylistLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const INITIAL_OPTIONS = [
    { label: '💎 Explore Collections', action: 'explore' },
    { label: '🚚 Track My Order', action: 'track_form' },
    { label: '✨ Jewelry Sizing & Care', action: 'sizing_care' },
    { label: '💬 Talk to a Stylist', action: 'stylist_form' },
  ];

  // Initialize welcome messages
  useEffect(() => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: 'Greetings! I am Aria, your Zhilakaii Celestial Assistant. ✨',
        timestamp: new Date(),
      },
      {
        id: 'welcome-2',
        sender: 'bot',
        text: 'Inspired by the celestial heavens, I am here to guide your search for exquisite luxury jewelry. How can I add a sparkling touch to your journey today?',
        timestamp: new Date(),
        options: INITIAL_OPTIONS,
      },
    ]);
    
    // Play subtle notification alert if not open
    const timer = setTimeout(() => {
      setUnread(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset view state when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView('options');
        setTicketSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, view]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setUnread(false);
  };

  const addBotMessage = (text: string, delay = 1000, options?: Message['options'], extra?: Partial<Message>) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}-${Math.random()}`,
          sender: 'bot',
          text,
          timestamp: new Date(),
          options,
          ...extra,
        },
      ]);
    }, delay);
  };

  const handleAction = (action: string) => {
    // Add user option selection to chat
    let label = '';
    if (action === 'explore') label = '💎 Explore Fine Collections';
    else if (action === 'track_form') label = '🚚 Track My Order';
    else if (action === 'sizing_care') label = '✨ Jewelry Sizing & Care';
    else if (action === 'stylist_form') label = '💬 Talk to a Stylist';
    else if (action === 'reset_menu') label = '🔙 Back to Main Options';

    if (label) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: label,
          timestamp: new Date(),
        },
      ]);
    }

    if (action === 'explore') {
      addBotMessage(
        'Our handcrafted collections embody celestial elegance and radiant beauty. Explore our featured pieces:\n\n🌌 **Celestial Rings**: Timeless gold bands dotted with sparkling starlight diamonds.\n🌌 **Sparkling Necklaces**: Celestial chains designed to rest elegantly like stardust.\n🌌 **Starry Earrings**: Radiant studs that capture cosmic glimmers.',
        1200,
        [
          { label: '💍 Browse Rings', action: 'link_rings' },
          { label: '📿 View Necklaces', action: 'link_necklaces' },
          { label: '🔙 Main Options', action: 'reset_menu' },
        ]
      );
    } else if (action === 'link_rings') {
      window.location.href = '/menu?category=rings';
    } else if (action === 'link_necklaces') {
      window.location.href = '/menu?category=necklaces';
    } else if (action === 'track_form') {
      addBotMessage(
        'I can trace your package across the sky. Please enter your Order Number and phone number below to check its coordinates:',
        1000,
        undefined,
        { formType: 'track' }
      );
    } else if (action === 'sizing_care') {
      addBotMessage(
        'Zhilakaii pieces are crafted with premium materials to sparkle like the stars. Here are some care recommendations:\n\n✨ **Diamond Care**: Gently clean with warm water and mild soap using a soft brush.\n✨ **Ring Sizing**: Use a flexible sizing tape or visit a local jeweler. Ring sizes vary by finger and climate.\n✨ **Plating Protection**: Avoid wearing fine jewelry in chlorine pools or when applying lotions/perfumes.',
        1200,
        INITIAL_OPTIONS
      );
    } else if (action === 'stylist_form') {
      addBotMessage(
        'Our concierge stylists are available to provide custom design advisory and personal styling assistance. Leave a message for our desk below:',
        1000,
        undefined,
        { formType: 'stylist' }
      );
    } else if (action === 'reset_menu') {
      addBotMessage(
        'What other celestial coordinates may I pull up for you today?',
        800,
        INITIAL_OPTIONS
      );
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userText,
        timestamp: new Date(),
      },
    ]);

    const lower = userText.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      addBotMessage(
        'Hello there! I am Aria, always delighted to assist you. How can I help you sparkle today?',
        800,
        INITIAL_OPTIONS
      );
    } else if (lower.includes('track') || lower.includes('order') || lower.includes('status')) {
      addBotMessage(
        'Let me trace your coordinates. Please enter your Order Number and phone number in this form:',
        900,
        undefined,
        { formType: 'track' }
      );
    } else if (lower.includes('ring') || lower.includes('size') || lower.includes('care')) {
      handleAction('sizing_care');
    } else if (lower.includes('ship') || lower.includes('delivery') || lower.includes('time')) {
      addBotMessage(
        '🌌 **Celestial Priority Delivery**:\n\nWe hand-deliver our precious jewelry within **30-45 minutes** in local hubs. All packages are insured and fully secured to protect their pristine shine.\n\nWould you like to track an existing shipment?',
        1100,
        [
          { label: '🚚 Track Order', action: 'track_form' },
          { label: '🔙 Main Options', action: 'reset_menu' },
        ]
      );
    } else if (lower.includes('return') || lower.includes('refund') || lower.includes('warranty')) {
      addBotMessage(
        '💎 **Zhilakaii Guarantee**:\n\nWe offer a premium 14-day warranty on all handcrafted pieces. If the sparkle is not exactly as you envisioned, we provide custom adjustments or seamless returns on unworn items.\n\nPlease contact our concierge team or leave a message to initialize a request.',
        1200,
        [
          { label: '💬 Message Stylist', action: 'stylist_form' },
          { label: '🔙 Main Options', action: 'reset_menu' },
        ]
      );
    } else {
      addBotMessage(
        'I appreciate your message. I am Aria, a celestial virtual concierge. For detailed or highly specific custom crafting requests, speaking directly to our fine stylists is best.',
        1000,
        [
          { label: '💬 Talk to a Stylist', action: 'stylist_form' },
          { label: '🔙 Main Options', action: 'reset_menu' },
        ]
      );
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderNumber.trim() || !trackPhone.trim()) return;

    try {
      setTrackLoading(true);
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(
          trackOrderNumber.trim().toUpperCase()
        )}&phone=${encodeURIComponent(trackPhone.trim())}`,
        { cache: 'no-store' }
      );
      const payload = (await res.json().catch(() => ({}))) as TrackedOrder & { error?: string };

      if (!res.ok) {
        throw new Error(payload.error || 'Coordinates not found. Check digits.');
      }

      // Add success response
      setMessages((prev) => [
        ...prev,
        {
          id: `track-success-${Date.now()}`,
          sender: 'bot',
          text: `🌌 **Order Traced successfully!** Here are your real-time coordinates:`,
          timestamp: new Date(),
          trackingData: payload,
          options: INITIAL_OPTIONS,
        },
      ]);

      // Reset form states
      setTrackOrderNumber('');
      setTrackPhone('');
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `track-fail-${Date.now()}`,
          sender: 'bot',
          text: `❌ **Tracking Coordinates Error**:`,
          timestamp: new Date(),
          trackingError: err instanceof Error ? err.message : 'Order not found.',
          options: [
            { label: '🔄 Try Again', action: 'track_form' },
            { label: '🔙 Main Options', action: 'reset_menu' },
          ],
        },
      ]);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleStylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError(null);
    if (!ticketName.trim() || !stylistMsg.trim() || !stylistContact.trim()) {
      setTicketError('Please complete all fields');
      return;
    }

    const phoneDigits = stylistContact.replace(/\D/g, '');
    if (!/^0\d{9}$/.test(phoneDigits)) {
      setTicketError('Phone number must start with 0 and be 10 digits');
      return;
    }

    try {
      setStylistLoading(true);
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ticketName.trim(), contact: phoneDigits, message: stylistMsg.trim() }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || payload?.details || 'Failed to submit');
      }

      setTicketSuccess(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `stylist-success-${Date.now()}`,
          sender: 'bot',
          text: `🌌 **Concierge Stylist Request Dispatched!**\n\nThank you ${ticketName}. A custom jewelry advisor has received your request and will reach out via **${phoneDigits}** shortly. (ref: ${payload?.data?.id ?? 'n/a'}) ✨`,
          timestamp: new Date(),
          options: INITIAL_OPTIONS,
        },
      ]);

      // Clear form
      setTicketName('');
      setStylistMsg('');
      setStylistContact('');
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : String(err));
    } finally {
      setStylistLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Paid':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'In Progress':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  if (isDashboard) return null;

  return (
    <div className="fixed bottom-[100px] left-4 md:bottom-8 md:left-8 z-50 font-sans flex flex-col items-start gap-4">
      {/* Support Panel */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-200/50 mb-4 w-[320px] sm:w-[360px] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-400 ease-out flex flex-col"
          style={{
            boxShadow: '0 10px 50px -10px rgba(139, 92, 26, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Header section with gradient */}
          <div className="relative bg-gradient-to-b from-blue-50/80 to-transparent px-6 py-5 border-b border-gray-100/50 shrink-0">
            <div className="flex items-center gap-3">
              {view !== 'options' && (
                <button 
                  onClick={() => setView('options')} 
                  className="p-1.5 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                  {view === 'options' ? 'How can we help?' : 
                   view === 'contacts' ? 'Socials & Contacts' : 
                   view === 'ticket' ? 'Email Us' : 
                   'AI Chat'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 tracking-wide">
                    {view === 'chat' ? 'Aria is online' : 'We reply instantly'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200" ref={chatScrollRef}>
            {view === 'options' && (
              <div className="space-y-1.5">
                <button
                  onClick={() => setView('contacts')}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-300 group text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 group-hover:scale-110 group-hover:bg-green-100 transition-all duration-300">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      Socials & Contacts
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 mt-0.5">
                      Connect with us on socials or WhatsApp
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-green-600 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setView('ticket')}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-300 group text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      Email Us
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 mt-0.5">
                      Send us an email
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  disabled
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl opacity-50 cursor-not-allowed border border-transparent transition-all duration-300 text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 transition-all duration-300">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2v-5a3 3 0 00-3-3H7a3 3 0 00-3 3v5a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-gray-900 transition-colors">
                      AI Chat
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 mt-0.5">
                      Coming soon
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {view === 'contacts' && (
              <div className="space-y-2">
                {SOCIALS.map((social, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      window.open(social.link, '_blank');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-300 group text-left"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200/50 group-hover:scale-110 transition-transform duration-300">
                        {social.name === 'Snapchat' ? (
                          <FaSnapchat className="w-5 h-5 text-slate-500" />
                        ) : social.name === 'TikTok' ? (
                          <FaTiktok className="w-5 h-5 text-slate-500" />
                        ) : social.name === 'Instagram' ? (
                          <FaInstagram className="w-5 h-5 text-slate-500" />
                        ) : social.name === 'WhatsApp' ? (
                          <FaWhatsapp className="w-5 h-5 text-slate-500" />
                        ) : social.name === 'Email' ? (
                          <FiMail className="w-5 h-5 text-slate-500" />
                        ) : (
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8zm4 4a4 4 0 108 0 4 4 0 00-8 0zm6-3h.01" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[14px] font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                        {social.name}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 leading-snug line-clamp-2 mt-0.5">
                        {social.helpWith}
                      </span>
                    </div>

                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {view === 'ticket' && (
              <div className="p-1 h-full">
                {ticketSuccess ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-gray-900 font-bold text-sm">Email Sent!</h4>
                    <p className="text-xs text-gray-500">Our team has received your email and will connect with you shortly.</p>
                    <button 
                      onClick={() => setTicketSuccess(false)}
                      className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Send another email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleStylistSubmit} className="space-y-3 pb-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone</label>
                      <input 
                        type="tel" 
                        required
                        value={stylistContact}
                        onChange={(e) => setStylistContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Phone (e.g. 0XXXXXXXXX)"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 shadow-inner"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Enter a 10-digit phone starting with 0.</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Message</label>
                      <textarea 
                        required
                        value={stylistMsg}
                        onChange={(e) => setStylistMsg(e.target.value)}
                        placeholder="How may we assist you?"
                        rows={3}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 shadow-inner resize-none"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={stylistLoading}
                      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2 rounded-lg text-xs tracking-wider uppercase transition-colors disabled:opacity-50 mt-2"
                    >
                      {stylistLoading ? 'Dispatching Message...' : 'Submit to Concierge'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {view === 'chat' && (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white font-semibold rounded-tr-none shadow-sm'
                          : 'bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-200/40 shadow-inner'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>

                      {/* Inline Forms */}
                      {msg.formType === 'track' && (
                        <form onSubmit={handleTrackSubmit} className="mt-3 space-y-2 border-t border-slate-200/60 pt-3">
                          <input
                            type="text"
                            placeholder="Order Number (e.g. TMP-123456)"
                            value={trackOrderNumber}
                            onChange={(e) => setTrackOrderNumber(e.target.value.toUpperCase())}
                            required
                            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-amber-500 placeholder-slate-400 shadow-inner"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number (e.g. 0XXXXXXXXX)"
                            value={trackPhone}
                            onChange={(e) => setTrackPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required
                            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-amber-500 placeholder-slate-400 shadow-inner"
                          />
                          <button
                            type="submit"
                            disabled={trackLoading}
                            className="w-full rounded-xl bg-amber-500 py-1.5 text-[11px] font-black text-slate-950 transition-all hover:bg-amber-400 shadow-sm"
                          >
                            {trackLoading ? 'Searching Coordinates...' : 'Track Package'}
                          </button>
                        </form>
                      )}

                      {msg.formType === 'stylist' && (
                        <form onSubmit={handleStylistSubmit} className="mt-3 space-y-2 border-t border-slate-200/60 pt-3">
                          <input 
                            type="text"
                            placeholder="Your Name"
                            value={ticketName}
                            onChange={(e) => setTicketName(e.target.value)}
                            required
                            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-amber-500 placeholder-slate-400 shadow-inner mb-2"
                          />
                          <textarea
                            placeholder="How may our designers assist? (e.g., custom diamond sizing, gift wrapping...)"
                            value={stylistMsg}
                            onChange={(e) => setStylistMsg(e.target.value)}
                            required
                            rows={2}
                            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-amber-500 placeholder-slate-400 shadow-inner resize-none"
                          />
                          <input
                            type="tel"
                            placeholder="Phone (e.g. 0XXXXXXXXX)"
                            value={stylistContact}
                            onChange={(e) => setStylistContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required
                            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-amber-500 placeholder-slate-400 shadow-inner mt-2"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Phone must be 10 digits and start with 0.</p>
                          <button
                            type="submit"
                            disabled={stylistLoading}
                            className="w-full rounded-xl bg-amber-500 py-1.5 text-[11px] font-black text-slate-950 transition-all hover:bg-amber-400 shadow-sm mt-2"
                          >
                            {stylistLoading ? 'Dispatching Message...' : 'Submit to Concierge'}
                          </button>
                        </form>
                      )}

                      {/* Order Tracking Data Card */}
                      {msg.trackingData && (
                        <div className="mt-3 space-y-2 rounded-xl bg-white border border-slate-200 p-3 text-[11px] shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-mono text-[10px] text-amber-600 font-bold">{msg.trackingData.orderNumber}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${getStatusBadge(msg.trackingData.status)}`}>
                              {msg.trackingData.status}
                            </span>
                          </div>
                          <div className="space-y-1.5 py-1 text-slate-600">
                            <p>👤 <span className="font-semibold text-slate-800">{msg.trackingData.customerName}</span></p>
                            <p>📅 <span>{new Date(msg.trackingData.createdAt).toLocaleDateString()}</span></p>
                            <p>💳 <span>Payment: {msg.trackingData.paymentCompleted ? '✅ Confirmed' : '❌ Unpaid'}</span></p>
                          </div>
                          <div className="border-t border-slate-100 pt-2">
                            <p className="font-bold text-amber-700 mb-1">Items:</p>
                            <div className="space-y-1">
                              {msg.trackingData.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-slate-500">
                                  <span>{item.productName} (x{item.quantity})</span>
                                  <span className="text-slate-800 font-medium">₵{Number(item.lineTotal).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-800 text-xs">
                            <span>Total</span>
                            <span className="text-amber-600">GH₵{Number(msg.trackingData.total).toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Tracking Error */}
                      {msg.trackingError && (
                        <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-[10px] text-rose-700 font-medium">
                          {msg.trackingError}
                        </div>
                      )}
                    </div>

                    {/* Bot Options Buttons */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                        {msg.options.map((opt) => (
                          <button
                            key={opt.action}
                            onClick={() => handleAction(opt.action)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-800 hover:border-amber-500/40 hover:bg-amber-500/10 shadow-sm active:scale-95 transition-all"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex flex-col items-start">
                    <div className="rounded-[1.5rem] rounded-tl-none bg-slate-100 border border-slate-200/50 px-4 py-3 shadow-inner">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input Area (Only visible in chat view) */}
          {view === 'chat' && (
            <div className="border-t border-slate-100 p-3 shrink-0 bg-white">
              <form onSubmit={handleSendText} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
                />
                <button 
                  type="submit" 
                  disabled={!inputValue.trim()}
                  className="bg-slate-900 hover:bg-black disabled:bg-gray-300 text-white rounded-full p-2 transition-colors flex shrink-0 active:scale-90"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          )}

          {/* Footer (Hidden in chat view to save space) */}
          {view !== 'chat' && (
            <div className="bg-gray-50/80 border-t border-gray-100 p-3 flex justify-center shrink-0">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Powered by Zhilakaii
              </span>
            </div>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={toggleChat}
        className={`relative flex items-center justify-center h-10 md:h-11 rounded-full shadow-[0_8px_20px_rgb(0,0,0,0.12)] border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 bg-[#011B33] text-white ${
          isOpen ? 'w-10 md:w-11' : 'px-3.5 md:px-4'
        }`}
        aria-label="Toggle Support"
      >
        <div className="relative z-10 flex items-center justify-center gap-1.5">
          {isOpen ? (
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <div className="flex items-center justify-center bg-white/20 rounded-full w-4 h-4 md:w-5 md:h-5 text-white font-serif text-[10px] md:text-[12px] font-bold">
                ?
              </div>
              <span className="text-white font-medium text-[12px] md:text-[13px] tracking-wide pr-1">Support</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
