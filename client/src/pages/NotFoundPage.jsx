import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/"><Button>Back to home</Button></Link>
    </div>
  );
}
