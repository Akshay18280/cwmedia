import React from 'react';

export default function About() {
  const skills = [
    { category: "Languages", items: ["Go", "TypeScript", "Python", "Java"] },
    { category: "Frontend", items: ["React", "Next.js", "Tailwind CSS", "Redux"] },
    { category: "Backend", items: ["Node.js", "Express", "Django", "Spring Boot"] },
    { category: "Cloud & DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD"] },
    { category: "Databases", items: ["PostgreSQL", "MongoDB", "Redis", "Elasticsearch"] }
  ];

  const experience = [
    {
      company: "Tech Innovators Inc.",
      position: "Senior Software Engineer",
      period: "2021 - Present",
      description: "Leading the development of cloud-native applications and microservices architecture."
    },
    {
      company: "Digital Solutions Ltd.",
      position: "Full Stack Developer",
      period: "2019 - 2021",
      description: "Developed and maintained enterprise-level web applications using React and Node.js."
    },
    {
      company: "Cloud Systems Corp.",
      position: "DevOps Engineer",
      period: "2017 - 2019",
      description: "Implemented CI/CD pipelines and managed cloud infrastructure on AWS."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">About Akshay</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Senior Software Engineer & Cloud Architect
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
            A passionate software engineer with over 7 years of experience in full-stack development,
            cloud architecture, and DevOps. Specialized in building scalable microservices and
            cloud-native applications. Currently focused on Go, React, and AWS technologies.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Education</h3>
              <div className="text-gray-600 dark:text-gray-400">
                <p className="font-medium">Master of Computer Science</p>
                <p>Technical University</p>
                <p className="text-sm">2015 - 2017</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contact</h3>
              <div className="text-gray-600 dark:text-gray-400">
                <p>contact@carelwavemedia.com</p>
                <div className="flex space-x-4 mt-2">
                  <a href="https://github.com/akshaymedia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                    GitHub
                  </a>
                  <a href="https://linkedin.com/in/akshaymedia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
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