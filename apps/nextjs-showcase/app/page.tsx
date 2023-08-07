import Link from 'next/link';
import styles from './page.module.scss';

export default async function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.scss file.
   */
  return (
    <div className={styles.page}>
      <h1>Welcome to nextjs-showcase!</h1>
      <h2>Examples</h2>
      <ul>
        <li>
          <Link href="/with-dummy-data">With dummy data</Link>
        </li>
      </ul>
    </div>
  );
}
