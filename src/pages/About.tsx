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
  description: `• Led production support, end-to-end testing, and DevOps tasks across distributed microservices, leveraging AWS (CloudWatch, IAM) and observability tools like Grafana.
• Implemented critical automation to reduce manual overhead, including IAM access key rotation, daily log analysis, automated sanity checks (E2E), CI/CD deployments, and dev resource cleanup.
• Enhanced core logic for event search, rating, revocation, and reprocessing workflows to meet evolving client needs (CBTS, Claro Brazil, CBA, M1, etc.).
• Improved error handling and logging for better traceability and faster issue resolution.
• Mentored new engineers and interns by providing architectural guidance, assigning development tasks, and conducting in-depth PR reviews.
• Built a multi-BU (business unit) infrastructure architecture that reduced AWS costs by over 50% through efficient resource allocation and usage tracing.`
},
{
  company: "CSG International",
  position: "Software Developer Intern",
  period: "2021 - 2022",
  description: `• Contributed to the development of scalable microservices to support high-volume event handling.
• Delivered key features and bug fixes that enhanced platform stability and customer satisfaction.`
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
            src="/me.jpeg"
            alt="Akshay Verma"
            className="rounded-full w-32 h-32 mx-auto shadow-lg border-4 border-white"
          />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Professional Summary</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Passionate and results-driven Software Developer with 3+ years of experience specializing in Golang, AWS, Terraform, and DevOps.
            Proven expertise in building scalable microservices and cloud-native solutions for high-performance environments.
            Adept at automating infrastructure, optimizing cloud costs, and delivering end-to-end feature implementations.
            Currently focused on Golang backend systems and the AWS ecosystem to drive innovation and engineering efficiency.
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