import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div className="min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)] flex flex-col font-sans">
      <Navigation />
      <main className="flex-1 flex flex-col w-full relative">
        <Outlet />
      </main>
    </div>
  );
}
