'use client'

// Live whole-page translation (William, 2026-07-17): when a buyer picks one
// of the 19 languages in the header, every page they visit renders in that
// language. Works by walking the DOM's text nodes and swapping them for
// cached translations from /api/translate (each unique string costs one
// model call per language, ever -- see lib/translate.ts).
//
// Design constraints honoured:
// - Text-node swaps only: React keeps ownership of the element tree, so
//   handlers/state survive. A MutationObserver (paused while we apply our
//   own swaps) re-translates anything React re-renders or loads late.
// - Numbers, prices, currency symbols and single characters are skipped.
// - The header's language/currency <select>s keep their native names
//   (SELECT/OPTION are excluded), and anything inside data-no-translate.
// - English restores originals instantly from the in-memory map.

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getDisplayLanguage } from '@/lib/language'

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'SELECT', 'OPTION', 'CODE', 'PRE'])
const NO_LETTERS = /^[^A-Za-z]*$/

export default function LanguageTranslator() {
  const pathname = usePathname()
  const originals = useRef(new WeakMap<Text, string>())
  const dict = useRef(new Map<string, Map<string, string>>()) // lang -> src -> dst
  const busy = useRef(false)
  const observer = useRef<MutationObserver | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const langDict = (lang: string) => {
      let d = dict.current.get(lang)
      if (!d) {
        d = new Map()
        // session cache survives navigations without re-hitting the API
        try {
          const raw = window.sessionStorage.getItem('velor_tx_' + lang)
          if (raw) for (const [k, v] of JSON.parse(raw)) d.set(k, v)
        } catch {}
        dict.current.set(lang, d)
      }
      return d
    }

    const saveDict = (lang: string) => {
      try {
        const d = dict.current.get(lang)
        if (!d) return
        const entries = [...d.entries()].slice(-1500)
        window.sessionStorage.setItem('velor_tx_' + lang, JSON.stringify(entries))
      } catch {}
    }

    const collectNodes = (): Text[] => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = (node as Text).parentElement
          if (!p) return NodeFilter.FILTER_REJECT
          if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT
          if (p.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT
          const t = node.nodeValue || ''
          const trimmed = t.trim()
          if (trimmed.length < 2) return NodeFilter.FILTER_REJECT
          if (NO_LETTERS.test(trimmed)) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })
      const out: Text[] = []
      let n: Node | null
      while ((n = walker.nextNode())) out.push(n as Text)
      return out
    }

    const restoreEnglish = () => {
      for (const node of collectNodes()) {
        const orig = originals.current.get(node)
        if (orig !== undefined && node.nodeValue !== orig) node.nodeValue = orig
      }
      document.documentElement.lang = 'en'
    }

    const applyDict = (nodes: Text[], d: Map<string, string>) => {
      observer.current?.disconnect()
      for (const node of nodes) {
        const raw = node.nodeValue || ''
        const orig = originals.current.get(node) ?? raw
        const key = orig.trim()
        const dst = d.get(key)
        if (dst && dst !== key) {
          if (!originals.current.has(node)) originals.current.set(node, raw)
          const lead = raw.match(/^\s*/)?.[0] ?? ''
          const tail = raw.match(/\s*$/)?.[0] ?? ''
          node.nodeValue = lead + dst + tail
        }
      }
      startObserver()
    }

    const translatePage = async () => {
      const lang = getDisplayLanguage()
      if (lang === 'en') {
        restoreEnglish()
        return
      }
      if (busy.current) return
      busy.current = true
      try {
        document.documentElement.lang = lang
        const d = langDict(lang)
        const nodes = collectNodes()
        applyDict(nodes, d) // whatever we already know, instantly
        const pending = [...new Set(
          nodes
            .map((n) => (originals.current.get(n) ?? n.nodeValue ?? '').trim())
            .filter((t) => t.length >= 2 && !NO_LETTERS.test(t) && !d.has(t))
        )].slice(0, 400)
        if (pending.length > 0) {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ lang, texts: pending }),
          })
          if (res.ok) {
            const { translations } = await res.json()
            pending.forEach((src, i) => d.set(src, translations[i]))
            saveDict(lang)
            applyDict(collectNodes(), d)
          }
        }
      } catch {
        // fail-safe: page stays in English rather than half-broken
      } finally {
        busy.current = false
      }
    }

    const schedule = () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => { void translatePage() }, 600)
    }

    const startObserver = () => {
      if (getDisplayLanguage() === 'en') return
      if (!observer.current) {
        observer.current = new MutationObserver(() => schedule())
      }
      observer.current.observe(document.body, { childList: true, subtree: true, characterData: true })
    }

    const onLangChange = () => {
      observer.current?.disconnect()
      void translatePage()
    }

    window.addEventListener('velor-language-changed', onLangChange)
    schedule()
    return () => {
      window.removeEventListener('velor-language-changed', onLangChange)
      observer.current?.disconnect()
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [pathname])

  return null
}
