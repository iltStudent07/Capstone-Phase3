import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div>
      <h1>404 — Page Not Found</h1>
      <p>The page you're looking for is in another castle.</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

export default NotFound