import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * MarkdownRenderer:
 * Renders rich, structured Markdown responses in DocuMind chat with:
 * - Proper headings hierarchy (H1-H4)
 * - Numbered lists for assignments/steps & bullet points for items
 * - Responsive styled tables with horizontal scrolling
 * - Styled blockquotes and alert banners
 * - Inline code & syntax-styled code blocks
 * - Bold key metrics & terms
 * - Theming aligned with Paper Pals, Dreamy Digital, Organic Intelligence, and Retro Pop
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null

  return (
    <div className={`prose-documind space-y-1 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ _node, ...props }) => (
            <h1
              className="text-base sm:text-lg font-display font-extrabold text-main mt-4 mb-2 first:mt-0 tracking-tight border-b border-edge pb-1.5"
              {...props}
            />
          ),
          h2: ({ _node, ...props }) => (
            <h2
              className="text-sm sm:text-base font-display font-bold text-main mt-3.5 mb-2 first:mt-0 tracking-tight"
              {...props}
            />
          ),
          h3: ({ _node, ...props }) => (
            <h3
              className="text-xs sm:text-sm font-display font-bold text-main mt-3 mb-1.5 first:mt-0"
              {...props}
            />
          ),
          h4: ({ _node, ...props }) => (
            <h4
              className="text-xs sm:text-sm font-bold text-main mt-2 mb-1 first:mt-0"
              {...props}
            />
          ),
          p: ({ _node, ...props }) => (
            <p className="text-xs sm:text-sm leading-relaxed text-main mb-2.5 last:mb-0" {...props} />
          ),
          ul: ({ _node, ...props }) => (
            <ul className="list-disc list-outside ml-4 sm:ml-5 space-y-1 mb-2.5 text-xs sm:text-sm leading-relaxed text-main" {...props} />
          ),
          ol: ({ _node, ...props }) => (
            <ol className="list-decimal list-outside ml-4 sm:ml-5 space-y-1 mb-2.5 text-xs sm:text-sm leading-relaxed text-main" {...props} />
          ),
          li: ({ _node, ...props }) => (
            <li className="pl-1 leading-relaxed text-main" {...props} />
          ),
          strong: ({ _node, ...props }) => (
            <strong className="font-bold text-main" {...props} />
          ),
          em: ({ _node, ...props }) => (
            <em className="italic text-muted" {...props} />
          ),
          blockquote: ({ _node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/70 bg-surface-alt/50 px-3.5 py-2 my-2.5 rounded-r-xl text-xs sm:text-sm italic text-muted space-y-1"
              {...props}
            />
          ),
          code: ({ _node, inline, className: _codeClass, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-surface-alt/70 text-primary font-mono text-[11px] sm:text-xs px-1.5 py-0.5 rounded-md border border-edge/70"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <pre className="bg-surface-alt/80 border border-edge rounded-xl p-3 my-2.5 overflow-x-auto font-mono text-[11px] sm:text-xs text-main leading-relaxed">
                <code {...props}>{children}</code>
              </pre>
            )
          },
          table: ({ _node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-edge rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[320px]" {...props} />
            </div>
          ),
          thead: ({ _node, ...props }) => (
            <thead className="bg-surface-alt/80 border-b border-edge" {...props} />
          ),
          th: ({ _node, ...props }) => (
            <th
              className="py-2.5 px-3.5 font-bold text-main uppercase text-[10px] tracking-wider border-r border-edge/60 last:border-r-0"
              {...props}
            />
          ),
          td: ({ _node, ...props }) => (
            <td
              className="py-2 px-3.5 text-main border-b border-edge/60 border-r border-edge/60 last:border-r-0 last:border-b-0"
              {...props}
            />
          ),
          tr: ({ _node, ...props }) => (
            <tr className="hover:bg-surface-hover/50 transition-colors" {...props} />
          ),
          hr: ({ _node, ...props }) => (
            <hr className="my-3.5 border-t border-edge" {...props} />
          ),
          a: ({ _node, ...props }) => (
            <a
              className="text-primary font-semibold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
