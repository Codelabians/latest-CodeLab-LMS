import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Code,
  Minus,
  Sparkles,
} from "lucide-react";

/* ───────────────────── brand tokens (matches Categories/Company) ──── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

/* ───────────────────── toolbar button ──────────────────────────────── */
const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault(); // keep focus inside the editor
      onClick();
    }}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={!!active}
    className="flex items-center justify-center transition shrink-0"
    style={{
      width: 32,
      height: 32,
      borderRadius: 6,
      background: active ? BRAND_RED_TINT : "transparent",
      color: disabled
        ? TEXT_MUTED
        : active
          ? BRAND_RED
          : TEXT_SECONDARY,
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (!active && !disabled) e.currentTarget.style.background = SURFACE_ALT;
    }}
    onMouseLeave={(e) => {
      if (!active && !disabled) e.currentTarget.style.background = "transparent";
    }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div
    aria-hidden
    style={{
      width: 1,
      height: 22,
      background: BORDER,
      margin: "0 4px",
      alignSelf: "center",
    }}
  />
);

/* ───────────────────── main editor ─────────────────────────────────── */
const RichTextEditor = forwardRef(function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing…",
  minHeight = 140,
  disabled = false,
  // When set, the toolbar shows an "Insert variable" button that calls
  // this handler. Parent owns the picker modal; on selection it calls
  // editorRef.current.insertText('{var_name}') to drop it at the cursor.
  onRequestInsertVariable = null,
}, ref) {
  const [focused, setFocused] = useState(false);
  const lastEmittedRef = useRef(value);

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        // Use defaults but disable nodes we won't expose so users can't paste them in
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      lastEmittedRef.current = html;
      onChange?.(html);
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    editorProps: {
      attributes: {
        // Tailwind 'prose' isn't guaranteed in your project; use inline styles via CSS below.
        class: "rte-content",
        spellcheck: "true",
      },
    },
  });

  // Keep editor in sync with external value changes (e.g. when Formik resets the form
  // after a successful save or hydrates with API data). We compare against the last
  // value we emitted to avoid clobbering the editor mid-typing.
  useEffect(() => {
    if (!editor) return;
    if (value === undefined || value === null) return;
    if (value === lastEmittedRef.current) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value, { emitUpdate: false });
    lastEmittedRef.current = value;
  }, [value, editor]);

  // Update editable state when disabled prop changes
  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [disabled, editor]);

  // Expose imperative methods to parents (insertText at cursor).
  // Used by the variable picker to drop {var_name} into the body.
  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (!editor || !text) return;
      editor.chain().focus().insertContent(String(text)).run();
    },
    focus: () => editor?.chain().focus().run(),
    getHtml: () => editor?.getHTML() ?? "",
  }), [editor]);

  if (!editor) {
    return (
      <div
        style={{
          minHeight,
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          background: SURFACE_ALT,
        }}
      />
    );
  }

  const handleInsertLink = () => {
    const previous = editor.getAttributes("link").href;
    const next = window.prompt("Enter URL (leave empty to remove link):", previous || "https://");
    if (next === null) return; // cancelled
    if (next === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run();
  };

  const focusedBorder = focused ? BRAND_RED : BORDER;

  return (
    <>
      {/* ────────────── editor shell ────────────── */}
      <div
        style={{
          borderRadius: 8,
          border: `1px solid ${focusedBorder}`,
          background: SURFACE,
          transition: "border-color 0.15s",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center flex-wrap"
          style={{
            background: SURFACE_ALT,
            borderBottom: `1px solid ${BORDER}`,
            padding: "5px 6px",
            gap: 2,
          }}
        >
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            disabled={disabled}
            title="Strikethrough"
          >
            <Strikethrough size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            disabled={disabled}
            title="Inline code"
          >
            <Code size={15} strokeWidth={2.25} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            disabled={disabled}
            title="Heading 1"
          >
            <Heading1 size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            disabled={disabled}
            title="Heading 3"
          >
            <Heading3 size={15} strokeWidth={2.25} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            disabled={disabled}
            title="Bulleted list"
          >
            <List size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            disabled={disabled}
            title="Numbered list"
          >
            <ListOrdered size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            disabled={disabled}
            title="Quote"
          >
            <Quote size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={disabled}
            title="Horizontal rule"
          >
            <Minus size={15} strokeWidth={2.25} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn
            onClick={handleInsertLink}
            active={editor.isActive("link")}
            disabled={disabled}
            title="Insert / edit link"
          >
            <LinkIcon size={15} strokeWidth={2.25} />
          </ToolbarBtn>

          {onRequestInsertVariable && (
            <>
              <Divider />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRequestInsertVariable();
                }}
                disabled={disabled}
                title="Insert variable"
                aria-label="Insert variable"
                className="flex items-center gap-1.5 transition"
                style={{
                  height: 32,
                  padding: "0 10px",
                  borderRadius: 6,
                  background: BRAND_RED_TINT,
                  color: BRAND_RED,
                  border: `1px solid ${BRAND_RED}`,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#FCE7E7"; }}
                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = BRAND_RED_TINT; }}
              >
                <Sparkles size={13} strokeWidth={2.25} />
                Insert variable
              </button>
            </>
          )}

          <div className="flex-1" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} strokeWidth={2.25} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} strokeWidth={2.25} />
          </ToolbarBtn>
        </div>

        {/* Editable area */}
        <div
          style={{
            minHeight,
            padding: "12px 14px",
            background: disabled ? SURFACE_ALT : SURFACE,
            color: TEXT_PRIMARY,
            fontSize: 13.5,
            lineHeight: 1.6,
            opacity: disabled ? 0.7 : 1,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ────────────── scoped editor styles ────────────── */}
      <style>{`
        .rte-content { outline: none; min-height: ${minHeight - 24}px; }
        .rte-content p { margin: 0 0 0.6em; }
        .rte-content p:last-child { margin-bottom: 0; }
        .rte-content h1 { font-size: 20px; font-weight: 700; margin: 0.6em 0 0.4em; color: ${TEXT_PRIMARY}; }
        .rte-content h2 { font-size: 17px; font-weight: 700; margin: 0.6em 0 0.4em; color: ${TEXT_PRIMARY}; }
        .rte-content h3 { font-size: 15px; font-weight: 700; margin: 0.6em 0 0.4em; color: ${TEXT_PRIMARY}; }
        .rte-content ul, .rte-content ol { margin: 0 0 0.6em; padding-left: 22px; }
        .rte-content li { margin-bottom: 2px; }
        .rte-content li p { margin: 0; }
        .rte-content blockquote {
          margin: 0 0 0.6em;
          padding: 4px 12px;
          border-left: 3px solid ${BRAND_RED};
          background: ${BRAND_RED_TINT};
          color: ${TEXT_SECONDARY};
          font-style: italic;
          border-radius: 4px;
        }
        .rte-content code {
          padding: 1px 6px;
          border-radius: 4px;
          background: ${SURFACE_ALT};
          border: 1px solid ${BORDER};
          font-size: 12.5px;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
        }
        .rte-content hr {
          border: none;
          border-top: 1px solid ${BORDER};
          margin: 12px 0;
        }
        .rte-content a {
          color: ${BRAND_RED};
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .rte-content.is-editor-empty:first-child::before,
        .rte-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${TEXT_MUTED};
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </>
  );
});

export default RichTextEditor;
