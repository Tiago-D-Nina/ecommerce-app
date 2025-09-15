import { Topbar } from './Topbar';
import { HeaderContent } from './HeaderContent';
import { Navbar } from './Navbar';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <Topbar />
      <HeaderContent />
      <Navbar />
    </header>
  );
};