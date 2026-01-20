import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Free Online Whiteboard for Teaching & Collaboration - AIFA Board",
    description:
        "AIFA Board is the best free online interactive whiteboard for teachers, educators, and teams. Try our live demo instantly - no sign up required!",
    keywords: [
        "free online whiteboard",
        "try whiteboard demo",
        "interactive whiteboard for teaching",
        "digital whiteboard free",
        "online teaching tools",
    ],
};

// Feature data with icons
const features = [
    {
        icon: "✏️",
        title: "Smart Drawing Tools",
        description: "Pen, highlighter, shapes, text with 25+ beautiful handwriting fonts",
        color: "blue",
    },
    {
        icon: "👆",
        title: "Multi-Touch Support",
        description: "Multiple users can draw simultaneously on touch devices",
        color: "green",
    },
    {
        icon: "🎥",
        title: "Screen Recording",
        description: "Record your lessons and export to video or PDF",
        color: "purple",
    },
    {
        icon: "📚",
        title: "Flipbook Pages",
        description: "Organize content with multiple pages like a real notebook",
        color: "orange",
    },
    {
        icon: "☁️",
        title: "Cloud Sync",
        description: "Your work is automatically saved and accessible anywhere",
        color: "cyan",
    },
    {
        icon: "🎨",
        title: "Beautiful Themes",
        description: "Multiple page styles: plain, ruled, graph, dotted",
        color: "pink",
    },
];

const useCases = [
    { emoji: "👩‍🏫", title: "Teachers", desc: "Create interactive lessons" },
    { emoji: "👨‍🎓", title: "Students", desc: "Take visual notes" },
    { emoji: "👥", title: "Teams", desc: "Brainstorm together" },
    { emoji: "🎨", title: "Designers", desc: "Sketch ideas quickly" },
];

const testimonials = [
    {
        quote: "AIFA Board transformed how I teach online. My students love the interactive lessons!",
        author: "Sarah M.",
        role: "High School Teacher",
    },
    {
        quote: "The multi-touch support is incredible. Multiple students can collaborate at once.",
        author: "John D.",
        role: "University Professor",
    },
    {
        quote: "Finally, a free whiteboard that actually works well. No more paying for Miro!",
        author: "Lisa K.",
        role: "Startup Founder",
    },
];

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-slate-900 overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/aifa-logo.png" alt="AIFA Board" width={40} height={40} className="rounded-lg" />
                        <span className="text-2xl font-bold">
                            <span className="text-blue-400">ai</span>
                            <span className="text-white">fa</span>
                            <span className="text-white/60 ml-1">Board</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="#features" className="text-white/70 hover:text-white transition hidden md:block">
                            Features
                        </Link>
                        <Link href="#demo" className="text-white/70 hover:text-white transition hidden md:block">
                            Try Demo
                        </Link>
                        <Link href="/sign-in" className="text-white/70 hover:text-white transition">
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto px-6 pt-16 pb-24">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        100% Free • No Credit Card Required
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Ultimate</span>{" "}
                        Online Whiteboard
                    </h1>

                    <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Create stunning digital lessons, collaborate in real-time, and transform
                        your teaching with the most powerful free whiteboard for educators.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link
                            href="#demo"
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                        >
                            Try Demo Now
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                        <Link
                            href="/sign-up"
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
                        >
                            Create Free Account
                        </Link>
                    </div>

                    {/* Hero Visual - Whiteboard Preview */}
                    <div className="relative max-w-4xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30" />
                        <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-white/10">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-white/50 text-sm ml-2">AIFA Board - My First Lesson</span>
                            </div>
                            <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="text-6xl mb-4">🎨</div>
                                    <p className="text-xl font-medium">Interactive Whiteboard Preview</p>
                                    <p className="text-white/70 mt-2">Scroll down to try the live demo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By / Social Proof */}
            <section className="relative z-10 border-y border-white/10 bg-slate-800/50 backdrop-blur-sm py-8">
                <div className="container mx-auto px-6">
                    <div className="flex flex-wrap justify-center items-center gap-8 text-white/50 text-sm">
                        <span>Trusted by educators worldwide</span>
                        <span className="hidden md:block">•</span>
                        <span className="flex items-center gap-1">⭐⭐⭐⭐⭐ <span className="text-white">4.9/5</span> rating</span>
                        <span className="hidden md:block">•</span>
                        <span><span className="text-white font-medium">10,000+</span> lessons created</span>
                        <span className="hidden md:block">•</span>
                        <span><span className="text-white font-medium">50+</span> countries</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-24">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Everything You Need to Teach
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Powerful features designed specifically for educators and creative teams
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="group p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all hover:-translate-y-1"
                            >
                                <div className="text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/60">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="relative z-10 py-16 bg-slate-800/30">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Perfect For Everyone</h2>
                    <div className="flex flex-wrap justify-center gap-8">
                        {useCases.map((uc, i) => (
                            <div key={i} className="text-center">
                                <div className="text-5xl mb-3">{uc.emoji}</div>
                                <h3 className="text-lg font-medium text-white">{uc.title}</h3>
                                <p className="text-white/50 text-sm">{uc.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section */}
            <section id="demo" className="relative z-10 py-24">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm mb-6">
                            🎮 Interactive Demo
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Try It Right Now
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Experience AIFA Board instantly. No sign up required for the demo!
                        </p>
                    </div>

                    {/* Demo Whiteboard Container */}
                    <div className="max-w-5xl mx-auto">
                        <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                            {/* Toolbar Preview */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 bg-blue-500/20 rounded-lg text-blue-400 text-sm">✏️ Pen</div>
                                    <div className="px-3 py-1.5 bg-white/5 rounded-lg text-white/50 text-sm">🔶 Shapes</div>
                                    <div className="px-3 py-1.5 bg-white/5 rounded-lg text-white/50 text-sm">T Text</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white/20" />
                                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white/20" />
                                    <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white/20" />
                                </div>
                            </div>

                            {/* Demo Canvas */}
                            <Link
                                href="/demo"
                                className="block aspect-video bg-gradient-to-br from-blue-600 to-blue-700 relative group cursor-pointer"
                            >
                                {/* Decorative strokes */}
                                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 450">
                                    <path d="M100,100 Q200,50 300,100 T500,100" stroke="white" strokeWidth="3" fill="none" />
                                    <circle cx="600" cy="150" r="40" stroke="white" strokeWidth="3" fill="none" />
                                    <rect x="150" y="200" width="100" height="80" stroke="white" strokeWidth="3" fill="none" />
                                    <path d="M400,250 L500,200 L600,250 L550,350 L450,350 Z" stroke="white" strokeWidth="3" fill="none" />
                                </svg>

                                {/* Click to try overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                        <p className="text-white text-2xl font-bold">Click to Try Demo</p>
                                        <p className="text-white/70 mt-2">Start drawing instantly</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Demo limitations notice */}
                            <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <span>⚡</span>
                                    <span>Demo Mode: Drawing & basic shapes available</span>
                                </div>
                                <Link href="/sign-up" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                                    Sign up for full features →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 py-24 bg-slate-800/30">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Loved by Educators</h2>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {testimonials.map((t, i) => (
                            <div key={i} className="p-6 bg-slate-800/50 rounded-2xl border border-white/10">
                                <p className="text-white/80 mb-4">&ldquo;{t.quote}&rdquo;</p>
                                <div>
                                    <p className="text-white font-medium">{t.author}</p>
                                    <p className="text-white/50 text-sm">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Ready to Transform Your Teaching?
                        </h2>
                        <p className="text-xl text-white/90 mb-8">
                            Join thousands of educators using AIFA Board. Free forever.
                        </p>
                        <Link
                            href="/sign-up"
                            className="inline-block px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl"
                        >
                            Create Your Free Account →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-8 border-t border-white/10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Image src="/aifa-logo.png" alt="AIFA" width={24} height={24} className="rounded" />
                        <span className="text-white/60 text-sm">© {new Date().getFullYear()} AIFA Labs Global</span>
                    </div>
                    <div className="flex gap-6 text-white/50 text-sm">
                        <Link href="/sign-in" className="hover:text-white transition">Sign In</Link>
                        <Link href="/sign-up" className="hover:text-white transition">Sign Up</Link>
                        <Link href="/demo" className="hover:text-white transition">Try Demo</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
