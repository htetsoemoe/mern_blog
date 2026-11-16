import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { CATEGORIES } from '../lib/utils';
import { Empty, ErrorBox, Loading, PageHeading } from '../components/ui';
import PostCard from '../components/PostCard';

export default function Stories() {
  const { category } = useParams();
  const valid = !category || CATEGORIES.includes(category);
  const posts = useResource(
    valid
      ? category
        ? `/posts/categories/${encodeURIComponent(category)}`
        : '/posts'
      : null,
  );
  const authors = useResource('/users');
  const authorMap = Object.fromEntries(
    (authors.data || []).map((author) => [author._id, author]),
  );
  const findAuthor = (post) =>
    authorMap[
      typeof post.creator === 'object' ? post.creator?._id : post.creator
    ];
  return (
    <>
      {category ? (
        <PageHeading
          eyebrow="Explore a topic"
          title={category}
          description="Fresh perspectives, one story at a time."
        />
      ) : (
        <section className="home-intro">
          <div>
            <p className="eyebrow">
              <span className="small-line" /> A place for your perspective
            </p>
            <h1>
              Good stories.
              <br />
              <span>New ways of seeing.</span>
            </h1>
          </div>
          <p>
            Ideas that stay with you. <br />
            Stories from people with something to share.
            <br />
            <Link to="/authors" className="text-link mt-5">
              Meet the voices behind them <ArrowRight size={16} />
            </Link>
          </p>
        </section>
      )}
      <nav className="category-nav" aria-label="Story categories">
        <Link to="/" aria-current={!category ? 'page' : undefined}>
          All stories
        </Link>
        {CATEGORIES.map((item) => (
          <Link
            key={item}
            to={`/categories/${encodeURIComponent(item)}`}
            aria-current={category === item ? 'page' : undefined}
          >
            {item}
          </Link>
        ))}
      </nav>
      {!valid ? (
        <Empty title="Topic not found">
          Choose one of the categories above.
        </Empty>
      ) : posts.loading ? (
        <Loading label="Finding the latest stories…" />
      ) : posts.error ? (
        <ErrorBox message={posts.error} retry={posts.retry} />
      ) : !posts.data?.length ? (
        <Empty title="The next story could be yours">
          There are no stories here yet.
          <Link to="/write" className="button button-primary mt-6">
            Write a story <ArrowRight size={16} />
          </Link>
        </Empty>
      ) : (
        <>
          {!category && (
            <>
              <div className="section-label">
                <span>The latest perspective</span>
                <span>Take a moment. Read something new.</span>
              </div>
              <PostCard
                post={posts.data[0]}
                author={findAuthor(posts.data[0])}
                featured
              />
            </>
          )}
          {(category ? posts.data : posts.data.slice(1)).length > 0 && (
            <section className="stories-section" aria-label="Stories">
              <div className="section-heading">
                <h2>
                  {category ? 'Stories in this topic' : 'More to discover'}
                </h2>
                <span>
                  {(category ? posts.data : posts.data.slice(1)).length}{' '}
                  {(category ? posts.data : posts.data.slice(1)).length === 1
                    ? 'story'
                    : 'stories'}
                </span>
              </div>
              <div className="post-grid">
                {(category ? posts.data : posts.data.slice(1)).map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    author={findAuthor(post)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {!category && (
        <section className="writing-invitation">
          <div>
            <p className="eyebrow">Every perspective matters</p>
            <h2>Something on your mind?</h2>
            <p>Give it a little space. Share it with the world.</p>
          </div>
          <Link to="/write" className="button button-primary">
            Write your first story <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </>
  );
}
