import CourseDetailTemplate from '@/components/public/CourseDetailTemplate';

export default function NetworkingPage() {
  return (
    <CourseDetailTemplate
      title="Networking (CCNA)"
      subtitle="Build strong networking fundamentals, routing, switching, and enterprise connectivity aligned with CCNA standards."
      gradient="from-green-900 via-emerald-900 to-slate-900"
      duration="6–8 Weeks"
      difficulty="Beginner"
      icon="🌐"
      heroImage="/Networking.png"
      overview="This CCNA-aligned course takes you from zero networking knowledge to configuring enterprise-grade routers and switches. You'll work with Cisco Packet Tracer to simulate real network environments."
      whyMatters="Networking is the backbone of every IT infrastructure. CCNA-certified professionals are required in every organization — from small businesses to global enterprises. It's the gateway to a career in IT."
      outcomes={[
        'Understand how networks function at every layer',
        'Apply the OSI and TCP/IP models to real scenarios',
        'Design and implement IP addressing and subnetting schemes',
        'Configure static and dynamic routing protocols (RIP, OSPF)',
        'Set up and manage Cisco switches and VLANs',
        'Implement inter-VLAN routing',
        'Configure DHCP and DNS services',
        'Manage Cisco routers and switches via CLI',
        'Apply basic network security principles',
        'Troubleshoot common network issues systematically',
        'Complete hands-on lab simulations in Packet Tracer',
      ]}
      modules={[
        { week: 'Week 1', title: 'Network Basics', topics: ['What is a network?', 'Network types (LAN, WAN, MAN)', 'Network topologies', 'Network devices overview'] },
        { week: 'Week 2', title: 'OSI & TCP/IP Model', topics: ['7 layers of OSI', 'TCP/IP stack', 'Encapsulation and decapsulation', 'Protocol analysis'] },
        { week: 'Week 3', title: 'IP Addressing & Subnetting', topics: ['IPv4 addressing', 'Subnet masks and CIDR', 'Subnetting calculations', 'IPv6 introduction'] },
        { week: 'Week 4', title: 'Routing', topics: ['Static routing', 'Dynamic routing (RIP, OSPF)', 'Routing tables', 'Default routes'] },
        { week: 'Week 5', title: 'Switching & VLANs', topics: ['Switch operation', 'VLAN configuration', 'Trunk ports', 'Inter-VLAN routing'] },
        { week: 'Week 6', title: 'DHCP, DNS & Cisco Devices', topics: ['DHCP server configuration', 'DNS resolution', 'Cisco IOS CLI', 'Router and switch management'] },
        { week: 'Week 7', title: 'Network Security Basics', topics: ['Access control lists (ACLs)', 'Port security', 'SSH configuration', 'Basic firewall concepts'] },
        { week: 'Week 8', title: 'Troubleshooting & Final Lab', topics: ['Systematic troubleshooting methodology', 'Common network issues', 'Packet Tracer final lab', 'CCNA exam preparation'] },
      ]}
      tools={['Cisco Packet Tracer', 'Cisco Routers', 'Cisco Switches', 'Wireshark', 'PuTTY', 'GNS3']}
      careers={[
        { title: 'Network Engineer', demand: 'High demand · $65k–$100k', color: 'from-green-500/20 to-emerald-500/20' },
        { title: 'Network Administrator', demand: 'Stable demand · $55k–$85k', color: 'from-emerald-500/20 to-teal-500/20' },
        { title: 'IT Support Specialist', demand: 'Entry-level friendly · $45k–$70k', color: 'from-teal-500/20 to-green-500/20' },
      ]}
      faqs={[
        { q: 'Is this course aligned with CCNA certification?', a: 'Yes. The curriculum covers all major CCNA topics and prepares you for the Cisco CCNA 200-301 exam.' },
        { q: 'Do I need physical Cisco equipment?', a: 'No. We use Cisco Packet Tracer, a free network simulation tool that accurately simulates real Cisco devices.' },
        { q: 'Is this suitable for complete beginners?', a: 'Yes. This course starts from absolute basics — no prior networking knowledge is required.' },
        { q: 'How long does it take to complete?', a: '6–8 weeks with approximately 8–10 hours of study per week including labs and assignments.' },
        { q: 'Will this help me get a job?', a: 'CCNA is one of the most recognized IT certifications globally. Combined with TRAINET\'s Talent Pool, you\'ll have strong job prospects.' },
      ]}
    />
  );
}
