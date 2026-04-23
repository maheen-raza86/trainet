import CourseDetailTemplate from '@/components/public/CourseDetailTemplate';

export default function DevOpsPage() {
  return (
    <CourseDetailTemplate
      title="DevOps Engineering"
      subtitle="Master CI/CD pipelines, Docker, Kubernetes, cloud deployment, and modern automation practices."
      gradient="from-blue-900 via-cyan-900 to-slate-900"
      duration="8–10 Weeks"
      difficulty="Intermediate"
      icon="⚙️"
      heroImage="/Devops.png"
      overview="This bootcamp-style course covers the complete DevOps lifecycle — from Linux fundamentals to production-grade Kubernetes deployments. You'll build real pipelines and deploy real applications."
      whyMatters="DevOps engineers bridge development and operations, enabling faster, more reliable software delivery. Companies of all sizes are hiring DevOps professionals to modernize their infrastructure."
      outcomes={[
        'Navigate and administer Linux systems confidently',
        'Use Git and GitHub for version control and collaboration',
        'Design and implement CI/CD pipelines from scratch',
        'Build and manage Jenkins automation servers',
        'Containerize applications with Docker',
        'Orchestrate containers at scale with Kubernetes',
        'Write Infrastructure as Code using Terraform',
        'Deploy applications to AWS cloud environments',
        'Implement monitoring and logging with Prometheus and Grafana',
        'Automate repetitive tasks with shell scripting',
        'Manage secrets and configuration securely',
        'Complete a full end-to-end deployment project',
      ]}
      modules={[
        { week: 'Week 1', title: 'Linux Fundamentals', topics: ['File system navigation', 'User and permission management', 'Shell scripting basics', 'Package management'] },
        { week: 'Week 2', title: 'Git & GitHub', topics: ['Version control concepts', 'Branching strategies', 'Pull requests and code review', 'GitHub Actions intro'] },
        { week: 'Week 3', title: 'CI/CD Concepts', topics: ['Continuous integration principles', 'Continuous delivery vs deployment', 'Pipeline design patterns', 'Testing in pipelines'] },
        { week: 'Week 4', title: 'Jenkins', topics: ['Jenkins installation and setup', 'Freestyle vs pipeline jobs', 'Jenkinsfile syntax', 'Multi-branch pipelines'] },
        { week: 'Week 5', title: 'Docker', topics: ['Container concepts', 'Dockerfile authoring', 'Docker Compose', 'Image optimization'] },
        { week: 'Week 6', title: 'Kubernetes', topics: ['K8s architecture', 'Pods, deployments, services', 'ConfigMaps and secrets', 'Helm charts'] },
        { week: 'Week 7', title: 'Infrastructure as Code', topics: ['Terraform basics', 'AWS provider', 'State management', 'Modules and workspaces'] },
        { week: 'Week 8', title: 'Cloud Deployment', topics: ['AWS EC2 and ECS', 'Load balancers', 'Auto-scaling groups', 'RDS and S3'] },
        { week: 'Week 9', title: 'Monitoring & Logging', topics: ['Prometheus setup', 'Grafana dashboards', 'ELK stack basics', 'Alerting rules'] },
        { week: 'Week 10', title: 'Final Deployment Project', topics: ['Full-stack app containerization', 'CI/CD pipeline build', 'K8s deployment', 'Monitoring setup'] },
      ]}
      tools={['Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'Terraform', 'AWS', 'Prometheus', 'Grafana', 'Helm', 'Linux']}
      careers={[
        { title: 'DevOps Engineer', demand: 'Very high demand · $85k–$140k', color: 'from-blue-500/20 to-cyan-500/20' },
        { title: 'Site Reliability Engineer', demand: 'High demand · $100k–$160k', color: 'from-cyan-500/20 to-blue-500/20' },
        { title: 'Cloud Engineer', demand: 'Growing fast · $80k–$130k', color: 'from-blue-600/20 to-indigo-500/20' },
        { title: 'Platform Engineer', demand: 'Emerging role · $90k–$145k', color: 'from-indigo-500/20 to-blue-500/20' },
      ]}
      faqs={[
        { q: 'Do I need programming experience?', a: 'Basic scripting knowledge helps but is not required. We cover Linux and shell scripting from the ground up.' },
        { q: 'Is Docker and Kubernetes covered in depth?', a: 'Yes. We dedicate full weeks to both Docker and Kubernetes with hands-on labs and real deployments.' },
        { q: 'Will I deploy to real cloud?', a: 'Yes. You will deploy applications to AWS as part of the course using free-tier resources.' },
        { q: 'What is the final project?', a: 'You will build a complete CI/CD pipeline for a full-stack application, containerize it, and deploy it to Kubernetes on AWS.' },
        { q: 'Is this course suitable for developers?', a: 'Absolutely. Developers who understand DevOps are highly valued. This course bridges the gap between coding and operations.' },
      ]}
    />
  );
}
