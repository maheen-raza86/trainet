import CourseDetailTemplate from '@/components/public/CourseDetailTemplate';

export default function SystemAdminPage() {
  return (
    <CourseDetailTemplate
      title="System Administration"
      subtitle="Learn Windows Server, Linux administration, Active Directory, and enterprise IT management."
      gradient="from-violet-900 via-purple-900 to-slate-900"
      duration="6–8 Weeks"
      difficulty="Beginner"
      icon="🖥️"
      overview="This course covers the essential skills of a system administrator — managing Windows and Linux servers, configuring Active Directory, automating tasks with PowerShell, and maintaining enterprise IT infrastructure."
      whyMatters="Every organization needs system administrators to keep their IT infrastructure running. Sysadmins are the backbone of enterprise IT, managing everything from user accounts to server security."
      outcomes={[
        'Install and configure Windows Server environments',
        'Administer Linux servers from the command line',
        'Manage users, groups, and permissions on both platforms',
        'Deploy and manage Active Directory Domain Services',
        'Configure DNS and DHCP services',
        'Apply Group Policies across an organization',
        'Implement server security hardening techniques',
        'Set up backup and disaster recovery procedures',
        'Automate administrative tasks with PowerShell',
        'Monitor server performance and troubleshoot issues',
        'Manage file shares and network resources',
      ]}
      modules={[
        { week: 'Week 1', title: 'Windows Server Basics', topics: ['Windows Server installation', 'Server roles and features', 'Server Manager', 'Remote Desktop Services'] },
        { week: 'Week 2', title: 'Linux Administration', topics: ['Linux distributions overview', 'File system and permissions', 'Package management (apt/yum)', 'Service management (systemd)'] },
        { week: 'Week 3', title: 'User & Permission Management', topics: ['Local user accounts', 'Groups and permissions', 'NTFS permissions', 'Linux ACLs'] },
        { week: 'Week 4', title: 'Active Directory', topics: ['AD DS installation', 'Domain controllers', 'Organizational Units', 'User and computer objects'] },
        { week: 'Week 5', title: 'DNS & DHCP', topics: ['DNS server configuration', 'Forward and reverse lookup zones', 'DHCP server setup', 'Scope and reservations'] },
        { week: 'Week 6', title: 'Group Policies & Security', topics: ['GPO creation and linking', 'Password policies', 'Software deployment via GPO', 'Security baselines'] },
        { week: 'Week 7', title: 'Backup & Recovery', topics: ['Windows Server Backup', 'Linux backup tools', 'Disaster recovery planning', 'System restore procedures'] },
        { week: 'Week 8', title: 'PowerShell Automation', topics: ['PowerShell fundamentals', 'AD management scripts', 'Scheduled tasks', 'Final automation project'] },
      ]}
      tools={['Windows Server 2022', 'Linux (Ubuntu/CentOS)', 'Active Directory', 'PowerShell', 'Group Policy Management', 'Hyper-V', 'VMware']}
      careers={[
        { title: 'System Administrator', demand: 'Stable demand · $55k–$90k', color: 'from-violet-500/20 to-purple-500/20' },
        { title: 'IT Administrator', demand: 'High demand · $50k–$80k', color: 'from-purple-500/20 to-indigo-500/20' },
        { title: 'Windows Server Engineer', demand: 'Enterprise focused · $65k–$100k', color: 'from-indigo-500/20 to-violet-500/20' },
      ]}
      faqs={[
        { q: 'Do I need physical servers to practice?', a: 'No. We use virtualization (Hyper-V or VMware) to run Windows Server and Linux in virtual machines on your laptop.' },
        { q: 'Is Linux covered in this course?', a: 'Yes. We cover both Windows Server and Linux administration, as most enterprise environments use both.' },
        { q: 'What version of Windows Server is covered?', a: 'Windows Server 2022, the latest version. Concepts apply to older versions as well.' },
        { q: 'Is PowerShell scripting difficult?', a: 'We start from basics and build up gradually. By the end, you\'ll be writing scripts to automate common admin tasks.' },
        { q: 'What career paths does this open?', a: 'System Administrator, IT Administrator, Windows Server Engineer, and it\'s a great foundation for cloud and DevOps roles.' },
      ]}
    />
  );
}
