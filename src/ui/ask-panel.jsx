import { Button, LinkButton } from './controls.jsx';
import React from 'react';
import { AppIcon, ArrowUpRight, Check, Copy } from '../ui-icons.jsx';
import { tokenizeAnswer, mentionedStudyIds } from '../ask-links.mjs';
const ASK_COLLAPSED_SUGGESTIONS = 3;
const ANSWER_PARAGRAPH_STYLE = { margin: 0, fontSize: 'var(--font-size-body-md)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-secondary)', maxWidth: 'var(--content-answer-width)' };
const ANSWER_LINK_STYLE = { color: 'var(--fg-primary)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: 'color-mix(in srgb, var(--fg-primary) 40%, transparent)' };
const ASK_RESPONSE_MIN_HEIGHT = 'var(--ask-response-min-height)';
const ASK_RESPONSE_CARD_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  minHeight: ASK_RESPONSE_MIN_HEIGHT,
  padding: 'var(--space-5) var(--space-6)',
  borderRadius: 'var(--radius-comfort)',
  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-gray-100) 72%, transparent)',
};

export const AnswerBody = ({ text, citedIds = [], answerId, studies, onEvent = () => {} }) => {
  const remaining = new Set(citedIds);
  return (text ?? '').split('\n\n').map((paragraph, i) => {
    const tokens = tokenizeAnswer(paragraph, studies, [...remaining]);
    for (const token of tokens) if (token.type === 'link') remaining.delete(token.id);
    return (
      <p key={i} style={ANSWER_PARAGRAPH_STYLE}>
        {tokens.map((token, j) => (token.type === 'link'
          ? (
            <LinkButton variant="ask"
              key={j}
              href={token.href}
              onClick={() => onEvent('ask_inline_link_click', { answer_id: answerId, case_study_id: token.id })}
              style={ANSWER_LINK_STYLE}
            >
              {token.value}
            </LinkButton>
          )
          : <React.Fragment key={j}>{token.value}</React.Fragment>))}
      </p>
    );
  });
};

export const AskPanel = ({ query, setQuery, submit, canSubmit, prefersReducedMotion, result, linkable,
  copyState, copyLink, phase, drafted, missed, suggestions, showingFollowUps, collapsible,
  suggestionsExpanded, setSuggestionsExpanded, focusRevealedRef, fullSet, show, sentinelRef,
  suggestionListRef, studies, onEvent = () => {}, idPrefix = '' }) => {
  const sourcesFor = (answer) => (answer.sources ?? [])
    .map(id => studies.find(c => c.id === id))
    .filter(Boolean);
  const responseActive = Boolean(result || phase || drafted || missed);

  return (
    <div ref={sentinelRef} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
    }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {/*
          The wrapper carries the gradient ring. An input is a replaced element
          and cannot host ::before/::after, so the ring has nowhere to live
          without it — see .ask-field in index.html.
        */}
        {/* 200px, not 260: at 375 the wider basis pushed the Ask button onto
            its own line, where it sat orphaned under a full-width field. */}
        <div className="ask-field" style={{ flex: '1 1 200px', minWidth: 0, display: 'flex' }}>
          <input
            type="text"
            aria-label="Ask a question about Omar's work"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask about a project, a skill, a role…"
            autoComplete="off"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              minHeight: 'var(--control-hit-area)',
              padding: 'var(--control-padding-block) var(--control-padding-inline)',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-body-md)',
              color: 'var(--fg-primary)',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-standard)',
            }}
          />
        </div>
        {/* Disabled and primary both match .ds-button in design-system-page.css. */}
        <Button variant="ask" type="submit" disabled={!canSubmit} style={{
          minHeight: 'var(--control-hit-area)',
          padding: 'var(--control-padding-block) var(--control-padding-roomy)',
          fontFamily: 'inherit',
          fontSize: 'var(--font-size-body-md)',
          fontWeight: 'var(--font-weight-medium)',
          color: canSubmit ? 'var(--bg-page)' : 'var(--fg-disabled)',
          background: canSubmit ? 'var(--fg-primary)' : 'var(--bg-subtle)',
          opacity: canSubmit ? 1 : 0.72,
          border: 'none',
          borderRadius: 'var(--radius-standard)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: prefersReducedMotion ? 'none' : 'opacity var(--duration-fast)',
        }}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = 'var(--opacity-control-hover)'; }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.opacity = '1'; }}
        >
          Ask
        </Button>
      </form>

      {/*
        Directly under the input, because this is what a visitor wants to know
        at the moment they are about to type — not after scrolling past an
        answer. Both tiers still stated: written and reviewed, or drafted and
        labelled.
      */}
      <p style={{ margin: 0, fontSize: 'var(--font-size-body-sm)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-tertiary)', maxWidth: 'var(--content-answer-width)' }}>
        Written and reviewed in advance. When published work supports something new, a drafted reply is clearly labelled.
      </p>

      <div
        aria-live="polite"
        data-ask-response-region="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          minHeight: responseActive ? ASK_RESPONSE_MIN_HEIGHT : 0,
        }}
      >
        {result && (
          <div style={ASK_RESPONSE_CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-medium)', lineHeight: 'var(--line-height-snug)', color: 'var(--fg-primary)' }}>
                {result.question}
              </p>
              {linkable && (
                <Button variant="ask"
                  type="button"
                  data-ask-share="true"
                  onClick={() => copyLink(result)}
                  aria-label={{
                    copied: 'Link copied',
                    failed: 'Copying failed — the link is in the address bar',
                  }[copyState] ?? 'Copy a link to this answer'}
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    minHeight: 'var(--control-hit-area)',
                    padding: 'var(--control-padding-block) var(--control-padding-inline)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--font-size-body-sm)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-label)',
                    color: copyState === 'copied' ? 'var(--color-develop-blue)' : 'var(--fg-tertiary)',
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
                    borderRadius: 'var(--radius-standard)',
                    cursor: 'pointer',
                    transition: prefersReducedMotion ? 'none' : 'color var(--duration-fast)',
                  }}
                >
                  <AppIcon icon={copyState === 'copied' ? Check : Copy} size={13} />
                  {{ copied: 'Copied', failed: 'Use the address bar' }[copyState] ?? 'Copy link'}
                </Button>
              )}
            </div>
            <AnswerBody studies={studies} onEvent={onEvent} text={result.answer} citedIds={result.sources ?? []} answerId={result.id} />
            {sourcesFor(result).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {sourcesFor(result).map(caseStudy => (
                  <LinkButton variant="ask" key={caseStudy.id} href={`/work/${caseStudy.id}/`} onClick={() => onEvent('ask_citation_click', { answer_id: result.id, case_study_id: caseStudy.id })} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    minHeight: 'var(--control-hit-area)',
                    padding: 'var(--control-padding-block) var(--control-padding-inline)',
                    fontSize: 'var(--font-size-body-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--fg-primary)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-standard)',
                    boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
                  }}>
                    {caseStudy.title}
                    <AppIcon icon={ArrowUpRight} size={12} />
                  </LinkButton>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'looking' && (
          <div data-ask-state="loading" style={{ ...ASK_RESPONSE_CARD_STYLE, justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-body-md)', color: 'var(--fg-tertiary)' }}>
              Looking for a written answer…
            </p>
          </div>
        )}

        {phase === 'drafting' && !drafted && (
          <div data-ask-state="loading" style={{ ...ASK_RESPONSE_CARD_STYLE, justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-body-md)', color: 'var(--fg-tertiary)' }}>
              Nothing written covers that one — drafting from relevant published work…
            </p>
          </div>
        )}

        {drafted && (() => {
          // The chips and the inline links must cite the same studies. The chips
          // show at most three, so the inline linker is given exactly that set —
          // otherwise a fourth cited study could be linked in the prose with no
          // matching chip beneath it.
          const visibleSourceIds = phase === 'drafting'
            ? []
            : mentionedStudyIds(drafted.text, studies, drafted.sources ?? []);
          const citedStudies = visibleSourceIds
            .map(id => studies.find(c => c.id === id))
            .filter(Boolean)
            .slice(0, 3);
          return (
          <div style={ASK_RESPONSE_CARD_STYLE}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-body-sm)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-label)',
              color: 'var(--fg-tertiary)',
            }}>
              Drafted, not reviewed
            </div>
            <AnswerBody studies={studies} onEvent={onEvent} text={drafted.text} citedIds={citedStudies.map(c => c.id)} answerId="drafted" />
            <p style={{ margin: 0, fontSize: 'var(--font-size-body-sm)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-tertiary)', maxWidth: 'var(--content-answer-width)' }}>
              There is no written answer to that question, so this was drafted from relevant published
              work and has not been reviewed. For anything that matters, email Omar.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {citedStudies
                .map(caseStudy => (
                  <LinkButton variant="ask" key={caseStudy.id} href={`/work/${caseStudy.id}/`} onClick={() => onEvent('ask_citation_click', { answer_id: 'drafted', case_study_id: caseStudy.id })} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minHeight: 'var(--control-hit-area)',
                    padding: 'var(--control-padding-block) var(--control-padding-inline)', fontSize: 'var(--font-size-body-sm)', fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--fg-primary)', textDecoration: 'none', borderRadius: 'var(--radius-standard)',
                    boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
                  }}>
                    {caseStudy.title}
                    <AppIcon icon={ArrowUpRight} size={12} />
                  </LinkButton>
                ))}
              <LinkButton variant="ask" href="mailto:omar@designedbyomar.com" onClick={() => onEvent('ask_contact_click', { question: query.trim() })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minHeight: 'var(--control-hit-area)',
                padding: 'var(--control-padding-block) var(--control-padding-inline)', fontSize: 'var(--font-size-body-sm)', fontWeight: 'var(--font-weight-medium)',
                color: 'var(--fg-primary)', textDecoration: 'none', borderRadius: 'var(--radius-standard)',
                boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
              }}>
                Email Omar
                <AppIcon icon={ArrowUpRight} size={12} />
              </LinkButton>
            </div>
          </div>
          );
        })()}

        {missed && (
          <div style={{ ...ASK_RESPONSE_CARD_STYLE, gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-body-md)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-secondary)', maxWidth: 'var(--content-answer-width)' }}>
              I couldn&apos;t safely match that to a reviewed answer or clearly relevant published work. Rather than guess, email is the faster route.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <LinkButton variant="ask" href="mailto:omar@designedbyomar.com" onClick={() => onEvent('ask_contact_click', { question: query.trim() })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minHeight: 'var(--control-hit-area)',
                padding: 'var(--control-padding-block) var(--control-padding-inline)', fontSize: 'var(--font-size-body-sm)', fontWeight: 'var(--font-weight-medium)',
                color: 'var(--fg-primary)', textDecoration: 'none', borderRadius: 'var(--radius-standard)',
                boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
              }}>
                Email Omar
                <AppIcon icon={ArrowUpRight} size={12} />
              </LinkButton>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
        {showingFollowUps ? 'Related' : 'Try one of these'}
      </div>

      <div id={`${idPrefix}ask-suggestions`} ref={suggestionListRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {suggestions.map(answer => (
          <Button variant="ask"
            key={answer.id}
            type="button"
            data-ask-suggestion="true"
            onClick={() => {
              onEvent('ask_suggested_click', {
                answer_id: answer.id,
                context: showingFollowUps ? 'related' : 'opening',
              });
              setQuery('');
              show(answer);
            }}
            style={{
              minHeight: 'var(--control-hit-area)',
              padding: 'var(--control-padding-block) var(--control-padding-inline)',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-body-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--fg-secondary)',
              background: 'transparent',
              border: 'none',
              boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
              borderRadius: 'var(--radius-standard)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: prefersReducedMotion ? 'none' : 'background var(--duration-fast), color var(--duration-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--fg-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-secondary)'; }}
          >
            {answer.question}
          </Button>
        ))}
      </div>

      {collapsible && (
        <Button variant="ask"
          type="button"
          data-ask-expand="true"
          aria-expanded={suggestionsExpanded}
          aria-controls={`${idPrefix}ask-suggestions`}
          onClick={() => {
            // The revealed prompts are inserted *before* this control, so a
            // keyboard user's next Tab would move past everything they just
            // asked for. Focus follows the disclosure instead.
            if (!suggestionsExpanded) {
              focusRevealedRef.current = true;
              onEvent('ask_suggestions_expand', { shown: fullSet.length });
            }
            setSuggestionsExpanded(open => !open);
          }}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            minHeight: 'var(--control-hit-area)',
            padding: 'var(--control-padding-block) var(--space-1)',
            fontFamily: 'inherit',
            fontSize: 'var(--font-size-body-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--fg-tertiary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: prefersReducedMotion ? 'none' : 'color var(--duration-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-tertiary)'}
        >
          {suggestionsExpanded ? 'Fewer questions' : `More questions (${fullSet.length - ASK_COLLAPSED_SUGGESTIONS})`}
        </Button>
      )}
    </div>
  );
};
