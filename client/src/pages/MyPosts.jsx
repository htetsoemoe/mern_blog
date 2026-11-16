import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, PenLine, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { dateLabel, errorMessage } from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useResource } from '../hooks/useResource';
import {
  Button,
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHeading,
  Picture,
} from '../components/ui';

export default function MyPosts() {
  const { user, expired } = useSession();
  const posts = useResource(`/posts/users/${user.id}`);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const show = useNotice((state) => state.show);
  async function remove() {
    if (busy || expired) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/posts/${selected._id}`, { authenticated: true });
      setSelected(null);
      posts.retry();
      show('Story deleted.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Your writing space"
        title="My stories."
        description={`A collection of the things you’ve put into words, ${user.name}.`}
        action={
          <Link to="/write" className="button button-primary">
            <PenLine size={16} /> Write a story
          </Link>
        }
      />
      {posts.loading ? (
        <Loading label="Loading your stories…" />
      ) : posts.error ? (
        <ErrorBox message={posts.error} retry={posts.retry} />
      ) : !posts.data?.length ? (
        <Empty title="A fresh page is waiting">
          Your published stories will live here.
          <Link to="/write" className="button button-primary mt-6">
            Write your first story <ArrowUpRight size={16} />
          </Link>
        </Empty>
      ) : (
        <div className="manage-list">
          {posts.data.map((post) => (
            <article key={post._id} className="manage-row">
              <Link
                to={`/posts/${post._id}`}
                className="manage-cover"
                tabIndex={-1}
                aria-hidden="true"
              >
                <Picture filename={post.thumbnail} />
              </Link>
              <div className="manage-info">
                <Link
                  to={`/categories/${encodeURIComponent(post.category)}`}
                  className="category-label"
                >
                  {post.category}
                </Link>
                <h2>
                  <Link to={`/posts/${post._id}`}>{post.title}</Link>
                </h2>
                <p className="muted text-sm">
                  Published {dateLabel(post.createdAt)}
                </p>
              </div>
              <div className="manage-actions">
                <Link
                  to={`/posts/${post._id}/edit`}
                  className="button button-secondary"
                  aria-label={`Edit ${post.title}`}
                >
                  <PenLine size={15} />
                  Edit
                </Link>
                <button
                  type="button"
                  className="icon-button danger-icon"
                  disabled={expired}
                  onClick={() => {
                    setSelected(post);
                    setError('');
                  }}
                  aria-label={`Delete ${post.title}`}
                  title="Delete story"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal
        open={Boolean(selected)}
        title="Delete this story?"
        busy={busy}
        onClose={() => setSelected(null)}
        actions={
          <Button
            variant="danger"
            busy={busy}
            disabled={expired}
            onClick={remove}
          >
            Delete story
          </Button>
        }
      >
        <p>
          <strong>{selected?.title}</strong> will be permanently deleted,
          including its cover image. This cannot be undone.
        </p>
        <ErrorBox message={error} />
      </Modal>
    </>
  );
}
