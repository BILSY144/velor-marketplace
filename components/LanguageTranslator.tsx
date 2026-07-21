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
import { getDisplayLanguage, SUPPORTED_LANGUAGES } from '@/lib/language'

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'SELECT', 'OPTION', 'CODE', 'PRE'])
const NO_LETTERS = /^[^A-Za-z]*$/

export default function LanguageTranslator() {
  const pathname = usePathname()
  const originals = useRef(new WeakMap<Text, string>())
  // The value WE last wrote into each node (i.e. our own translated output).
  // Used to tell "this node's live content changed because we translated
  // it" apart from "this node's live content changed because React
  // re-rendered it with new data" -- see the staleness check in applyDict.
  const applied = useRef(new WeakMap<Text, string>())
  const dict = useRef(new Map<string, Map<string, string>>()) // lang -> src -> dst
  const busy = useRef(false)
  const queued = useRef(false)
  const observer = useRef<MutationObserver | null>(null)
  const prefetched = useRef(new Set<string>()) // pathname|lang pairs already prefetched
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const langDict = (lang: string) => {
      let d = dict.current.get(lang)
      if (!d) {
        d = new Map()
        // session cache survives navigations without re-hitting the API
        try {
          const raw = window.localStorage.getItem('velor_tx_' + lang)
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
        const entries = [...d.entries()].slice(-2000)
        window.localStorage.setItem('velor_tx_' + lang, JSON.stringify(entries))
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
        // If the live DOM content no longer matches what we last wrote
        // ourselves, the underlying English source changed since (e.g. a
        // live price after a currency switch) -- treat it as a fresh
        // original rather than reusing a stale one.
        if (originals.current.has(node) && applied.current.get(node) !== raw) {
          originals.current.set(node, raw)
        }
        const orig = originals.current.get(node) ?? raw
        const key = orig.trim()
        const dst = d.get(key)
        if (dst && dst !== key) {
          if (!originals.current.has(node)) originals.current.set(node, raw)
          const lead = raw.match(/^\s*/)?.[0] ?? ''
          const tail = raw.match(/\s*$/)?.[0] ?? ''
          const next = lead + dst + tail
          node.nodeValue = next
          applied.current.set(node, next)
        }
      }
      startObserver()
    }

    const translatePage = async () => {
      const lang = getDisplayLanguage()
      if (lang === 'en') {
        restoreEnglish()
        window.setTimeout(() => { void prefetchAll() }, 2500)
        return
      }
      if (busy.current) {
        // a run is in flight for a possibly different language -- queue a
        // fresh pass instead of silently dropping this one (the bug that
        // left the page in the PREVIOUS language after a quick switch)
        queued.current = true
        return
      }
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
        )]
        if (pending.length > 0) {
          // ALL pending strings at once, in parallel 150-string requests,
          // painting as each chunk returns -- no sequential pass crawl.
          // Cached strings resolve in one fast DB round trip; only strings
          // never seen before in this language cost model time.
          const chunks: string[][] = []
          for (let i = 0; i < pending.length && chunks.length < 14; i += 150) {
            chunks.push(pending.slice(i, i + 150))
          }
          await Promise.all(chunks.map(async (chunk) => {
            try {
              const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ lang, texts: chunk }),
              })
              if (res.ok) {
                const { translations } = await res.json()
                // Only cache genuine translations. /api/translate falls
                // back to the source string (translated === src) when the
                // daily anti-abuse budget is capped or a model call fails
                // for that chunk -- if we cached those as if they were real
                // translations, the string would look "done" forever and
                // never be retried, permanently stranding it in English
                // even after the budget resets. Leaving it out of `d` means
                // the next translatePage() pass (next visit, or a later
                // pass this session) sees it as still-missing and tries
                // again.
                chunk.forEach((src, i) => {
                  const t = translations[i]
                  if (t && t !== src) d.set(src, t)
                })
                // stale-run guard: only paint if the user is still on the
                // language this batch was fetched for
                if (getDisplayLanguage() === lang) {
                  applyDict(collectNodes(), d)
                }
              }
            } catch {}
          }))
          saveDict(lang)
        }
      } catch {
        // fail-safe: page stays in English rather than half-broken
      } finally {
        busy.current = false
        if (queued.current) {
          queued.current = false
          // direct call, not schedule(): background tabs throttle timers,
          // and the queued pass usually only needs to paint from the dict
          void translatePage()
        } else {
          window.setTimeout(() => { void prefetchAll() }, 1500)
        }
      }
    }

    // Background prefetch: once the page is settled, pull this page's
    // strings in EVERY language into memory (cache-warmed languages are one
    // cheap DB round trip each) -- so switching language is instant, no
    // network on the click. Runs once per page per language.
    const prefetchAll = async () => {
      const current = getDisplayLanguage()
      const nodes = collectNodes()
      const texts = [...new Set(
        nodes
          .map((n) => (originals.current.get(n) ?? n.nodeValue ?? '').trim())
          .filter((t) => t.length >= 2 && !NO_LETTERS.test(t))
      )]
      if (texts.length === 0) return
      const langs = SUPPORTED_LANGUAGES.map((l) => l.code).filter((c) => c !== 'en' && c !== current && !prefetched.current.has(pathname + '|' + c))
      for (const l of langs) {
        prefetched.current.add(pathname + '|' + l)
        const d = langDict(l)
        const missing = texts.filter((t) => !d.has(t))
        if (missing.length === 0) continue
        const chunks: string[][] = []
        for (let i = 0; i < missing.length && chunks.length < 14; i += 150) chunks.push(missing.slice(i, i + 150))
        try {
          await Promise.all(chunks.map(async (chunk) => {
            const res = await fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang: l, texts: chunk }) })
            if (res.ok) {
              const { translations } = await res.json()
              // Same fallback-vs-real distinction as translatePage() above --
              // don't cache a budget/error fallback as a finished translation.
              chunk.forEach((src, i) => {
                const t = translations[i]
                if (t && t !== src) d.set(src, t)
              })
            }
          }))
          saveDict(l)
        } catch {}
        // if the user switched TO this language while it prefetched, paint it
        if (getDisplayLanguage() === l) applyDict(collectNodes(), d)
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
