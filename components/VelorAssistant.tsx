'use client'

  import { useState, useRef, useEffect } from 'react'

    type ChatMessage = { role: 'user' | 'assistant'; content: string }
    type Tier = 'STARTER' | 'PRO' | 'ENTERPRISE' // ENTERPRISE = legacy alias of PRO (tier retired 2026-07-15)
    type Variant = 'buyer' | 'seller'

    // Velor's AI assistant persona image (circular, transparent background).
    const AVATAR = '/velor-assistant.png'

    // Zero-cost localisation: the opening greeting, placeholder and the
    // "write to me in your own language" hint are resolved from the visitor's
    // own browser language. No API call, no translation service. Whatever
    // language they then type in, the assistant answers in (enforced in the
    // system prompt server-side), so this dictionary only needs to cover the
    // first impression.
    const RTL_LANGS = ['ar', 'ur', 'fa', 'he']

    interface Locale { buyerGreeting: string; placeholder: string; hint: string }

    const I18N: Record<string, Locale> = {
      en: { buyerGreeting: "Hi! I'm here to help you shop with confidence — how our buyer protection works, tracking an order, returns and disputes, or finding something from our sellers around the world.", placeholder: 'Ask about buyer protection, orders, returns...', hint: '' },
      es: { buyerGreeting: '¡Hola! Estoy aquí para ayudarte a comprar con confianza: cómo funciona nuestra protección al comprador, el seguimiento de un pedido, devoluciones y disputas, o encontrar algo de nuestros vendedores de todo el mundo.', placeholder: 'Pregunta sobre protección, pedidos, devoluciones...', hint: 'Puedes escribirme en tu propio idioma.' },
      fr: { buyerGreeting: "Bonjour ! Je suis là pour vous aider à acheter en toute confiance : le fonctionnement de notre protection acheteur, le suivi d'une commande, les retours et litiges, ou trouver un article chez nos vendeurs du monde entier.", placeholder: 'Protection acheteur, commandes, retours...', hint: 'Vous pouvez m’écrire dans votre propre langue.' },
      de: { buyerGreeting: 'Hallo! Ich helfe Ihnen, mit Vertrauen einzukaufen: wie unser Käuferschutz funktioniert, Sendungsverfolgung, Rückgaben und Streitfälle, oder etwas bei unseren Verkäufern weltweit zu finden.', placeholder: 'Käuferschutz, Bestellungen, Rückgaben...', hint: 'Sie können mir in Ihrer eigenen Sprache schreiben.' },
      it: { buyerGreeting: 'Ciao! Sono qui per aiutarti ad acquistare in tutta sicurezza: come funziona la protezione acquirenti, il tracciamento di un ordine, resi e controversie, o trovare qualcosa dai nostri venditori in tutto il mondo.', placeholder: 'Protezione acquirenti, ordini, resi...', hint: 'Puoi scrivermi nella tua lingua.' },
      pt: { buyerGreeting: 'Olá! Estou aqui para te ajudar a comprar com confiança: como funciona a nossa proteção ao comprador, seguimento de encomendas, devoluções e disputas, ou encontrar algo dos nossos vendedores em todo o mundo.', placeholder: 'Proteção, encomendas, devoluções...', hint: 'Podes escrever-me no teu próprio idioma.' },
      nl: { buyerGreeting: 'Hallo! Ik help je met vertrouwen te winkelen: hoe onze kopersbescherming werkt, een bestelling volgen, retouren en geschillen, of iets vinden bij onze verkopers wereldwijd.', placeholder: 'Kopersbescherming, bestellingen, retouren...', hint: 'Je mag me in je eigen taal schrijven.' },
      pl: { buyerGreeting: 'Cześć! Pomogę Ci kupować z pewnością: jak działa ochrona kupującego, śledzenie zamówienia, zwroty i spory, albo znalezienie czegoś u naszych sprzedawców z całego świata.', placeholder: 'Ochrona kupującego, zamówienia, zwroty...', hint: 'Możesz pisać do mnie w swoim języku.' },
      tr: { buyerGreeting: 'Merhaba! Güvenle alışveriş etmenize yardımcı olmak için buradayım: alıcı korumamızın nasıl çalıştığı, sipariş takibi, iadeler ve anlaşmazlıklar veya dünyanın her yerinden satıcılarımızdan bir şey bulmak.', placeholder: 'Alıcı koruması, siparişler, iadeler...', hint: 'Bana kendi dilinizde yazabilirsiniz.' },
      ru: { buyerGreeting: 'Здравствуйте! Я помогу вам покупать с уверенностью: как работает защита покупателя, отслеживание заказа, возвраты и споры, или как найти что-то у наших продавцов по всему миру.', placeholder: 'Защита покупателя, заказы, возвраты...', hint: 'Вы можете писать мне на своём языке.' },
      ar: { buyerGreeting: 'مرحباً! أنا هنا لمساعدتك على التسوق بثقة: كيف تعمل حماية المشتري، تتبع الطلب، الإرجاع والنزاعات، أو العثور على شيء من بائعينا حول العالم.', placeholder: 'حماية المشتري، الطلبات، الإرجاع...', hint: 'يمكنك مراسلتي بلغتك الخاصة.' },
      hi: { buyerGreeting: 'नमस्ते! मैं आपको भरोसे के साथ खरीदारी करने में मदद करने के लिए यहाँ हूँ: हमारी खरीदार सुरक्षा कैसे काम करती है, ऑर्डर ट्रैक करना, वापसी और विवाद, या दुनिया भर के हमारे विक्रेताओं से कुछ ढूँढना।', placeholder: 'खरीदार सुरक्षा, ऑर्डर, वापसी...', hint: 'आप मुझे अपनी भाषा में लिख सकते हैं।' },
      bn: { buyerGreeting: 'নমস্কার! আমি আপনাকে নিশ্চিন্তে কেনাকাটা করতে সাহায্য করতে এখানে আছি: আমাদের ক্রেতা সুরক্ষা কীভাবে কাজ করে, অর্ডার ট্র্যাক করা, ফেরত ও বিরোধ, অথবা সারা বিশ্বের বিক্রেতাদের কাছ থেকে কিছু খুঁজে পাওয়া।', placeholder: 'ক্রেতা সুরক্ষা, অর্ডার, ফেরত...', hint: 'আপনি আমাকে আপনার নিজের ভাষায় লিখতে পারেন।' },
      vi: { buyerGreeting: 'Xin chào! Tôi ở đây để giúp bạn mua sắm yên tâm: cách bảo vệ người mua hoạt động, theo dõi đơn hàng, đổi trả và khiếu nại, hoặc tìm thứ gì đó từ những người bán của chúng tôi trên khắp thế giới.', placeholder: 'Bảo vệ người mua, đơn hàng, đổi trả...', hint: 'Bạn có thể nhắn cho tôi bằng ngôn ngữ của bạn.' },
      th: { buyerGreeting: 'สวัสดีค่ะ ฉันอยู่ที่นี่เพื่อช่วยให้คุณช้อปอย่างมั่นใจ: การคุ้มครองผู้ซื้อทำงานอย่างไร การติดตามคำสั่งซื้อ การคืนสินค้าและข้อพิพาท หรือค้นหาสินค้าจากผู้ขายของเราทั่วโลก', placeholder: 'การคุ้มครองผู้ซื้อ คำสั่งซื้อ การคืนสินค้า...', hint: 'คุณเขียนถึงฉันเป็นภาษาของคุณได้เลย' },
      id: { buyerGreeting: 'Halo! Saya di sini untuk membantu Anda berbelanja dengan tenang: cara kerja perlindungan pembeli, melacak pesanan, pengembalian dan sengketa, atau menemukan sesuatu dari penjual kami di seluruh dunia.', placeholder: 'Perlindungan pembeli, pesanan, pengembalian...', hint: 'Anda boleh menulis kepada saya dalam bahasa Anda sendiri.' },
      zh: { buyerGreeting: '您好！我可以帮助您放心购物：买家保护如何运作、订单追踪、退货与争议，或从我们世界各地的卖家中找到您想要的商品。', placeholder: '买家保护、订单、退货……', hint: '您可以用自己的语言与我交流。' },
      ja: { buyerGreeting: 'こんにちは！安心してお買い物いただけるようお手伝いします。購入者保護の仕組み、注文の追跡、返品や紛争、または世界中の出品者からの商品探しについてお尋ねください。', placeholder: '購入者保護、注文、返品について...', hint: 'ご自身の言語で書いていただけます。' },
      ko: { buyerGreeting: '안녕하세요! 안심하고 쇼핑하실 수 있도록 도와드립니다: 구매자 보호가 작동하는 방식, 주문 추적, 반품 및 분쟁, 또는 전 세계 판매자로부터 원하는 상품 찾기.', placeholder: '구매자 보호, 주문, 반품...', hint: '원하시는 언어로 편하게 적어 주세요.' },
    }

    function resolveLocale(): { code: string; locale: Locale; rtl: boolean } {
      if (typeof navigator === 'undefined') return { code: 'en', locale: I18N.en, rtl: false }
      const raw = (navigator.language || 'en').toLowerCase()
      const base = raw.split('-')[0]
      const code = I18N[base] ? base : 'en'
      return { code, locale: I18N[code], rtl: RTL_LANGS.includes(code) }
    }

    const BUYER_GREETING = "Hi! I'm here to help you shop with confidence — how our buyer protection works, tracking an order, returns and disputes, or finding something from our sellers around the world."

    const GREETINGS: Record<Tier, string> = {
      STARTER: "Hi, I'm Velor's AI Assistant. Ask me about fees, payouts, escrow timing, listing tips, or Velor policies.",
      PRO: "Hi, I'm your dedicated Velor AI Account Manager. I can look up your recent orders, explain your payout timing, draft a reply for a buyer or for support, and flag anything urgent straight to our team.",
      ENTERPRISE: "Hi, I'm your dedicated Velor AI Account Manager. I can look up your recent orders, explain your payout timing, draft a reply for a buyer or for support, and flag anything urgent straight to our team.",
    }

    const BUYER_LABELS = { title: 'Velor AI Assistant', subtitle: 'Here to help you shop', placeholder: 'Ask about buyer protection, orders, returns...' }

    const LABELS: Record<Tier, { title: string; subtitle: string; placeholder: string }> = {
      STARTER: { title: 'Velor AI Assistant', subtitle: 'Always-on AI, not a human', placeholder: 'Ask about fees, payouts, listings...' },
      PRO: { title: 'Velor AI Account Manager', subtitle: 'Your dedicated AI account manager', placeholder: 'Ask me to look something up, draft a reply, or flag an issue...' },
      ENTERPRISE: { title: 'Velor AI Account Manager', subtitle: 'Your dedicated AI account manager', placeholder: 'Ask me to look something up, draft a reply, or flag an issue...' },
    }

    export default function VelorAssistant({ variant = 'seller' }: { variant?: Variant }) {
      const isBuyer = variant === 'buyer'
      const [isOpen, setIsOpen] = useState(false)
  const [tier, setTier] = useState<Tier>('STARTER')
  const [loc, setLoc] = useState<{ code: string; locale: Locale; rtl: boolean }>({ code: 'en', locale: I18N.en, rtl: false })
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: isBuyer ? BUYER_GREETING : GREETINGS.STARTER }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Resolve the visitor's browser language once, and localise the opening
  // greeting only while the conversation is still untouched.
  useEffect(() => {
    const resolved = resolveLocale()
    setLoc(resolved)
    if (resolved.code === 'en') return
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== 'assistant') return prev
      const base = isBuyer ? resolved.locale.buyerGreeting : prev[0].content
      const hint = resolved.locale.hint ? `\n\n${resolved.locale.hint}` : ''
      return [{ role: 'assistant', content: base + hint }]
    })
  }, [isBuyer])

  useEffect(() => {
    // The buyer-facing assistant never looks up seller-tier data.
    if (isBuyer) return
    fetch('/api/seller/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const t = data?.tier as Tier | undefined
        if (t === 'PRO' || t === 'ENTERPRISE') {
          setTier(t)
          const resolved = resolveLocale()
          const hint = resolved.locale.hint ? `\n\n${resolved.locale.hint}` : ''
          setMessages([{ role: 'assistant', content: GREETINGS[t] + hint }])
        }
      })
      .catch(() => {})
  }, [isBuyer])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
}
}, [messages, isOpen])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setError('')
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
      try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, audience: isBuyer ? 'buyer' : 'seller' }),
})
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
} else {
        setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
}
} catch {
      setError('Network error. Please try again.')
} finally {
      setLoading(false)
}
}

  function handleKeyDown(e: any) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
}
}

  const baseLabels = isBuyer ? BUYER_LABELS : LABELS[tier]
  // Localise the placeholder; keep the brand title as-is.
  const labels = loc.code === 'en' ? baseLabels : { ...baseLabels, placeholder: loc.locale.placeholder }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>
{isOpen && (
        <div style={{ width: '360px', height: '480px', background: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', display: 'flex', flexDirection: 'column', marginBottom: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                <img src={AVATAR} alt="Velor AI Assistant" width={38} height={38} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(212,175,90,0.5)' }} />
                <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '9px', height: '9px', borderRadius: '50%', background: '#00E676', border: '2px solid #111111' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>{labels.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999999' }}>{labels.subtitle}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#999999', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>x</button>
          </div>

          <div ref={scrollRef} dir={loc.rtl ? 'rtl' : 'ltr'} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
{messages.map((m, i) => (
              m.role === 'assistant' ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', alignSelf: 'flex-start', maxWidth: '90%' }}>
                  <img src={AVATAR} alt="" width={24} height={24} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ background: '#1C1C1C', color: '#E5E5E5', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              ) : (
                <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#FF6B00', color: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.content}</div>
              )
            ))}
{loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', color: '#999999', fontSize: '12px' }}>
                <img src={AVATAR} alt="" width={24} height={24} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', opacity: 0.7 }} />
                Thinking...
              </div>
            )}
{error && (
              <div style={{ alignSelf: 'flex-start', color: '#FF1744', fontSize: '12px' }}>{error}</div>
                )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #2A2A2A', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={labels.placeholder}
              dir={loc.rtl ? 'rtl' : 'ltr'}
              rows={1}
              style={{ flex: 1, resize: 'none', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '8px 10px', color: '#FFFFFF', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ background: loading || !input.trim() ? '#2A2A2A' : '#FF6B00', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '13px', fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close Velor AI Assistant' : 'Open Velor AI Assistant'}
        style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: '#0D0D0D', border: '2px solid #FF6B00', padding: 0, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,0,0.4)', overflow: 'hidden' }}
      >
        <img src={AVATAR} alt="Velor AI Assistant" width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
{isOpen && (
          <span style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '13px', fontWeight: 700 }}>Close</span>
        )}
        <span style={{ position: 'absolute', bottom: '3px', right: '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#00E676', border: '2px solid #0D0D0D' }} />
      </button>
    </div>
  )
}
