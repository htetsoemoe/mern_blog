import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { errorMessage, safeReturn } from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useForm } from '../hooks/useForm';
import { Button, ErrorBox, Field } from '../components/ui';

export default function Auth({ register = false, compact = false, onSuccess }) {
  const form = useForm({ name: '', email: '', password: '', password2: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const login = useSession((state) => state.login);
  const show = useNotice((state) => state.show);
  const navigate = useNavigate();
  const location = useLocation();
  const from = safeReturn(location.state?.from);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const { name, email, password, password2 } = form.values;
    const errors = {
      ...(register && !name.trim() ? { name: 'Enter your name.' } : {}),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? { email: 'Enter a valid email address.' }
        : {}),
      ...(!password
        ? { password: 'Enter your password.' }
        : register && password.trim().length < 6
          ? { password: 'Use at least 6 characters.' }
          : {}),
      ...(register && password !== password2
        ? { password2: 'Passwords must match.' }
        : {}),
    };
    if (!form.validate(errors, event.currentTarget)) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(
        register ? '/users/register' : '/users/login',
        {
          ...(register ? { name: name.trim(), password2 } : {}),
          email: email.trim().toLowerCase(),
          password,
        },
      );
      if (register) {
        show('Account created. Sign in to start writing.');
        navigate('/login', { replace: true, state: { from } });
      } else {
        login(data);
        show('You’re signed in. Welcome back.');
        if (compact) onSuccess?.();
        else navigate(from, { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={compact ? 'auth-compact' : 'auth-layout'}>
      {!compact && (
        <aside className="auth-aside">
          <span className="eyebrow">A little space. A new perspective.</span>
          <h1>
            {register ? (
              <>
                Your story
                <br />
                belongs here.
              </>
            ) : (
              <>
                A good place
                <br />
                to come back to.
              </>
            )}
          </h1>
          <p>
            For the ideas you keep returning to.
            <br />
            And the ones you haven't discovered yet.
          </p>
          <span className="auth-art" aria-hidden="true">
            c.
          </span>
          <p className="aside-caption">Read thoughtfully. Write freely.</p>
        </aside>
      )}
      <section className="auth-form">
        {!compact && (
          <>
            <p className="eyebrow">
              {register ? 'Join Commonplace' : 'Welcome back'}
            </p>
            <h2>
              {register ? 'Make yourself at home.' : 'Sign in to your space.'}
            </h2>
            <p className="muted">
              {register
                ? 'A name, an email, and a world of possibilities.'
                : 'Pick up where your curiosity left off.'}
            </p>
          </>
        )}
        <form noValidate onSubmit={submit}>
          <fieldset disabled={busy}>
            {register && (
              <Field
                label="Your name"
                autoComplete="name"
                {...form.bind('name')}
              />
            )}
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              {...form.bind('email')}
            />
            <Field
              label="Password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              help={register ? 'At least 6 characters.' : undefined}
              {...form.bind('password')}
            />
            {register && (
              <Field
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                {...form.bind('password2')}
              />
            )}
          </fieldset>
          <ErrorBox message={error} />
          <Button type="submit" busy={busy} className="w-full">
            {register ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
          </Button>
        </form>
        {!compact && (
          <p className="auth-switch">
            {register ? 'Already part of the community?' : 'New around here?'}{' '}
            <Link
              to={register ? '/login' : '/register'}
              state={{ from }}
              className="text-link"
            >
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
