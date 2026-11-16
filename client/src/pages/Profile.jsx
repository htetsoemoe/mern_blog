import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import {
  AVATAR_LIMIT,
  errorMessage,
  safeUser,
  validateImage,
} from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useResource } from '../hooks/useResource';
import { useForm } from '../hooks/useForm';
import {
  Avatar,
  Button,
  ErrorBox,
  Field,
  ImageUpload,
  Loading,
  PageHeading,
  UnsavedChanges,
  UploadProgress,
} from '../components/ui';

export default function Profile() {
  const id = useSession((state) => state.user.id);
  const user = useResource(`/users/${id}`);
  if (user.loading) return <Loading label="Loading your account…" />;
  if (user.error) return <ErrorBox message={user.error} retry={user.retry} />;
  return <ProfileForm initialUser={safeUser(user.data)} />;
}

function ProfileForm({ initialUser }) {
  const [current, setCurrent] = useState(initialUser);
  const form = useForm({
    name: initialUser.name,
    email: initialUser.email,
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const { expired, updateUser } = useSession();
  const show = useNotice((state) => state.show);
  const dirty = Boolean(
    file ||
    form.values.name !== current.name ||
    form.values.email !== current.email ||
    form.values.currentPassword ||
    form.values.newPassword ||
    form.values.confirmNewPassword,
  );
  useEffect(() => () => abortRef.current?.abort(), []);
  async function changeAvatar(event) {
    event.preventDefault();
    if (busy || expired) return;
    const message = validateImage(file, AVATAR_LIMIT);
    if (message) {
      setError(message);
      return;
    }
    setBusy('avatar');
    setError('');
    setProgress(0);
    abortRef.current = new AbortController();
    const data = new FormData();
    data.append('avatar', file);
    try {
      const response = await api.post('/users/change-avatar', data, {
        authenticated: true,
        signal: abortRef.current.signal,
        onUploadProgress: (event) => {
          if (event.total)
            setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      const clean = safeUser(response.data);
      setCurrent(clean);
      updateUser(clean);
      setFile(null);
      show('Profile photo updated.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }
  async function save(event) {
    event.preventDefault();
    if (busy || expired) return;
    const value = form.values;
    const errors = {
      ...(!value.name.trim() ? { name: 'Enter your name.' } : {}),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
        ? { email: 'Enter a valid email address.' }
        : {}),
      ...(!value.currentPassword
        ? { currentPassword: 'Enter your current password.' }
        : {}),
      ...(value.newPassword.trim().length < 6
        ? { newPassword: 'Use at least 6 characters.' }
        : {}),
      ...(value.confirmNewPassword !== value.newPassword
        ? { confirmNewPassword: 'Passwords must match.' }
        : {}),
    };
    if (!form.validate(errors, event.currentTarget)) return;
    setBusy('profile');
    setError('');
    try {
      const { data } = await api.patch(
        '/users/edit-user',
        {
          ...value,
          name: value.name.trim(),
          email: value.email.trim().toLowerCase(),
        },
        { authenticated: true },
      );
      const clean = safeUser(data);
      setCurrent(clean);
      updateUser(clean);
      form.setValues({
        name: clean.name,
        email: clean.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      show('Account details updated.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <UnsavedChanges dirty={dirty || Boolean(busy)} />
      <PageHeading
        eyebrow="Your corner of Commonplace"
        title="Account settings."
        description="A familiar face. A name to put to your words."
      />
      <div className="profile-layout">
        <aside className="profile-photo">
          <Avatar user={current} size="large" />
          <h2>{current.name}</h2>
          <p className="muted">
            {current.posts} {current.posts === 1 ? 'story' : 'stories'}{' '}
            published
          </p>
          <form noValidate onSubmit={changeAvatar}>
            <ImageUpload
              label="Profile photo"
              name="avatar"
              file={file}
              onChange={setFile}
              limit={AVATAR_LIMIT}
              disabled={Boolean(busy)}
            />
            {busy === 'avatar' && (
              <UploadProgress
                progress={progress}
                onCancel={() => abortRef.current?.abort()}
              />
            )}
            <Button
              type="submit"
              variant="secondary"
              busy={busy === 'avatar'}
              disabled={!file || Boolean(busy) || expired}
              className="w-full"
            >
              Update photo
            </Button>
          </form>
        </aside>
        <section className="profile-details">
          <h2>Personal details & password</h2>
          <p className="muted mb-7">
            Updating your details also requires setting a password. Enter your
            current password to confirm the change.
          </p>
          <form noValidate onSubmit={save}>
            <fieldset disabled={Boolean(busy)}>
              <Field
                label="Your name"
                autoComplete="name"
                {...form.bind('name')}
              />
              <Field
                label="Email address"
                type="email"
                autoComplete="email"
                {...form.bind('email')}
              />
              <div className="form-divider" />
              <Field
                label="Current password"
                type="password"
                autoComplete="current-password"
                {...form.bind('currentPassword')}
              />
              <Field
                label="New password"
                type="password"
                autoComplete="new-password"
                help="At least 6 characters. You may reuse your current password."
                {...form.bind('newPassword')}
              />
              <Field
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                {...form.bind('confirmNewPassword')}
              />
            </fieldset>
            <Button
              type="submit"
              busy={busy === 'profile'}
              disabled={Boolean(busy) || expired}
            >
              Save account changes
            </Button>
          </form>
        </section>
      </div>
      <ErrorBox message={error} />
    </>
  );
}
