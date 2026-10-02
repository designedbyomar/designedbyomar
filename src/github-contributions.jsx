import React from 'react';
import { AppIcon, ArrowUpRight } from './ui-icons.jsx';
import './github-contributions.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DISPLAYED_DAY_LABELS = new Set([1, 3, 5]);

const getMonthPlacements = (months, weeks) => {
  const placements = months.map((month) => {
    const containingWeek = weeks.findIndex((week, index) => (
      month.firstDay >= week.firstDay
      && (index === weeks.length - 1 || month.firstDay < weeks[index + 1].firstDay)
    ));
    return {
      ...month,
      startIndex: containingWeek === -1
        ? (month.firstDay < weeks[0]?.firstDay ? 0 : Math.max(weeks.length - 1, 0))
        : containingWeek,
    };
  });

  return placements.map((month, index) => {
    const nextDistinctMonth = placements.slice(index + 1).find(candidate => candidate.startIndex > month.startIndex);
    const nextMonthSharesWeek = placements[index + 1]?.startIndex === month.startIndex;
    const span = Math.max(1, (nextDistinctMonth?.startIndex ?? weeks.length) - month.startIndex);
    return { ...month, span, visible: !nextMonthSharesWeek && span > 1 };
  });
};

const formatDate = (date, options) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  ...options,
}).format(new Date(`${date}T00:00:00Z`));

const formatRange = range => `${formatDate(range.from, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})} to ${formatDate(range.to, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})}`;

const dayAriaLabel = day => `${day.count === 0 ? 'No' : day.count} contribution${day.count === 1 ? '' : 's'} on ${formatDate(day.date, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})}`;

const CalendarSkeleton = () => (
  <div className="github-contributions-skeleton" role="status" aria-label="Loading GitHub activity">
    <div className="github-contributions-skeleton-heading" />
    <div className="github-contributions-skeleton-grid" aria-hidden="true">
      {Array.from({ length: 84 }, (_, index) => <span key={index} />)}
    </div>
  </div>
);

const ContributionCalendar = ({ data }) => {
  const scrollRef = React.useRef(null);
  const columnTemplate = `32px repeat(${data.weeks.length}, var(--github-cell-size))`;
  const monthPlacements = getMonthPlacements(data.months, data.weeks);

  React.useLayoutEffect(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;
    scrollArea.scrollLeft = scrollArea.scrollWidth - scrollArea.clientWidth;
  }, [data]);

  return (
    <>
      <div
        ref={scrollRef}
        className="github-contributions-scroll"
        tabIndex="0"
        aria-label="GitHub contribution calendar. Scroll horizontally to explore the full year."
        data-github-calendar-scroll
      >
        <div className="github-contributions-calendar">
          <div className="github-contributions-months" style={{ gridTemplateColumns: columnTemplate }} aria-hidden="true">
            <span />
            {monthPlacements.filter(month => month.visible).map(month => (
              <span
                key={`${month.firstDay}-${month.name}`}
                data-month-first-day={month.firstDay}
                style={{ gridColumn: `${month.startIndex + 2} / span ${month.span}` }}
              >
                {month.name}
              </span>
            ))}
          </div>

          <div
            className="github-contributions-grid"
            role="table"
            aria-label={`${data.totalContributions.toLocaleString('en-US')} GitHub contributions from ${formatRange(data.range)}`}
          >
            {DAY_LABELS.map((label, weekday) => (
              <div
                key={label}
                className="github-contributions-row"
                role="row"
                style={{ gridTemplateColumns: columnTemplate }}
              >
                <span className="github-contributions-day-label" role="rowheader" aria-label={label}>
                  {DISPLAYED_DAY_LABELS.has(weekday) ? label : ''}
                </span>
                {data.weeks.map((week) => {
                  const day = week.days.find(candidate => candidate.weekday === weekday);
                  return day ? (
                    <span
                      key={day.date}
                      className="github-contributions-day"
                      data-date={day.date}
                      data-level={day.level}
                      role="cell"
                      aria-label={dayAriaLabel(day)}
                    />
                  ) : (
                    <span key={`${week.firstDay}-${weekday}`} className="github-contributions-day-placeholder" aria-hidden="true" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="github-contributions-meta">
        <span>{formatRange(data.range)}</span>
        <div className="github-contributions-legend" aria-label="Contribution intensity from less to more">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className="github-contributions-day" data-level={level} aria-hidden="true" />
          ))}
          <span>More</span>
        </div>
      </div>
    </>
  );
};

export const GitHubContributions = ({ profileUrl = 'https://github.com/designedbyomar' }) => {
  const [state, setState] = React.useState({ status: 'loading', data: null });

  React.useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch('/api/github-contributions', {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('GitHub activity request failed.');
        const data = await response.json();
        if (!Number.isInteger(data?.totalContributions) || !Array.isArray(data?.weeks) || !data?.range) {
          throw new Error('GitHub activity response was invalid.');
        }
        setState({ status: 'ready', data });
      } catch (error) {
        if (error.name !== 'AbortError') setState({ status: 'error', data: null });
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const resolvedProfileUrl = state.data?.profileUrl || profileUrl;
  const trackProfileClick = () => {
    if (window.trackAnalyticsEvent) {
      window.trackAnalyticsEvent('contact_click_github', {
        link_url: resolvedProfileUrl,
        section: 'at_a_glance_contributions',
      });
    }
  };

  return <GitHubActivity state={state} profileUrl={resolvedProfileUrl} onProfileClick={trackProfileClick} />;
};

// Presentation accepts fixtures without fetching or sending analytics.
export const GitHubActivity = ({ state, profileUrl, onProfileClick }) => {
  return (
    <div className="github-contributions" data-github-contributions>
      <div className="github-contributions-header">
        <div>
          <p className="github-contributions-eyebrow">GitHub activity</p>
          {state.status === 'ready' ? (
            <h3>{state.data.totalContributions.toLocaleString('en-US')} contributions in the last year</h3>
          ) : state.status === 'error' ? (
            <h3>GitHub activity is temporarily unavailable.</h3>
          ) : (
            <h3 className="github-contributions-visually-hidden">Loading GitHub activity</h3>
          )}
        </div>
        <a
          href={state.data?.profileUrl || profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="github-contributions-link"
          onClick={onProfileClick}
        >
          View GitHub profile <AppIcon icon={ArrowUpRight} size={15} />
        </a>
      </div>

      {state.status === 'loading' && <CalendarSkeleton />}
      {state.status === 'ready' && <ContributionCalendar data={state.data} />}
      {state.status === 'error' && (
        <p className="github-contributions-error" role="status">
          The live calendar could not load. The public profile is still available.
        </p>
      )}
    </div>
  );
};
