import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="section-panel section-panel--padded not-found-card">
        <h1>404 — Page Not Found</h1>
        <p>The page you're looking for is in another castle.</p>
        <button className="app-button not-found-button"><Link to="/dashboard">Back to Dashboard</Link></button>
      </div>
    </div>
  );
}

export default NotFound