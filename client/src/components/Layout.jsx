import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, PenLine, X } from 'lucide-react';
import { useNotice, useSession } from '../stores/session';
import { Modal } from './ui';
import Auth from '../pages/Auth';

export default function Layout() {
  const { user, expired } = useSession();
  const { notice, dismiss } = useNotice();
  const location = useLocation();
  const [reauth, setReauth] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(dismiss, 7000);
    return () => clearTimeout(timeout);
  }, [notice, dismiss]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <Link to="/" className="wordmark" aria-label="Commonplace home">
            <span className="brand-symbol">c.</span> commonplace
            <span className="brand-dot">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Stories
            </NavLink>
            <NavLink to="/authors">Authors</NavLink>
            {user && <NavLink to="/my-posts">My posts</NavLink>}
          </nav>
          <div className="account-nav">
            {user ? (
              <>
                <NavLink to="/profile" className="profile-link">
                  Account
                </NavLink>
                <Link to="/logout" className="signout-link">
                  Sign out
                </Link>
              </>
            ) : (
              <Link to="/login" className="signin-link">
                Sign in
              </Link>
            )}
            <Link
              to={user ? '/write' : '/register'}
              className="button button-primary header-write"
              aria-label={user ? 'Write a story' : 'Start writing'}
            >
              <PenLine size={15} />
              <span>{user ? 'Write a story' : 'Start writing'}</span>
            </Link>
          </div>
        </div>
      </header>
      {expired && (
        <div className="session-banner" role="alert">
          Your session has expired.{' '}
          <button type="button" onClick={() => setReauth(true)}>
            Sign in again
          </button>{' '}
          to save changes. Your current form is still here.
        </div>
      )}
      <main id="main" className="shell main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <div>
            <Link to="/" className="footer-brand">
              commonplace.
            </Link>
            <p>A quiet space for a world of ideas.</p>
          </div>
          <div className="footer-links">
            <Link to="/">
              Explore stories <ArrowUpRight size={14} />
            </Link>
            <Link to="/authors">
              Meet the authors <ArrowUpRight size={14} />
            </Link>
          </div>
          <p className="footer-note">Read thoughtfully. Write freely.</p>
        </div>
      </footer>
      <div className="notice-region" aria-live="polite" aria-atomic="true">
        {notice && (
          <div className="notice">
            <CheckCircle2 size={18} />
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <Modal
        open={reauth}
        title="Sign in to continue"
        onClose={() => setReauth(false)}
      >
        <p>
          Sign in to the same account to continue editing without leaving this
          page.
        </p>
        {reauth && <Auth compact onSuccess={() => setReauth(false)} />}
      </Modal>
    </>
  );
}
