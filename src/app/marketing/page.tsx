import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Free Online Whiteboard for Teaching & Collaboration - AIFA Board",
    description:
        "AIFA Board is the best free online interactive whiteboard for teachers, educators, and teams. Create digital lessons, collaborate in real-time, draw, annotate, and share your ideas with multitouch support. Perfect for virtual classrooms and remote learning.",
    keywords: [
        "free online whiteboard",
        "best whiteboard app",
        "interactive whiteboard for teaching",
        "digital whiteboard free",
        "online teaching tools",
        "virtual classroom whiteboard",
        "collaborative whiteboard app",
        "teacher whiteboard tool",
        "education whiteboard",
        "online drawing board",
    ],
    alternates: {
        canonical: "https://www.aifa.cloud/marketing",
    },
};

export default function MarketingPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/aifa-logo.png"
                            alt="AIFA Board Logo"
                            width={40}
                            height={40}
                            className="rounded-lg"
                        />
                        <span className="text-2xl font-bold text-white">
                            <span className="text-blue-400">ai</span>
                            <span className="text-white">fa</span> Board
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/sign-in"
                            className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </nav>

                <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            The Best Free <span className="text-blue-400">Online Whiteboard</span>{" "}
                            for Teaching & Collaboration
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
                            Create interactive digital lessons, collaborate in real-time, and
                            transform your virtual classroom with AIFA Board - the most powerful
                            free interactive whiteboard for educators and teams.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/sign-up"
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-lg font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
                            >
                                Start Teaching for Free →
                            </Link>
                            <Link
                                href="#features"
                                className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all text-lg font-semibold backdrop-blur-sm"
                            >
                                Explore Features
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-20 bg-slate-800/50">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        Why Teachers Love AIFA Board
                    </h2>
                    <p className="text-lg text-white/70 text-center mb-12 max-w-2xl mx-auto">
                        Everything you need to create engaging digital lessons and collaborate
                        with students in real-time.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Interactive Drawing Tools
                            </h3>
                            <p className="text-white/70">
                                Pen, highlighter, shapes, text, and more. Create beautiful digital
                                lessons with intuitive drawing tools optimized for teaching.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Multi-Touch Collaboration
                            </h3>
                            <p className="text-white/70">
                                Multiple users can draw simultaneously with full multi-touch
                                support. Perfect for interactive classrooms and group work.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Screen Recording & Lessons
                            </h3>
                            <p className="text-white/70">
                                Record your lessons with screen recording and export to PDF.
                                Create reusable content for your students to review anytime.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-orange-600/20 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-orange-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Multiple Pages & Workspaces
                            </h3>
                            <p className="text-white/70">
                                Organize your content with multiple pages and workspaces. Keep
                                your lessons structured and easy to navigate.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-pink-600/20 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-pink-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Beautiful Handwriting Fonts
                            </h3>
                            <p className="text-white/70">
                                25+ handwriting fonts to make your digital lessons feel personal
                                and engaging. Express yourself naturally on the whiteboard.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-14 h-14 bg-cyan-600/20 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-cyan-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Works on Any Device
                            </h3>
                            <p className="text-white/70">
                                Use AIFA Board on desktop, tablet, or mobile. Optimized for touch
                                screens and stylus input for the best teaching experience.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        Perfect for Every Teaching Scenario
                    </h2>
                    <p className="text-lg text-white/70 text-center mb-12 max-w-2xl mx-auto">
                        From remote classrooms to in-person lectures, AIFA Board adapts to your
                        teaching style.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">🏫</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Virtual Classrooms
                            </h3>
                            <p className="text-white/60 text-sm">
                                Engage students remotely with interactive lessons
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">📐</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Math & Science
                            </h3>
                            <p className="text-white/60 text-sm">
                                Draw equations, graphs, and diagrams with ease
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Art & Design
                            </h3>
                            <p className="text-white/60 text-sm">
                                Sketch, illustrate, and demonstrate creative techniques
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">💼</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Team Meetings
                            </h3>
                            <p className="text-white/60 text-sm">
                                Brainstorm and collaborate with your team visually
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Teaching?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of educators using AIFA Board to create engaging,
                        interactive lessons. It&apos;s completely free to get started.
                    </p>
                    <Link
                        href="/sign-up"
                        className="inline-block px-10 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all text-lg font-semibold shadow-lg"
                    >
                        Create Your Free Account →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 border-t border-white/10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/aifa-logo.png"
                                alt="AIFA Board"
                                width={32}
                                height={32}
                                className="rounded-lg"
                            />
                            <span className="text-lg font-semibold text-white">
                                <span className="text-blue-400">ai</span>
                                <span className="text-white">fa</span> Board
                            </span>
                        </div>
                        <div className="flex gap-8 text-white/60 text-sm">
                            <Link href="/sign-in" className="hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link href="/sign-up" className="hover:text-white transition-colors">
                                Sign Up
                            </Link>
                        </div>
                        <p className="text-white/40 text-sm">
                            © {new Date().getFullYear()} AIFA Labs Global. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
