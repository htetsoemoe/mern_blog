import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { PenLine } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { useSession } from '../stores/session';
import { dateLabel } from '../lib/utils';
import { Avatar, ErrorBox, Loading, Picture } from '../components/ui';

export default function Post() {
  const { id } = useParams();
  const { user } = useSession();
  const post = useResource(`/posts/${id}`);
  const creator =
    typeof post.data?.creator === 'object'
      ? post.data.creator?._id
      : post.data?.creator;
  const author = useResource(creator ? `/users/${creator}` : null);
  if (post.loading) return <Loading label="Opening story…" />;
  if (post.error) return <ErrorBox message={post.error} retry={post.retry} />;
  const data = post.data;
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(data.description);
  return (
    <article className="article">
      <Link to="/" className="back-link">
        ← Back to stories
      </Link>
      <header className="article-header">
        <Link
          to={`/categories/${encodeURIComponent(data.category)}`}
          className="category-label"
        >
          {data.category}
        </Link>
        <h1>{data.title}</h1>
        <div className="article-byline">
          <Link className="author-byline" to={`/authors/${creator}`}>
            <Avatar user={author.data} />
            <span>
              {author.data?.name || 'View author'}
              <small>{dateLabel(data.createdAt)}</small>
            </span>
          </Link>
          {user?.id === creator && (
            <Link to={`/posts/${id}/edit`} className="button button-secondary">
              <PenLine size={15} /> Edit story
            </Link>
          )}
        </div>
      </header>
      <Picture
        filename={data.thumbnail}
        alt={`Cover for ${data.title}`}
        className="article-cover"
      />
      {isHtml ? (
        <div
          className="article-body"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(data.description, {
              USE_PROFILES: { html: true },
              FORBID_TAGS: [
                'img',
                'form',
                'input',
                'button',
                'style',
                'iframe',
              ],
              FORBID_ATTR: ['style', 'id', 'name'],
            }),
          }}
        />
      ) : (
        <div className="article-body plain-body">{data.description}</div>
      )}
      <footer className="article-end">
        <span className="brand-symbol">c.</span>
        <p>Thanks for taking a moment to read.</p>
        <Link to={`/authors/${creator}`} className="text-link">
          More from {author.data?.name || 'this author'} →
        </Link>
      </footer>
    </article>
  );
}
