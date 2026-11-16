import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import {
  Avatar,
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
} from '../components/ui';
import PostCard from '../components/PostCard';

export function Authors() {
  const { data, loading, error, retry } = useResource('/users');
  return (
    <>
      <PageHeading
        eyebrow="The people behind the words"
        title="Different voices. Shared curiosity."
        description="Meet the writers making this space their own."
      />
      {loading ? (
        <Loading label="Loading authors…" />
      ) : error ? (
        <ErrorBox message={error} retry={retry} />
      ) : !data?.length ? (
        <Empty title="A community starts with a voice">
          Create an account and share yours.
        </Empty>
      ) : (
        <div className="authors-grid">
          {data.map((author) => (
            <Link
              key={author._id}
              to={`/authors/${author._id}`}
              className="author-tile"
            >
              <Avatar user={author} size="large" />
              <h2>{author.name}</h2>
              <span>
                {author.posts || 0}{' '}
                {(author.posts || 0) === 1 ? 'story' : 'stories'}
              </span>
              <span className="text-link">
                View stories <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function Author() {
  const { id } = useParams();
  const author = useResource(`/users/${id}`);
  const posts = useResource(`/posts/users/${id}`);
  if (author.loading) return <Loading label="Loading author…" />;
  if (author.error)
    return <ErrorBox message={author.error} retry={author.retry} />;
  return (
    <>
      <Link to="/authors" className="back-link">
        ← All authors
      </Link>
      <section className="author-profile">
        <Avatar user={author.data} size="large" />
        <p className="eyebrow">Author</p>
        <h1>{author.data.name}</h1>
        <p>
          {author.data.posts || 0}{' '}
          {(author.data.posts || 0) === 1 ? 'story' : 'stories'} shared on
          Commonplace
        </p>
      </section>
      <div className="section-heading">
        <h2>Stories by {author.data.name}</h2>
      </div>
      {posts.loading ? (
        <Loading />
      ) : posts.error ? (
        <ErrorBox message={posts.error} retry={posts.retry} />
      ) : !posts.data?.length ? (
        <Empty title="The story is still unfolding">
          This author hasn't published any stories yet.
        </Empty>
      ) : (
        <div className="post-grid">
          {posts.data.map((post) => (
            <PostCard key={post._id} post={post} author={author.data} />
          ))}
        </div>
      )}
    </>
  );
}
