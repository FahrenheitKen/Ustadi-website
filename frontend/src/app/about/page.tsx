import { Metadata } from 'next';
import { Film, Target, Eye, Lightbulb, Shield, Users, Sparkles, MapPin, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us - Ustadi Films',
  description: 'Ustadi Films Ltd is a dynamic film production company dedicated to crafting compelling visual stories that inform, inspire, and entertain.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-black to-black" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About <span className="text-red-500">Ustadi Films</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Ustadi Films Ltd is a dynamic film production company dedicated to
            crafting compelling visual stories that inform, inspire, and entertain.
            Founded on a passion for creativity and excellence, we specialize in
            producing documentaries, corporate films, short and feature-length
            narratives, and educational content that resonate with diverse audiences.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-red-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Target className="h-7 w-7 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              To tell authentic African stories with global relevance while upholding the
              highest standards of professionalism, creativity, and social impact.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-red-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Eye className="h-7 w-7 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold">Our Vision</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              To become a leading film production hub in Africa, recognized for
              innovation, storytelling excellence, and contribution to the growth of the
              creative industry.
            </p>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Core <span className="text-red-500">Services</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceCard
              icon={<Film className="h-6 w-6 text-red-500" />}
              title="Documentary Production"
              description="Capturing real stories with depth and authenticity."
            />
            <ServiceCard
              icon={<Sparkles className="h-6 w-6 text-red-500" />}
              title="Corporate Films & Adverts"
              description="Creating professional visual content for organizations, brands, and institutions."
            />
            <ServiceCard
              icon={<Film className="h-6 w-6 text-red-500" />}
              title="Narrative Films"
              description="Developing and producing short and feature-length films with strong cultural and social themes."
            />
            <ServiceCard
              icon={<Users className="h-6 w-6 text-red-500" />}
              title="Training & Mentorship"
              description="Equipping the next generation of filmmakers through workshops, masterclasses, and hands-on mentorship."
            />
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our <span className="text-red-500">Values</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ValueCard
              icon={<Lightbulb className="h-8 w-8 text-red-500" />}
              title="Creativity"
              description="Innovative approaches to storytelling."
            />
            <ValueCard
              icon={<Shield className="h-8 w-8 text-red-500" />}
              title="Professionalism"
              description="Delivering with integrity, quality, and efficiency."
            />
            <ValueCard
              icon={<Users className="h-8 w-8 text-red-500" />}
              title="Collaboration"
              description="Building strong partnerships with clients and stakeholders."
            />
            <ValueCard
              icon={<Target className="h-8 w-8 text-red-500" />}
              title="Impact"
              description="Producing content that educates, entertains, and transforms society."
            />
          </div>
        </div>
      </section>

      {/* Notable Work */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Notable <span className="text-red-500">Work</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            From the acclaimed feature <span className="text-white font-semibold">Admission Protocol</span> (2018)
            to socially impactful projects like <span className="text-white font-semibold">Rise of the Phoenix</span> (2022),
            Ustadi Films Ltd continues to deliver productions that spark conversations and inspire change.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Get in <span className="text-red-500">Touch</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 transition-colors">
              <MapPin className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Location</h3>
              <p className="text-gray-400">Nakuru, Kenya</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 transition-colors">
              <Mail className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Email</h3>
              <a href="mailto:ustadifilms@gmail.com" className="text-gray-400 hover:text-red-500 transition-colors">
                ustadifilms@gmail.com
              </a>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 transition-colors">
              <Phone className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Phone</h3>
              <a href="tel:+254713554560" className="text-gray-400 hover:text-red-500 transition-colors">
                +254 713 554 560
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-red-500/50 transition-colors">
      <div className="p-2 bg-red-500/10 rounded-lg h-fit">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-red-500/50 transition-colors">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
