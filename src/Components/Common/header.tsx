import { BookOpen } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-4 backdrop-blur-sm">
        <BookOpen className="w-6 h-6 text-blue-300" />
        <span className="text-sm font-semibold text-blue-300">Parser App</span>
      </div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
        {title}
      </h1>
      <p className="text-gray-400 mt-2">{subtitle}</p>
    </div>
  );
}