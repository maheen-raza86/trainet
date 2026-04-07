'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AcademicCapIcon, 
  BeakerIcon, 
  CpuChipIcon, 
  QrCodeIcon, 
  UsersIcon, 
  BriefcaseIcon,
  SparklesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    setIsVisible(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/10 backdrop-blur-lg border-b border-white/20' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                TRAINET
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="#projects" className="text-white/80 hover:text-white transition-colors">
                  Projects
                </Link>
                <Link href="#alumni" className="text-white/80 hover:text-white transition-colors">
                  Alumni
                </Link>
                <Link href="#talent-pool" className="text-white/80 hover:text-white transition-colors">
                  Talent Pool
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Next-Generation 
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> AI-Powered </span>
                Learning & Career Development
              </h1>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Experience AI-powered learning with real-world projects, mentorship networks, 
                and career opportunities. Get auto-graded assignments, QR-verified certificates, 
                and AI-matched job opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="#courses"
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 text-center font-semibold"
                >
                  Explore Courses
                </Link>
                <Link 
                  href="/signup"
                  className="px-8 py-4 border-2 border-white/30 text-white rounded-full hover:bg-white/10 transition-all duration-300 text-center font-semibold"
                >
                  Join as Student
                </Link>
              </div>
            </div>
            
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl backdrop-blur-sm border border-white/20 p-8">
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                          <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">AI Grading</div>
                          <div className="text-white/60 text-sm">Instant feedback</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">50K+ Learners</div>
                          <div className="text-white/60 text-sm">Active community</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">Skill Matching</div>
                          <div className="text-white/60 text-sm">AI-powered jobs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 px-6 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Makes TRAINET Different</h2>
            <p className="text-xl text-white/80">Advanced AI-powered features that transform learning</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <CpuChipIcon className="w-8 h-8" />,
                title: "AI Auto-Grading & Plagiarism Detection",
                description: "Instant feedback with advanced AI that detects plagiarism and provides detailed grading"
              },
              {
                icon: <BeakerIcon className="w-8 h-8" />,
                title: "Work & Practice (Real-world tasks)",
                description: "Hands-on projects that mirror real industry challenges and build practical skills"
              },
              {
                icon: <QrCodeIcon className="w-8 h-8" />,
                title: "QR-Based Certificate Verification",
                description: "Blockchain-secured certificates with QR codes for instant verification by employers"
              },
              {
                icon: <UsersIcon className="w-8 h-8" />,
                title: "Alumni Mentorship Network",
                description: "Connect with successful alumni for career guidance and industry insights"
              },
              {
                icon: <BriefcaseIcon className="w-8 h-8" />,
                title: "AI Talent Pool for Recruiters",
                description: "Smart matching system that connects skilled graduates with relevant job opportunities"
              },
              {
                icon: <AcademicCapIcon className="w-8 h-8" />,
                title: "Live Sessions & Course Learning",
                description: "Interactive live classes with recorded sessions and comprehensive course materials"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Built for Everyone in the Ecosystem</h2>
            <p className="text-xl text-white/80">Comprehensive platform serving all stakeholders</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[
              {
                role: "Student",
                icon: <AcademicCapIcon className="w-8 h-8" />,
                description: "Learn, practice, earn certificates",
                color: "from-blue-500 to-cyan-500"
              },
              {
                role: "Trainer",
                icon: <BeakerIcon className="w-8 h-8" />,
                description: "Create courses, assign tasks, evaluate",
                color: "from-purple-500 to-pink-500"
              },
              {
                role: "Alumni",
                icon: <UsersIcon className="w-8 h-8" />,
                description: "Mentor students and guide careers",
                color: "from-green-500 to-emerald-500"
              },
              {
                role: "Recruiter",
                icon: <BriefcaseIcon className="w-8 h-8" />,
                description: "Find talent using AI matching",
                color: "from-orange-500 to-red-500"
              },
              {
                role: "Admin",
                icon: <ChartBarIcon className="w-8 h-8" />,
                description: "Manage system & analytics",
                color: "from-indigo-500 to-purple-500"
              }
            ].map((user, index) => (
              <div 
                key={index}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:-translate-y-2 text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${user.color} rounded-2xl flex items-center justify-center text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {user.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{user.role}</h3>
                <p className="text-white/70 text-sm">{user.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Your Learning Journey</h2>
            <p className="text-xl text-white/80">From learning to career success in 5 simple steps</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-4">
            {[
              { step: "1", title: "Learn Courses", description: "Access comprehensive courses with interactive content" },
              { step: "2", title: "Complete Assignments", description: "Work on real-world projects and practical tasks" },
              { step: "3", title: "AI Grading + Feedback", description: "Get instant AI-powered evaluation and improvement tips" },
              { step: "4", title: "Get QR Certificate", description: "Receive blockchain-verified certificates with QR codes" },
              { step: "5", title: "Get Matched with Recruiters", description: "AI connects you with relevant job opportunities" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {item.step}
                  </div>
                  {index < 4 && (
                    <ArrowRightIcon className="hidden lg:block absolute top-1/2 -right-12 w-8 h-8 text-white/40 transform -translate-y-1/2" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm max-w-32">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powered by Artificial Intelligence</h2>
            <p className="text-xl text-white/80">Advanced AI capabilities that enhance every aspect of learning</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Personalized Learning Paths",
                description: "AI analyzes your progress and creates customized learning experiences",
                icon: <RocketLaunchIcon className="w-6 h-6" />
              },
              {
                title: "Auto Grading System",
                description: "Instant, accurate grading with detailed feedback and improvement suggestions",
                icon: <SparklesIcon className="w-6 h-6" />
              },
              {
                title: "Plagiarism Detection",
                description: "Advanced algorithms detect and prevent academic dishonesty",
                icon: <ShieldCheckIcon className="w-6 h-6" />
              },
              {
                title: "Skill Gap Analysis",
                description: "Identify areas for improvement and get targeted recommendations",
                icon: <ChartBarIcon className="w-6 h-6" />
              },
              {
                title: "Talent Matching",
                description: "Smart algorithms connect graduates with perfect job opportunities",
                icon: <BriefcaseIcon className="w-6 h-6" />
              },
              {
                title: "Predictive Analytics",
                description: "Forecast learning outcomes and career success probability",
                icon: <CpuChipIcon className="w-6 h-6" />
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:-translate-y-2 group"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Courses */}
      <section className="py-20 px-6 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Popular Course Categories</h2>
            <p className="text-xl text-white/80">Explore trending skills and technologies</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Web Development",
                level: "Beginner to Advanced",
                students: "12,500+",
                rating: 4.8,
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "AI & Machine Learning",
                level: "Intermediate",
                students: "8,200+",
                rating: 4.9,
                color: "from-purple-500 to-pink-500"
              },
              {
                title: "Data Science",
                level: "Beginner to Advanced",
                students: "15,300+",
                rating: 4.7,
                color: "from-green-500 to-emerald-500"
              },
              {
                title: "UI/UX Design",
                level: "Beginner",
                students: "9,800+",
                rating: 4.8,
                color: "from-orange-500 to-red-500"
              }
            ].map((course, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:-translate-y-2 group cursor-pointer"
              >
                <div className={`w-full h-32 bg-gradient-to-r ${course.color} rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                  <AcademicCapIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
                <p className="text-white/60 text-sm mb-3">{course.level}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{course.students} students</span>
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white/70 text-sm">{course.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already building their future with AI-powered education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 font-semibold text-lg"
            >
              Join as Student
            </Link>
            <Link 
              href="#courses"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-full hover:bg-white/10 transition-all duration-300 font-semibold text-lg"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-black/20 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="#courses" className="text-white/70 hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="#projects" className="text-white/70 hover:text-white transition-colors">Projects</Link></li>
                <li><Link href="#certificates" className="text-white/70 hover:text-white transition-colors">Certificates</Link></li>
                <li><Link href="#talent-pool" className="text-white/70 hover:text-white transition-colors">Talent Pool</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="#alumni" className="text-white/70 hover:text-white transition-colors">Alumni</Link></li>
                <li><Link href="#mentorship" className="text-white/70 hover:text-white transition-colors">Mentorship</Link></li>
                <li><Link href="#events" className="text-white/70 hover:text-white transition-colors">Events</Link></li>
                <li><Link href="#forums" className="text-white/70 hover:text-white transition-colors">Forums</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#help" className="text-white/70 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#privacy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#terms" className="text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">TRAINET</h3>
              <p className="text-white/70 mb-4">
                Next-generation AI-powered learning and career development platform.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <span className="text-white text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <span className="text-white text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <span className="text-white text-sm">in</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-white/60">© 2024 TRAINET. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}