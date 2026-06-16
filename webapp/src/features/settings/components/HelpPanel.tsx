'use client';

import { useState } from 'react';
import { ChevronDown, Mail, FileText, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PanelHeader } from './PanelHeader';

interface HelpPanelProps {
  readonly onBack: () => void;
}

const SUPPORT_EMAIL = 'support@chatify.app';

const FAQS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'How do I start a chat?',
    a: 'Tap the + button in the sidebar, search someone by name or @username, and open the conversation. No request to accept — you can message anyone who allows it.',
  },
  {
    q: 'How do I share a photo?',
    a: 'Open a chat and tap the photo icon next to the message box. Pick an image and it uploads and sends. Tap any photo in a chat to view it full screen.',
  },
  {
    q: 'Who can message me?',
    a: 'Control this in Settings → Privacy. Choose Everyone, Verified users, Friends of friends, or Nobody.',
  },
  {
    q: 'How do I block someone?',
    a: 'Open the chat and tap the block icon in the header. Blocking removes the conversation and stops new messages from that person.',
  },
];

/** Help section: FAQ accordion, contact, and legal links. */
export function HelpPanel({ onBack }: HelpPanelProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col max-h-[85vh]">
      <PanelHeader title="Help" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* FAQ */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Frequently asked
          </h3>
          <div className="space-y-2">
            {FAQS.map((item, i) => {
              const expanded = open === i;
              return (
                <div key={item.q} className="rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : i)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left hover:bg-accent/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground shrink-0 transition-transform',
                        expanded && 'rotate-180',
                      )}
                    />
                  </button>
                  {expanded ? (
                    <p className="px-3.5 pb-3 text-xs text-muted-foreground leading-relaxed">
                      {item.a}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact + legal */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            More
          </h3>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-border hover:bg-accent/40 transition-colors"
          >
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">Contact us</div>
              <div className="text-xs text-muted-foreground truncate">{SUPPORT_EMAIL}</div>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-border hover:bg-accent/40 transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">Terms of Service</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-border hover:bg-accent/40 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">Privacy Policy</span>
          </a>
        </section>

        <p className="text-center text-[11px] text-muted-foreground/70 pt-2">
          Chatify · version 1.0.0
        </p>
      </div>
    </div>
  );
}
