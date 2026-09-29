import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="prose-page mx-auto py-10 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">That route doesn't exist.</p>
      <Link to="/" className="btn btn-primary mt-4 inline-flex">
        Back to dashboard
      </Link>
    </div>
  );
}
