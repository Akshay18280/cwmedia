import React from 'react';

export default function About() {
  const skills = [
    { category: "Languages", items: ["Go", "Python"] },
    { category: "Frontend", items: ["React", "Tailwind CSS"] },
    { category: "Backend", items: ["Node.js", "Express", "Django", "Spring Boot"] },
    { category: "Cloud & DevOps", items: ["AWS", "Docker", "Azure DevOps", "Kubernetes", "CI/CD"] },
    { category: "Databases", items: ["PostgreSQL", "Redis", "Elasticsearch"] }
  ];

  const experience = [
    {
      company: "CSG International",
      position: "Software Developer",
      period: "2022 - Present",
      description: "Proficient in production support, E2E testing, and DevOps activities. Used Grafana, CloudWatch AWS service to\n  monitor and debug. Introduced Alarms.\n• Automated manual operations which increased team capacity. Such as Automated IAM access key rotations,\n Automated Sanity(E2E), Daily CloudWatch log scans & Automated Deployments, Development account resource\n cleanup.\n• Enhanced Logic for search events, rate, revoke & reprocess using metadata as per the client requirements.\nEnhanced Error logging scenarios.\n• Contributed and mentored new engineers & Interns in the team, providing guidance and assigning tasks. Reviewed\nPR’s and provided valuable feedbacks.\n• Monitored, and traced the resources which are the reason in increasing cost, Developed Multi BU Infrastructure\nwhich helped in cutting down the cost by more than 50%."
    },
    {
      company: "Digital Solutions Ltd.",
      position: "Software Developer Intern",
      period: "2019 - 2021",
      description: "• Executed feature implementations and resolved bugs, contributing to product enhancements.\n• Designed and developed scalable microservices to handle high-volume events effectively."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">About Akshay</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Software Developer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400"
            alt="Profile"
            className="rounded-lg shadow-lg w-full"
          />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Professional Summary</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A passionate software developer with over 3 years of experience in GoLang,
            AWS, Terraform and DevOps. Specialized in building scalable microservices and
            cloud-native applications. Currently focused on Go, React, and AWS technologies.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Education</h3>
              <div className="text-gray-600 dark:text-gray-400">
                <p className="font-medium">B.Tech in Computer Science</p>
                <p>SVVV University</p>
                <p className="text-sm">2018 - 2022</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contact</h3>
              <div className="text-gray-600 dark:text-gray-400">
                <p>akshayvermajan28@gmail.com</p>
                <div className="flex space-x-4 mt-2">
                  <a href="https://github.com/Akshay18280" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/akshay-verma-024aa0152/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Technical Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skillGroup) => (
            <div key={skillGroup.category} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{skillGroup.category}</h3>
              <div className="flex flex-wrap gap-2">
                {skillGroup.items.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Professional Experience</h2>
        <div className="space-y-6">
          {experience.map((exp, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{exp.position}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{exp.period}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}