import { useState } from 'react';
import { User, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import WalletGydeLogo from '@/components/WalletGydeLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const testimonials = [
  {
    id: 1,
    text: "WalletGyde was easy to navigate and simple to use!",
    position: 'left'
  },
  {
    id: 2,
    text: "WalletGyde was simple and straightforward!",
    position: 'right'
  },
  {
    id: 3,
    text: "WalletGyde has got a clean interface. It's an easy straightforward process.",
    position: 'left'
  }
];

export default function Landing() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate newsletter signup
    setTimeout(() => {
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="landing-page">
      {/* Header */}
      <header className="bg-slate-800 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <WalletGydeLogo variant="light" data-testid="header-logo" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Testimonials Section */}
        <div className="space-y-8 mb-24">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className={`flex items-start space-x-4 ${
                testimonial.position === 'right' ? 'justify-end' : 'justify-start'
              }`}
              data-testid={`testimonial-${index + 1}`}
            >
              {testimonial.position === 'left' && (
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className={`bg-gray-200 rounded-2xl px-6 py-4 max-w-md ${
                testimonial.position === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}>
                <p className="text-gray-700 text-sm leading-relaxed" data-testid={`testimonial-text-${index + 1}`}>
                  "{testimonial.text}"
                </p>
              </div>
              
              {testimonial.position === 'right' && (
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Newsletter Signup Section */}
        <div className="text-center space-y-6" data-testid="newsletter-section">
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="newsletter-title">
            Sign Up For Our Newsletter!
          </h2>
          
          <div className="space-y-2">
            <p className="text-gray-600" data-testid="newsletter-description">
              Get exclusive access to new product releases and essential financial insights.
            </p>
            <p className="text-gray-600">
              Don't miss out—be the first to know!
            </p>
          </div>

          <form onSubmit={handleNewsletterSignup} className="max-w-md mx-auto">
            <div className="flex space-x-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
                data-testid="input-newsletter-email"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
                data-testid="button-newsletter-signup"
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Footer Logo */}
            <WalletGydeLogo variant="light" data-testid="footer-logo" />
            
            {/* Social Media Links */}
            <div className="flex space-x-6" data-testid="social-links">
              <a 
                href="#" 
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="link-linkedin"
              >
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a 
                href="#" 
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a 
                href="#" 
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="link-facebook"
              >
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a 
                href="#" 
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="link-youtube"
              >
                <Youtube className="w-5 h-5" />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}