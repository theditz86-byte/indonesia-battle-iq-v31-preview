from pathlib import Path

pm = Path("components/private-messages.tsx")
text = pm.read_text(encoding="utf-8")

text = text.replace("  MoreVertical,\n  Send,", "  MoreVertical,\n  Reply,\n  Send,", 1)

text = text.replace(
    '  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null)\n',
    '  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null)\n'
    '  const [replyingTo, setReplyingTo] = useState<PrivateMessage | null>(null)\n',
    1,
)

text = text.replace(
    '  const endRef = useRef<HTMLDivElement | null>(null)\n',
    '  const endRef = useRef<HTMLDivElement | null>(null)\n'
    '  const composerRef = useRef<HTMLTextAreaElement | null>(null)\n',
    1,
)

scroll_effect = '''  useEffect(() => {\n    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })\n  }, [messages.length])\n'''
if 'setReplyingTo(null)\n  }, [selectedId])' not in text:
    text = text.replace(
        scroll_effect,
        scroll_effect + '''\n  useEffect(() => {\n    setReplyingTo(null)\n  }, [selectedId])\n''',
        1,
    )

respond_marker = '  async function respond(item: FriendItem, accept: boolean) {'
if 'function replyPreviewText(message: PrivateMessage)' not in text:
    helper = '''  function replyPreviewText(message: PrivateMessage) {\n    if (message.encryption_version === 1) {\n      return decryptedMessages[String(message.id)] || "Pesan terenkripsi"\n    }\n    return (message.message || "Pesan").trim() || "Pesan"\n  }\n\n  function startReply(message: PrivateMessage) {\n    setReplyingTo(message)\n    setOpenMessageMenuId(null)\n    window.requestAnimationFrame(() => composerRef.current?.focus())\n  }\n\n'''
    text = text.replace(respond_marker, helper + respond_marker, 1)

text = text.replace(
    '        conversation_id: selectedId,\n        message: text,\n',
    '        conversation_id: selectedId,\n        message: text,\n        reply_to_message_id: replyingTo?.id ?? null,\n',
    1,
)
text = text.replace(
    '      setDraft("")\n      void loadOverview(true)\n',
    '      setDraft("")\n      setReplyingTo(null)\n      void loadOverview(true)\n',
    1,
)

menu_anchor = '''                                  <div\n                                    role="menu"\n                                    className="absolute right-0 top-8 z-40 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#081426]/[.99] p-1 text-left shadow-[0_16px_45px_rgba(0,0,0,.55)] backdrop-blur-xl"\n                                  >\n'''
reply_button = '''                                    <button\n                                      type="button"\n                                      onClick={() => startReply(message)}\n                                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[.07]"\n                                    >\n                                      <Reply className="h-3.5 w-3.5 text-cyan-300" />\n                                      Balas\n                                    </button>\n'''
if 'onClick={() => startReply(message)}' not in text:
    text = text.replace(menu_anchor, menu_anchor + reply_button, 1)

body_anchor = '                              <p className="whitespace-pre-wrap break-words">{body}</p>\n'
reply_quote = '''                              {message.reply_to && (\n                                <div\n                                  className={`mb-2 rounded-lg border-l-2 px-3 py-2 text-left ${\n                                    message.is_own\n                                      ? "border-cyan-200/70 bg-black/15"\n                                      : "border-cyan-400/60 bg-slate-950/35"\n                                  }`}\n                                >\n                                  <p className="truncate text-[10px] font-black text-cyan-200">\n                                    {message.reply_to.is_own\n                                      ? "Anda"\n                                      : message.reply_to.sender_nickname || selectedOther.nickname || "Peserta"}\n                                  </p>\n                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-white/70">\n                                    {message.reply_to.is_deleted || message.reply_to.is_unavailable\n                                      ? "Pesan tidak tersedia"\n                                      : message.reply_to.message || "Pesan"}\n                                  </p>\n                                </div>\n                              )}\n'''
if 'message.reply_to.is_deleted' not in text:
    text = text.replace(body_anchor, reply_quote + body_anchor, 1)

form_anchor = '              <form onSubmit={send} className="border-t border-white/10 bg-slate-950/35 p-4 sm:p-5">\n'
composer_reply = '''                {replyingTo && (\n                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-2.5">\n                    <Reply className="h-4 w-4 shrink-0 text-cyan-300" />\n                    <div className="min-w-0 flex-1">\n                      <p className="text-[10px] font-black text-cyan-200">\n                        Balas {replyingTo.is_own ? "pesan Anda" : selectedOther.nickname || "pesan"}\n                      </p>\n                      <p className="mt-0.5 truncate text-xs text-slate-400">{replyPreviewText(replyingTo)}</p>\n                    </div>\n                    <button\n                      type="button"\n                      onClick={() => setReplyingTo(null)}\n                      aria-label="Batal membalas"\n                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"\n                    >\n                      <X className="h-4 w-4" />\n                    </button>\n                  </div>\n                )}\n'''
if 'Batal membalas' not in text:
    text = text.replace(form_anchor, form_anchor + composer_reply, 1)

text = text.replace(
    '                    <textarea\n                      value={draft}\n',
    '                    <textarea\n                      ref={composerRef}\n                      value={draft}\n',
    1,
)

pm.write_text(text, encoding="utf-8")

social = Path("lib/social.ts")
s = social.read_text(encoding="utf-8")
marker = '  e2ee_payload?: E2EEPayloadV1 | null\n'
addition = '''  reply_to_message_id?: number | null\n  reply_to?: {\n    id?: number\n    message?: string | null\n    is_deleted?: boolean\n    is_unavailable?: boolean\n    is_own?: boolean\n    sender_nickname?: string | null\n  } | null\n'''
if 'reply_to_message_id?: number | null' not in s:
    if marker not in s:
        raise SystemExit("PrivateMessage marker not found")
    s = s.replace(marker, marker + addition, 1)
social.write_text(s, encoding="utf-8")
