from pathlib import Path

path = Path("components/private-messages.tsx")
text = path.read_text(encoding="utf-8")

# 1) icon import
if "MoreVertical," not in text:
    text = text.replace("  MessageCircle,\n", "  MessageCircle,\n  MoreVertical,\n", 1)

# 2) controlled menu state
state_marker = "  const [deletingForEveryoneId, setDeletingForEveryoneId] = useState<number | null>(null)\n"
if "openMessageMenuId" not in text:
    if state_marker not in text:
        raise SystemExit("message delete state marker not found")
    text = text.replace(
        state_marker,
        state_marker + "  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null)\n",
        1,
    )

# 3) click-outside + Escape close
if "data-private-message-menu" not in text:
    marker = "  async function respond(item: FriendItem, accept: boolean) {"
    if marker not in text:
        raise SystemExit("respond marker not found")
    effect = '''  useEffect(() => {
    if (openMessageMenuId === null) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Element | null
      if (target?.closest("[data-private-message-menu]")) return
      setOpenMessageMenuId(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMessageMenuId(null)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [openMessageMenuId])

'''
    text = text.replace(marker, effect + marker, 1)

# 4) close menu when choosing delete actions
text = text.replace(
    "  async function deleteForMe(message: PrivateMessage) {\n    if (!selectedId || deletingMessageId !== null) return\n",
    "  async function deleteForMe(message: PrivateMessage) {\n    if (!selectedId || deletingMessageId !== null) return\n    setOpenMessageMenuId(null)\n",
    1,
)
text = text.replace(
    "  async function deleteForEveryone(message: PrivateMessage) {\n    if (!selectedId || deletingForEveryoneId !== null || !canDeleteForEveryone(message)) return\n",
    "  async function deleteForEveryone(message: PrivateMessage) {\n    if (!selectedId || deletingForEveryoneId !== null || !canDeleteForEveryone(message)) return\n    setOpenMessageMenuId(null)\n",
    1,
)

# 5) make bubble relative and leave room for top-right menu
old_bubble = '''                              className={`rounded-2xl px-4 py-3 text-left text-sm leading-6 shadow-lg ${
                                message.is_own
                                  ? "rounded-tr-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                                  : "rounded-tl-md border border-white/10 bg-white/[.07] text-slate-100"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{body}</p>'''
new_bubble = '''                              className={`relative rounded-2xl px-4 py-3 pr-11 text-left text-sm leading-6 shadow-lg ${
                                message.is_own
                                  ? "rounded-tr-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                                  : "rounded-tl-md border border-white/10 bg-white/[.07] text-slate-100"
                              }`}
                            >
                              <div data-private-message-menu className="absolute right-2 top-2 z-20">
                                <button
                                  type="button"
                                  aria-label="Opsi pesan"
                                  aria-haspopup="menu"
                                  aria-expanded={openMessageMenuId === message.id}
                                  onClick={() => setOpenMessageMenuId((current) => current === message.id ? null : message.id)}
                                  className={`grid h-7 w-7 cursor-pointer place-items-center rounded-full transition-colors ${
                                    message.is_own
                                      ? "text-white/75 hover:bg-white/15 hover:text-white"
                                      : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
                                  }`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {openMessageMenuId === message.id && (
                                  <div
                                    role="menu"
                                    className="absolute right-0 top-8 z-40 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#081426]/[.99] p-1 text-left shadow-[0_16px_45px_rgba(0,0,0,.55)] backdrop-blur-xl"
                                  >
                                    <button
                                      type="button"
                                      disabled={deletingMessageId !== null || deletingForEveryoneId !== null}
                                      onClick={() => void deleteForMe(message)}
                                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[.07] disabled:opacity-40"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                                      {deletingMessageId === message.id ? "Menghapus…" : "Hapus untuk saya"}
                                    </button>
                                    {canDeleteForEveryone(message) && (
                                      <button
                                        type="button"
                                        disabled={deletingMessageId !== null || deletingForEveryoneId !== null}
                                        onClick={() => void deleteForEveryone(message)}
                                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {deletingForEveryoneId === message.id ? "Menghapus…" : "Hapus untuk semua"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <p className="whitespace-pre-wrap break-words">{body}</p>'''
if old_bubble not in text:
    raise SystemExit("message bubble marker not found")
text = text.replace(old_bubble, new_bubble, 1)

# 6) remove old inline delete action row below bubble
old_actions = '''                            <div className={`mt-1.5 flex items-center gap-3 ${message.is_own ? "justify-end" : "justify-start"}`}>
                              <button
                                type="button"
                                disabled={deletingMessageId !== null || deletingForEveryoneId !== null}
                                onClick={() => void deleteForMe(message)}
                                title="Hapus hanya untuk saya"
                                className={`inline-flex items-center gap-1 text-[10px] transition-colors disabled:opacity-40 ${
                                  message.is_own
                                    ? "text-indigo-200/55 hover:text-rose-200"
                                    : "text-slate-600 hover:text-rose-300"
                                }`}
                              >
                                <Trash2 className="h-3 w-3" />
                                {deletingMessageId === message.id ? "Menghapus…" : "Hapus untuk saya"}
                              </button>
                              {canDeleteForEveryone(message) && (
                                <button
                                  type="button"
                                  disabled={deletingMessageId !== null || deletingForEveryoneId !== null}
                                  onClick={() => void deleteForEveryone(message)}
                                  title="Hapus untuk semua dalam 30 menit"
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300/75 transition-colors hover:text-rose-200 disabled:opacity-40"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {deletingForEveryoneId === message.id ? "Menghapus…" : "Hapus untuk semua"}
                                </button>
                              )}
                            </div>
'''
if old_actions not in text:
    raise SystemExit("old inline message actions not found")
text = text.replace(old_actions, "", 1)

path.write_text(text, encoding="utf-8")
