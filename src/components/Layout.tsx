import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { vi } from '../i18n/vi';
import { usePrefs } from '../storage/prefs';
import { Icon, type IconName } from './Icon';
import { UpdateBanner } from './UpdateBanner';

const NAV: { to: string; label: string; icon: IconName; also?: string[] }[] = [
  { to: '/', label: vi.nav.home, icon: 'home', also: ['/daily', '/review', '/progress', '/settings', '/phrases'] },
  { to: '/pinyin', label: vi.nav.pinyin, icon: 'music' },
  { to: '/words', label: vi.nav.words, icon: 'cards' },
  { to: '/hanzi', label: vi.nav.hanzi, icon: 'pen' },
  { to: '/games', label: vi.nav.games, icon: 'gamepad' },
];

function isActive(path: string, item: (typeof NAV)[number]): boolean {
  const match = (p: string) => (p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`));
  return match(item.to) || (item.also ?? []).some(match);
}

export function Layout() {
  const { pathname } = useLocation();
  const prefs = usePrefs();
  const mainRef = useRef<HTMLElement>(null);

  // Only .main scrolls: reset it on navigation.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    document.title = vi.seo.titles[pathname] ?? `${vi.appName} · ${vi.tagline}`;
  }, [pathname]);

  return (
    <div className={`app${prefs.learner === 'kid' ? ' app--kid' : ''}`}>
      <header className="topbar">
        <Link to="/" className="brand" aria-label={vi.appName}>
          <span className="brand-seal" lang="zh-CN" aria-hidden>
            {vi.appNameZh.map((ch, i) => (
              <span key={i} className={i === 1 ? 'brand-accent' : undefined}>
                {ch}
              </span>
            ))}
          </span>
          <span className="brand-latin">{vi.appName}</span>
        </Link>
        <div className="topbar-actions">
          <NavLink to="/progress" className="icon-btn" aria-label={vi.nav.progress} title={vi.nav.progress}>
            <Icon name="chart" />
          </NavLink>
          <NavLink to="/settings" className="icon-btn" aria-label={vi.nav.settings} title={vi.nav.settings}>
            <Icon name="settings" />
          </NavLink>
        </div>
      </header>
      <UpdateBanner />
      <main className="main" ref={mainRef}>
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Menu">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link key={item.to} to={item.to} className={`nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Page header with a back link. */
export function PageHeader({ title, back, children }: { title: string; back?: string; children?: React.ReactNode }) {
  return (
    <header className="page-header stack-xs">
      {back && (
        <Link to={back} className="back-link">
          <Icon name="arrowLeft" size={18} />
          {vi.nav.back}
        </Link>
      )}
      <h1>{title}</h1>
      {children}
    </header>
  );
}
