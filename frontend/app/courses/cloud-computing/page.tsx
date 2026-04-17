import CourseDetailTemplate from '@/components/public/CourseDetailTemplate';

export default function CloudComputingPage() {
  return (
    <CourseDetailTemplate
      title="Cloud Computing"
      subtitle="Learn modern cloud infrastructure, virtualization, multi-cloud deployment, and enterprise scaling strategies."
      gradient="from-sky-900 via-blue-900 to-slate-900"
      duration="6–8 Weeks"
      difficulty="Beginner"
      icon="☁️"
      overview="This course covers cloud computing from fundamentals to hands-on deployment across AWS, Azure, and Google Cloud. You'll learn to architect, deploy, and manage cloud infrastructure used by modern enterprises."
      whyMatters="Cloud computing is the foundation of modern IT. Every company is migrating to the cloud. Cloud professionals are among the highest-paid in tech, with demand growing faster than supply."
      outcomes={[
        'Understand cloud computing concepts and service models',
        'Differentiate between IaaS, PaaS, and SaaS',
        'Deploy and manage virtual machines on AWS',
        'Work with Azure services and the Azure portal',
        'Use Google Cloud Platform for basic deployments',
        'Configure cloud storage, databases, and networking',
        'Deploy web applications to cloud environments',
        'Implement cloud security best practices',
        'Set up backup and disaster recovery solutions',
        'Monitor cloud resources and optimize costs',
        'Scale applications automatically using cloud services',
      ]}
      modules={[
        { week: 'Week 1', title: 'Introduction to Cloud', topics: ['What is cloud computing?', 'Cloud deployment models', 'Benefits and challenges', 'Major cloud providers'] },
        { week: 'Week 2', title: 'Service Models (IaaS, PaaS, SaaS)', topics: ['IaaS deep dive', 'PaaS platforms', 'SaaS examples', 'Choosing the right model'] },
        { week: 'Week 3', title: 'AWS Basics', topics: ['AWS console navigation', 'EC2 instances', 'S3 storage', 'IAM users and roles'] },
        { week: 'Week 4', title: 'Azure Basics', topics: ['Azure portal overview', 'Azure VMs', 'Azure Blob Storage', 'Azure Active Directory'] },
        { week: 'Week 5', title: 'Virtual Machines & Networking', topics: ['VM configuration', 'Virtual networks (VPC/VNet)', 'Security groups', 'Load balancers'] },
        { week: 'Week 6', title: 'Storage & Databases', topics: ['Object vs block storage', 'RDS and managed databases', 'NoSQL options', 'Backup strategies'] },
        { week: 'Week 7', title: 'Deployment & Security', topics: ['Application deployment', 'SSL/TLS certificates', 'Cloud security best practices', 'Compliance basics'] },
        { week: 'Week 8', title: 'Scaling & Monitoring', topics: ['Auto-scaling groups', 'CloudWatch monitoring', 'Cost optimization', 'Final cloud project'] },
      ]}
      tools={['AWS', 'Microsoft Azure', 'Google Cloud Platform', 'Terraform', 'Docker', 'CloudWatch', 'Azure Monitor']}
      careers={[
        { title: 'Cloud Engineer', demand: 'Very high demand · $85k–$135k', color: 'from-sky-500/20 to-blue-500/20' },
        { title: 'Cloud Administrator', demand: 'High demand · $70k–$110k', color: 'from-blue-500/20 to-cyan-500/20' },
        { title: 'AWS Associate', demand: 'Certification valued · $75k–$120k', color: 'from-cyan-500/20 to-sky-500/20' },
      ]}
      faqs={[
        { q: 'Do I need prior IT experience?', a: 'Basic computer literacy is sufficient. The course starts from cloud fundamentals and builds progressively.' },
        { q: 'Will I work with real cloud services?', a: 'Yes. You will use AWS free tier, Azure free account, and GCP free tier for hands-on labs.' },
        { q: 'Does this prepare me for AWS certification?', a: 'Yes. The AWS modules align with the AWS Cloud Practitioner and Solutions Architect Associate exam objectives.' },
        { q: 'Is cloud computing expensive to learn?', a: 'No. All major cloud providers offer free tiers that are more than sufficient for learning and completing this course.' },
        { q: 'What is the job market like for cloud professionals?', a: 'Excellent. Cloud skills are among the most in-demand in tech globally, with salaries consistently above industry average.' },
      ]}
    />
  );
}
