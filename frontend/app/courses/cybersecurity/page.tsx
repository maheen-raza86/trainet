import CourseDetailTemplate from '@/components/public/CourseDetailTemplate';

export default function CybersecurityPage() {
  return (
    <CourseDetailTemplate
      title="Cybersecurity"
      subtitle="Master ethical hacking, penetration testing, malware analysis, and enterprise security defense."
      gradient="from-red-900 via-rose-900 to-slate-900"
      duration="8–12 Weeks"
      difficulty="Intermediate"
      icon="🛡️"
      overview="This course covers the full spectrum of cybersecurity — from foundational concepts to advanced penetration testing techniques used by professional ethical hackers. You'll learn to think like an attacker to defend like a pro."
      whyMatters="Cybersecurity is one of the fastest-growing fields globally. Every organization needs security professionals. Certified ethical hackers command top salaries and are in constant demand across all industries."
      outcomes={[
        'Understand the cybersecurity threat landscape and attack vectors',
        'Perform ethical hacking and penetration testing legally',
        'Use Kali Linux as a professional security toolkit',
        'Conduct footprinting, reconnaissance, and OSINT',
        'Perform network scanning and enumeration',
        'Exploit system vulnerabilities and escalate privileges',
        'Analyze and reverse malware samples',
        'Capture and analyze network traffic with Wireshark',
        'Test web applications for OWASP Top 10 vulnerabilities',
        'Perform SQL injection and XSS attacks in lab environments',
        'Use Burp Suite for web application security testing',
        'Conduct wireless security assessments',
        'Understand social engineering and phishing techniques',
        'Respond to security incidents and perform forensics',
      ]}
      modules={[
        { week: 'Week 1', title: 'Introduction to Cybersecurity', topics: ['Threat landscape overview', 'Types of hackers', 'Legal and ethical framework', 'CEH methodology'] },
        { week: 'Week 2', title: 'Kali Linux & Lab Setup', topics: ['Installing Kali Linux', 'Essential tools overview', 'Virtual lab environment', 'Terminal fundamentals'] },
        { week: 'Week 3', title: 'Footprinting & Reconnaissance', topics: ['Passive vs active recon', 'OSINT techniques', 'Google dorking', 'Maltego & Shodan'] },
        { week: 'Week 4', title: 'Scanning & Enumeration', topics: ['Nmap scanning techniques', 'Port and service enumeration', 'Vulnerability scanning with Nessus', 'Banner grabbing'] },
        { week: 'Week 5', title: 'System Hacking', topics: ['Password cracking (Hashcat, John)', 'Privilege escalation', 'Maintaining access', 'Covering tracks'] },
        { week: 'Week 6', title: 'Malware Threats', topics: ['Types of malware', 'Trojan analysis', 'Ransomware behavior', 'Malware analysis tools'] },
        { week: 'Week 7', title: 'Sniffing & Wireshark', topics: ['Network sniffing concepts', 'Wireshark deep dive', 'ARP poisoning', 'Man-in-the-middle attacks'] },
        { week: 'Week 8', title: 'Web Application Security', topics: ['OWASP Top 10', 'XSS and CSRF', 'Authentication bypass', 'File inclusion vulnerabilities'] },
        { week: 'Week 9', title: 'SQL Injection & Burp Suite', topics: ['SQL injection types', 'Manual and automated SQLi', 'Burp Suite proxy and scanner', 'SQLmap usage'] },
        { week: 'Week 10', title: 'Wireless & Social Engineering', topics: ['WPA2 cracking', 'Evil twin attacks', 'Phishing campaigns', 'Pretexting techniques'] },
        { week: 'Week 11', title: 'Incident Response', topics: ['IR lifecycle', 'Digital forensics basics', 'Log analysis', 'Evidence collection'] },
        { week: 'Week 12', title: 'Final Project: Capture The Flag', topics: ['Full penetration test simulation', 'CTF challenge completion', 'Report writing', 'Presentation to panel'] },
      ]}
      tools={['Kali Linux', 'Wireshark', 'Burp Suite', 'Metasploit', 'Nmap', 'Nessus', 'Hashcat', 'SQLmap', 'Maltego', 'Shodan']}
      careers={[
        { title: 'Cybersecurity Analyst', demand: 'High demand · $70k–$110k', color: 'from-red-500/20 to-rose-500/20' },
        { title: 'SOC Analyst', demand: 'Very high demand · $60k–$95k', color: 'from-orange-500/20 to-red-500/20' },
        { title: 'Penetration Tester', demand: 'High demand · $80k–$130k', color: 'from-rose-500/20 to-pink-500/20' },
        { title: 'Ethical Hacker', demand: 'Growing field · $75k–$120k', color: 'from-red-600/20 to-orange-500/20' },
        { title: 'Security Engineer', demand: 'Critical role · $90k–$150k', color: 'from-pink-500/20 to-red-500/20' },
      ]}
      faqs={[
        { q: 'Do I need prior experience to join?', a: 'Basic computer knowledge is helpful but not required. The course starts from fundamentals and progressively builds to advanced topics.' },
        { q: 'Is this course legal?', a: 'Yes. All hacking techniques are taught in controlled lab environments. You will learn the legal and ethical framework before any practical work.' },
        { q: 'Will I get a certificate?', a: 'Yes. Upon completion, you receive a QR-verified TRAINET certificate that employers can verify instantly.' },
        { q: 'What tools will I need?', a: 'A laptop with at least 8GB RAM to run virtual machines. All software (Kali Linux, Wireshark, etc.) is free and open-source.' },
        { q: 'Can this help me get a job?', a: 'Absolutely. Cybersecurity professionals are among the most sought-after in tech. Our Talent Pool connects you directly with recruiters.' },
      ]}
    />
  );
}
