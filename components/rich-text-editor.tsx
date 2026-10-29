"use client"
 
import { useRef, useEffect, useCallback, useState } from "react"
import { 
    Bold, Italic, Underline, List, ListOrdered, Highlighter, Type, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, 
    Link as LinkIcon, Undo, Redo, Minus, Heading1, Heading2, Heading3, 
    Eraser, ChevronDown, ImageIcon, Upload, Loader2, X, Plus
} from "lucide-react"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { convertToWebP } from "@/lib/image-optimizer"
import { toast } from "@/hooks/use-toast"

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    minHeight?: number
}

const COLORS = ["#000000", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#ffedd5", "#fce7f3"]
const FONTS = [
    { name: "Default", value: "inherit" },
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Courier New", value: "'Courier New', monospace" },
    { name: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
    { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
    { name: "Impact", value: "Impact, sans-serif" }
]

export function RichTextEditor({ value, onChange, placeholder = "Write description...", minHeight = 280 }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [imageUrlInput, setImageUrlInput] = useState("")
    const [imageAltInput, setImageAltInput] = useState("")
    const [uploadingImage, setUploadingImage] = useState(false)
    const savedSelectionRef = useRef<Range | null>(null)

    useEffect(() => {
        setIsMounted(true)
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || ""
        }
    }, [])

    const saveSelection = () => {
        if (typeof window !== "undefined") {
            const sel = window.getSelection()
            if (sel && sel.rangeCount > 0) {
                savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
            }
        }
    }

    const restoreSelection = () => {
        if (typeof window !== "undefined" && savedSelectionRef.current) {
            const sel = window.getSelection()
            if (sel) {
                sel.removeAllRanges()
                sel.addRange(savedSelectionRef.current)
            }
        }
    }

    const exec = useCallback((cmd: string, val?: string) => {
        if (cmd === "createLink") {
            const url = window.prompt("Enter URL:")
            if (url) document.execCommand(cmd, false, url)
        } else {
            document.execCommand(cmd, false, val)
        }
        editorRef.current?.focus()
        onChange(editorRef.current?.innerHTML || "")
    }, [onChange])

    const insertImageHtml = (url: string, altText?: string) => {
        if (!url || !editorRef.current) return
        editorRef.current.focus()
        restoreSelection()

        const alt = altText?.trim() || "Customer proof screenshot"
        const imgHtml = `
            <figure class="my-4 text-center">
                <img src="${url}" alt="${alt}" class="rounded-xl shadow-md max-w-full h-auto mx-auto border border-gray-200 dark:border-slate-700" style="max-height: 520px; object-fit: contain;" />
                ${altText ? `<figcaption class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">${altText}</figcaption>` : ''}
            </figure>
            <p><br></p>
        `

        let inserted = false
        try {
            inserted = document.execCommand("insertHTML", false, imgHtml)
        } catch {
            inserted = false
        }

        if (!inserted && editorRef.current) {
            editorRef.current.innerHTML += imgHtml
        }

        onChange(editorRef.current?.innerHTML || "")
        setImageModalOpen(false)
        setImageUrlInput("")
        setImageAltInput("")
    }

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setUploadingImage(true)
        try {
            const rawFile = files[0]
            const optimized = await convertToWebP(rawFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
            const fd = new FormData()
            fd.append("file", optimized)

            const res = await fetch("/api/upload", { method: "POST", body: fd })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to upload image")

            insertImageHtml(data.url, imageAltInput || "Customer proof screenshot")
            toast({ title: "✅ Image / Screenshot inserted into description!" })
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" })
        } finally {
            setUploadingImage(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    // Handle direct paste of screenshots (Win + Shift + S or clipboard copy)
    const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault()
                const file = items[i].getAsFile()
                if (!file) continue

                saveSelection()
                toast({ title: "📸 Uploading pasted screenshot..." })
                try {
                    const optimized = await convertToWebP(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
                    const fd = new FormData()
                    fd.append("file", optimized)
                    const res = await fetch("/api/upload", { method: "POST", body: fd })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || "Upload failed")
                    insertImageHtml(data.url, "Customer proof screenshot")
                    toast({ title: "✅ Screenshot pasted and inserted!" })
                } catch (err: any) {
                    toast({ title: "Failed to paste image", description: err.message, variant: "destructive" })
                }
                return
            }
        }
    }

    const handleInput = () => onChange(editorRef.current?.innerHTML || "")

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden ring-offset-0 focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/50 border-b border-gray-200">
                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("undo")} title="Undo"><Undo className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("redo")} title="Redo"><Redo className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                            Styles <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => exec("formatBlock", "p")}>Paragraph</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exec("formatBlock", "h1")} className="font-bold text-lg">Heading 1</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exec("formatBlock", "h2")} className="font-bold text-md">Heading 2</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exec("formatBlock", "h3")} className="font-bold text-sm">Heading 3</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                            Fonts <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                        {FONTS.map(font => (
                            <DropdownMenuItem key={font.name} onClick={() => exec("fontName", font.value)} style={{ fontFamily: font.value === 'inherit' ? 'inherit' : font.value }}>
                                {font.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("justifyLeft")} title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("justifyCenter")} title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("justifyRight")} title="Align Right"><AlignRight className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("justifyFull")} title="Justify"><AlignJustify className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("createLink")} title="Insert Link"><LinkIcon className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal Rule"><Minus className="h-3.5 w-3.5" /></ToolBtn>
                    {/* Add Image / Screenshot Button */}
                    <button
                        type="button"
                        onClick={() => {
                            saveSelection()
                            setImageModalOpen(true)
                        }}
                        title="Insert Screenshot / Customer Proof Image"
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add Screenshot</span>
                    </button>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* Text colors & Highlights */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-1.5 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                            <Type className="h-3.5 w-3.5" /> <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-2">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Text Color</div>
                        <div className="flex gap-1 mb-3">
                            {COLORS.map((c) => (
                                <button key={c} type="button" onClick={() => exec("foreColor", c)} className="h-6 w-6 rounded-md border border-gray-200" style={{ background: c }} />
                            ))}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Highlight</div>
                        <div className="flex gap-1">
                            {HIGHLIGHTS.map((c) => (
                                <button key={c} type="button" onClick={() => exec("hiliteColor", c)} className="h-6 w-6 rounded-md border border-gray-200" style={{ background: c }} />
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting"><Eraser className="h-3.5 w-3.5" /></ToolBtn>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                className="p-6 focus:outline-none text-base leading-relaxed min-h-[var(--editor-min-h)] prose max-w-none prose-sm sm:prose-base prose-blue prose-img:rounded-xl prose-img:shadow-md"
                style={{ minHeight: `${minHeight}px`, "--editor-min-h": `${minHeight}px` } as any}
            />

            {/* Insert Screenshot Modal */}
            {imageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <ImageIcon className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-base">Insert Screenshot / Proof Image</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setImageModalOpen(false)}
                                className="h-7 w-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Add customer feedback screenshots, WhatsApp proof, or product previews inside description. You can also paste directly into the editor using <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border rounded">Ctrl+V</kbd>.
                        </p>

                        <div className="space-y-3 pt-1">
                            {/* Option 1: Upload from Device */}
                            <div className="p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 text-center hover:bg-blue-50/60 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="w-full flex flex-col items-center justify-center gap-2 py-2"
                                >
                                    {uploadingImage ? (
                                        <>
                                            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                                            <span className="text-xs font-semibold text-blue-600">Optimizing & Uploading WebP...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-7 w-7 text-blue-600" />
                                            <span className="text-sm font-semibold text-gray-900">Upload Screenshot from Device</span>
                                            <span className="text-[11px] text-gray-400">PNG, JPG, WebP auto-compressed</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="relative flex items-center py-1">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">or insert by url</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            {/* Option 2: Image URL */}
                            <div className="space-y-2">
                                <input
                                    type="url"
                                    placeholder="https://example.com/screenshot.webp"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    className="w-full h-10 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <input
                                    type="text"
                                    placeholder="Optional caption (e.g. WhatsApp Customer Review)"
                                    value={imageAltInput}
                                    onChange={(e) => setImageAltInput(e.target.value)}
                                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => insertImageHtml(imageUrlInput, imageAltInput)}
                                    disabled={!imageUrlInput.trim()}
                                    className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                                >
                                    Insert by URL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
                [contenteditable] { font-family: inherit; }
                [contenteditable] h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
                [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                [contenteditable] h3 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.5em; }
                [contenteditable] ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
                [contenteditable] ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
                [contenteditable] a { color: #3b82f6; text-decoration: underline; }
                [contenteditable] blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; color: #4b5563; font-style: italic; }
                [contenteditable] img { max-width: 100%; height: auto; border-radius: 0.75rem; display: block; margin: 1rem auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            `}</style>
        </div>
    )
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onClick() }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        >
            {children}
        </button>
    )
}
