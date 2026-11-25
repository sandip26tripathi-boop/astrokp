import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-surface-primary text-text-primary">
      <div className="max-w-md p-8 rounded-2xl bg-surface-card border border-brand-accent/30 shadow-lg">
        <h1 className="text-6xl font-bold text-brand-accent mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">पृष्ठ नहीं मिला | Page Not Found</h2>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          आप जिस पृष्ठ की खोज कर रहे हैं, वह उपलब्ध नहीं है अथवा स्थानांतरित कर दिया गया है।
          <br />
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-accent text-white font-medium hover:bg-brand-hover transition-colors shadow-sm"
        >
          मुख्य पृष्ठ पर लौटें (Return Home)
        </Link>
      </div>
    </div>
  );
}
