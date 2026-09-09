import Image from "next/image";
import type { Comment } from "@/lib/blog";

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li>
      <div className="avatar">
        <Image src={comment.avatar} alt="" width={500} height={500} sizes="60px" />
      </div>

      <div className="comment-info">
        <span className="c_name">{comment.name}</span>
        <span className="c_date id-color">{comment.date}</span>
        <span className="c_reply">
          <a href="#comment-form">Reply</a>
        </span>
        <div className="clearfix" />
      </div>

      <div className="comment">{comment.body}</div>

      {comment.replies?.length ? (
        <ol>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.name} comment={reply} />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

export default function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ol>
      {comments.map((comment) => (
        <CommentItem key={comment.name} comment={comment} />
      ))}
    </ol>
  );
}
