import { UserProfile, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

export default function ProfilePage() {
  return (
    <div className="flex-1 bg-[#0A0A0A] flex flex-col items-center py-12 relative overflow-hidden">
      
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl px-6 relative z-10 flex flex-col items-center">
        <header className="mb-12 text-center w-full max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Account Access</h1>
          <p className="text-white/40 text-sm font-sans max-w-xl mx-auto">
            Manage your digital footprint, API limits, and saved archives.
          </p>
        </header>

        <SignedIn>
          <div className="w-full max-w-3xl glass-panel p-2 rounded-lg border border-white/10 shadow-2xl">
            <UserProfile 
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: '#F59E0B',
                  colorBackground: '#121212',
                  colorInputBackground: '#1A1A1A',
                  colorText: '#FFFFFF',
                  colorTextSecondary: '#A3A3A3',
                  borderRadius: '0.25rem',
                },
                elements: {
                  card: 'bg-transparent shadow-none',
                  navbar: 'hidden',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  rootBox: 'w-full'
                }
              }} 
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="max-w-md w-full glass-panel p-10 text-center rounded-sm border border-amber-500/20">
            <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">lock</span>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Restricted Area</h2>
            <p className="text-white/50 text-sm mb-8">You need an active clearance to access identity management.</p>
            
            <SignInButton mode="modal">
              <button className="w-full premium-btn text-sm">Authenticate Identity</button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>

    </div>
  );
}
