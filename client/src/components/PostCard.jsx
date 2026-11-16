import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Avatar, Picture } from './ui';
import { dateLabel, plainText } from '../lib/utils';

export default function PostCard({ post, author, featured = false }) {
  return (
    <article className={`post-card ${featured ? 'featured-card' : ''}`}>
      <Link
        to={`/posts/${post._id}`}
        className="post-image-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Picture
          filename={post.thumbnail}
          className="post-image"
          loading={featured ? 'eager' : 'lazy'}
        />
      </Link>
      <div className="post-card-content">
        <div className="post-meta">
          <Link
            to={`/categories/${encodeURIComponent(post.category)}`}
            className="category-label"
          >
            {post.category}
          </Link>
          <span>{dateLabel(post.createdAt)}</span>
        </div>
        <h2>
          <Link to={`/posts/${post._id}`}>
            {post.title}
            <ArrowUpRight aria-hidden="true" size={featured ? 26 : 19} />
          </Link>
        </h2>
        <p className="post-excerpt">{plainText(post.description)}</p>
        <div className="card-bottom">
          <Link
            to={`/authors/${typeof post.creator === 'object' ? post.creator._id : post.creator}`}
            className="author-byline"
          >
            <Avatar user={author} size="small" />
            <span>{author?.name || 'View author'}</span>
          </Link>
          {featured && (
            <Link to={`/posts/${post._id}`} className="text-link">
              Read story <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
