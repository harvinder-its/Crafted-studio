"use client";

import { useState } from "react";

type Errors = { email?: string; message?: string };

/**
 * The "Leave a Comment" form from blog-single.html. The template shipped it with
 * `action="#"` and no handler, so there is no endpoint to post to — the client
 * validation and the success/error banners are ported, and the submit is left
 * for whoever wires up a comment store.
 */
export default function CommentForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please check your email";
    if (message.length < 2) next.message = "Please check your message";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO: POST to a comments endpoint once one exists.
    setSent(true);
    e.currentTarget.reset();
  };

  return (
    <div className="comment_form_holder">
      <form id="comment-form" className="form-border" onSubmit={onSubmit} noValidate>
        <label htmlFor="comment-name">Name</label>
        <input type="text" name="name" id="comment-name" className="form-control" autoComplete="name" />

        <label htmlFor="comment-email">
          Email <span className="req">*</span>
        </label>
        <input
          type="email"
          name="email"
          id="comment-email"
          className="form-control"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
        />
        {errors.email && (
          <div className="error" style={{ display: "block" }}>
            {errors.email}
          </div>
        )}

        <label htmlFor="comment-message">
          Message <span className="req">*</span>
        </label>
        <textarea
          cols={10}
          rows={10}
          name="message"
          id="comment-message"
          className="form-control"
          aria-invalid={errors.message ? true : undefined}
        />
        {errors.message && (
          <div className="error" style={{ display: "block" }}>
            {errors.message}
          </div>
        )}

        {sent && (
          <div className="success" role="status" style={{ display: "block" }}>
            Thank you. Your message has been sent.
          </div>
        )}

        <p id="btnsubmit">
          <button type="submit" className="btn-main">
            Send
          </button>
        </p>
      </form>
    </div>
  );
}
