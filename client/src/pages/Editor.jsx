import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { postBody } from '../lib/payloads';
import {
  CATEGORIES,
  errorMessage,
  THUMBNAIL_LIMIT,
  validateImage,
} from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useResource } from '../hooks/useResource';
import { useForm } from '../hooks/useForm';
import {
  Button,
  Empty,
  ErrorBox,
  Field,
  ImageUpload,
  Loading,
  PageHeading,
  UnsavedChanges,
  UploadProgress,
} from '../components/ui';

export default function Editor() {
  const { id } = useParams();
  const post = useResource(id ? `/posts/${id}` : null);
  if (id && post.loading) return <Loading label="Loading your story…" />;
  if (id && post.error)
    return <ErrorBox message={post.error} retry={post.retry} />;
  return <EditorForm key={id || 'new'} post={post.data} />;
}

function EditorForm({ post }) {
  const { user, expired } = useSession();
  const initial = {
    title: post?.title || '',
    category: post?.category || 'Uncategorized',
    description: post?.description || '',
  };
  const form = useForm(initial);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const abortRef = useRef(null);
  const navigate = useNavigate();
  const show = useNotice((state) => state.show);
  const dirty =
    !saved &&
    (Boolean(file) ||
      Object.keys(initial).some((key) => form.values[key] !== initial[key]));
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (saved) navigate('/my-posts');
  }, [saved, navigate]);
  const creator =
    typeof post?.creator === 'object' ? post.creator?._id : post?.creator;
  if (post && creator !== user.id)
    return (
      <Empty title="This story belongs to another author">
        You can only edit your own stories.
        <Link to="/my-posts" className="button button-secondary mt-6">
          Go to my posts
        </Link>
      </Empty>
    );
  async function submit(event) {
    event.preventDefault();
    if (busy || expired) return;
    const { title, category, description } = form.values;
    const errors = {
      ...(!title.trim() ? { title: 'Give your story a title.' } : {}),
      ...(!CATEGORIES.includes(category)
        ? { category: 'Choose a supported category.' }
        : {}),
      ...(description.trim().length < 12
        ? { description: 'Write at least 12 characters.' }
        : {}),
      ...((file || !post) && validateImage(file, THUMBNAIL_LIMIT)
        ? { thumbnail: validateImage(file, THUMBNAIL_LIMIT) }
        : {}),
    };
    if (!form.validate(errors, event.currentTarget)) return;
    setBusy(true);
    setError('');
    setProgress(0);
    abortRef.current = new AbortController();
    try {
      const config = {
        authenticated: true,
        signal: abortRef.current.signal,
        onUploadProgress: (event) => {
          if (event.total)
            setProgress(Math.round((event.loaded / event.total) * 100));
        },
      };
      if (post)
        await api.patch(
          `/posts/${post._id}`,
          postBody(form.values, file),
          config,
        );
      else await api.post('/posts', postBody(form.values, file), config);
      show(post ? 'Your story has been updated.' : 'Your story is published.');
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <UnsavedChanges dirty={dirty || busy} />
      <Link to="/my-posts" className="back-link">
        ← My posts
      </Link>
      <PageHeading
        eyebrow={post ? 'Make it your own' : 'A fresh page'}
        title={post ? 'Refine your story.' : 'What’s your perspective?'}
        description="A small observation. A big idea. Start with what matters to you."
      />
      <form className="editor-layout" noValidate onSubmit={submit}>
        <div className="editor-main">
          <fieldset disabled={busy}>
            <Field
              label="Story title"
              placeholder="A title that opens a conversation"
              {...form.bind('title')}
            />
            <Field
              label="Your story"
              multiline
              rows={18}
              placeholder="There’s a story in the way you see the world…"
              help="Plain text is welcome. Existing HTML content is preserved and safely rendered on the reading page."
              {...form.bind('description')}
            />
          </fieldset>
          <ErrorBox message={error} />
        </div>
        <aside className="editor-sidebar">
          <h2>The finishing touches</h2>
          <fieldset disabled={busy}>
            <Field
              label="Category"
              id="category"
              name="category"
              error={form.errors.category}
            >
              <select
                id="category"
                className="input"
                aria-invalid={Boolean(form.errors.category)}
                aria-describedby={
                  form.errors.category ? 'category-error' : undefined
                }
                {...form.bind('category')}
                error={undefined}
              >
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <ImageUpload
              label="Cover image"
              name="thumbnail"
              file={file}
              onChange={(value) => {
                setFile(value);
                form.setErrors((old) => ({ ...old, thumbnail: '' }));
              }}
              existing={post?.thumbnail}
              limit={THUMBNAIL_LIMIT}
              error={form.errors.thumbnail}
              disabled={busy}
            />
          </fieldset>
          {busy && file && (
            <UploadProgress
              progress={progress}
              onCancel={() => abortRef.current?.abort()}
            />
          )}
          <p className="field-help mb-5">
            {post
              ? 'Save your changes to update the published story.'
              : 'Publishing makes your story visible to everyone.'}
          </p>
          <Button
            type="submit"
            busy={busy}
            disabled={expired}
            className="w-full"
          >
            {post ? 'Save changes' : 'Publish story'} <ArrowUpRight size={16} />
          </Button>
          <Link to="/my-posts" className="button button-ghost w-full mt-2">
            Cancel
          </Link>
        </aside>
      </form>
    </>
  );
}
