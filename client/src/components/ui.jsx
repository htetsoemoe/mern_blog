import { useEffect, useId, useRef, useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { ArrowRight, Check, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { imageUrl } from '../lib/api';
import { IMAGE_TYPES, validateImage } from '../lib/utils';

export function Button({
  children,
  busy,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
      aria-busy={busy || undefined}
    >
      <span className={busy ? 'invisible' : ''}>{children}</span>
      {busy && (
        <LoaderCircle
          className="button-spinner animate-spin"
          size={18}
          aria-label="Saving"
        />
      )}
    </button>
  );
}

export function Field({
  label,
  name,
  error,
  help,
  multiline,
  children,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const id = props.id || generatedId;
  const password = props.type === 'password';
  const inputProps = {
    ...props,
    name,
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : help ? `${id}-help` : undefined,
    className: `input ${password ? 'pr-20' : ''}`,
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        {children ||
          (multiline ? (
            <textarea {...inputProps} className="input resize-none" />
          ) : (
            <input
              {...inputProps}
              type={password && visible ? 'text' : props.type || 'text'}
            />
          ))}
        {password && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setVisible(!visible)}
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={visible}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="field-help">
            {help}
          </p>
        )
      )}
    </div>
  );
}

export function ErrorBox({ message, retry }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {retry && (
        <button type="button" className="text-link mt-2" onClick={retry}>
          Try again <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={23} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-mark" aria-hidden="true">
        c.
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Picture({ filename, alt = '', className = '', ...props }) {
  const [failed, setFailed] = useState('');
  return filename && failed !== filename ? (
    <img
      src={imageUrl(filename)}
      alt={alt}
      className={className}
      onError={() => setFailed(filename)}
      {...props}
    />
  ) : (
    <div
      className={`image-fallback ${className}`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      <span aria-hidden="true">c.</span>
    </div>
  );
}

export function Avatar({ user, size = 'normal' }) {
  return (
    <span className={`avatar avatar-${size}`}>
      {user?.avatar ? (
        <Picture filename={user.avatar} alt="" />
      ) : (
        (user?.name || 'A').slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  busy = false,
  actions,
}) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = ref.current;
    if (!open) return;
    const previous = document.activeElement;
    element.showModal();
    closeRef.current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-content">
        <h2 id={titleId}>{title}</h2>
        <div id={descriptionId} className="modal-description">
          {children}
        </div>
      </div>
      <div className="modal-actions">
        <button
          ref={closeRef}
          type="button"
          className="button button-secondary"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        {actions}
      </div>
    </dialog>
  );
}

export function UnsavedChanges({ dirty }) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return (
    <Modal
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      onClose={() => blocker.reset?.()}
      actions={
        <Button variant="danger" onClick={() => blocker.proceed?.()}>
          Discard changes
        </Button>
      }
    >
      <p>Your unsaved changes will be lost.</p>
    </Modal>
  );
}

export function ImageUpload({
  label,
  name,
  file,
  onChange,
  existing,
  limit,
  error,
  disabled,
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const previewRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (previewRef.current) previewRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function select(files) {
    if (disabled || !files?.length) return;
    const message =
      files.length > 1
        ? 'Choose one image at a time.'
        : validateImage(files[0], limit);
    setLocalError(message);
    if (!message) onChange(files[0]);
  }
  const message = localError || error;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          select(event.dataTransfer.files);
        }}
      >
        {file ? (
          <img
            ref={previewRef}
            alt="Selected image preview"
            className="upload-preview"
          />
        ) : existing ? (
          <Picture
            filename={existing}
            alt="Current image"
            className="upload-preview"
          />
        ) : (
          <ImagePlus
            size={28}
            strokeWidth={1.3}
            className="mx-auto text-muted"
          />
        )}
        <p className="font-medium">
          {file
            ? file.name
            : existing
              ? 'Choose a replacement image'
              : label === 'Profile photo'
                ? 'Put a face to your words'
                : 'Give your story a cover'}
        </p>
        <p className="field-help">
          JPG, PNG, WebP or GIF · Up to {limit === 500000 ? '500 KB' : '2 MB'}
        </p>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          className="sr-only"
          accept={IMAGE_TYPES.join(',')}
          disabled={disabled}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${id}-error` : undefined}
          onChange={(event) => {
            select(event.target.files);
            event.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose image
        </Button>
        <p className="field-help">or drag an image here</p>
        {file && (
          <button
            type="button"
            className="text-link mx-auto"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setLocalError('');
            }}
          >
            <X size={14} /> Remove selection
          </button>
        )}
      </div>
      {message && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export function UploadProgress({ progress, onCancel }) {
  return (
    <div className="upload-progress" role="status">
      <div className="flex justify-between gap-4 text-sm">
        <span>
          {progress >= 100
            ? 'Upload complete. Waiting for the server…'
            : `Uploading image… ${progress}%`}
        </span>
        <button type="button" className="text-link" onClick={onCancel}>
          Cancel request
        </button>
      </div>
      <progress value={progress} max="100" aria-label="Image upload progress" />
    </div>
  );
}

export function SavedMessage({ children }) {
  return (
    <p className="success-message" role="status">
      <Check size={16} />
      {children}
    </p>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SignInRequired() {
  return (
    <Empty title="Make yourself at home">
      Sign in to write stories and manage your profile.
      <Link to="/login" className="button button-primary mt-6">
        Sign in <ArrowRight size={16} />
      </Link>
    </Empty>
  );
}
