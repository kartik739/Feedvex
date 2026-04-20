import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

export default function LoginPage() {
  return (
    <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/signup" 
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#F59E0B',
              colorBackground: '#121212',
              colorInputBackground: '#1A1A1A',
              colorText: '#FFFFFF',
              colorTextSecondary: '#A3A3A3',
              borderRadius: '0.125rem',
            },
            elements: {
              card: 'bg-transparent shadow-2xl border border-white/10 rounded-sm p-8',
              headerTitle: 'text-2xl font-serif text-white tracking-tight',
              headerSubtitle: 'text-sm text-white/50',
              formButtonPrimary: 'bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors uppercase tracking-widest text-[10px] py-3',
              footerActionLink: 'text-amber-500 hover:text-amber-400',
              formFieldInput: 'border-white/10 focus:border-amber-500 bg-[#1A1A1A] text-white rounded-sm',
              formFieldLabel: 'text-[10px] uppercase tracking-widest text-white/50',
              identityPreviewText: 'text-white/70',
              identityPreviewEditButton: 'text-amber-500 hover:text-amber-400'
            }
          }} 
        />
      </div>
    </div>
  );
}
