import styles from "../admin.module.css";

/**
 * Shown the instant a panel link is clicked, while the server fetches.
 *
 * Every admin screen reads the database, and the database is a few hundred
 * milliseconds away, so without this the browser sits on the old page with no
 * sign that anything is happening — which reads as the app being broken.
 */
export default function PanelLoading() {
  return (
    <>
      <header className={styles.header}>
        <div>
          <span className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.panel}>
          <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
          <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
          <span className={`${styles.skeleton} ${styles.skeletonLineShort}`} />
        </div>
      </div>
    </>
  );
}
