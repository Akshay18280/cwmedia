import React from "react";

export default function About() {
  const skills = [
    {
      category: "Core Technologies",
      items: [
        "Golang",
        "Terraform",
        "AWS",
        "Redis",
        "Docker",
        "Kubernetes",
        "DevOps",
        "Grafana",
        "CI/CD",
        "Git",
        "VS Code",
        "SQL",
        "PowerShell",
        "Bash",
        "Linux",
      ],
    },
  ];

  const experience = [
    {
      company: "CSG International",
      position: "Software Developer",
      period: "2022 - Present",
      description: `• Led production support, end-to-end testing, and DevOps tasks across distributed microservices, leveraging AWS (CloudWatch, IAM) and observability tools like Grafana.
• Implemented automation for IAM key rotation, log analysis, sanity checks, CI/CD pipelines, and resource cleanup.
• Enhanced rating, event search, revocation, and reprocessing workflows to meet client needs (CBTS, Claro Brazil, CBA, M1).
• Improved logging and error handling for faster issue resolution.
• Mentored engineers and interns with architectural guidance and code reviews.
• Built multi-business-unit infrastructure reducing AWS costs by over 50% through optimization and usage tracing.`,
    },
    {
      company: "CSG International",
      position: "Software Developer Intern",
      period: "2021 - 2022",
      description: `• Developed scalable microservices supporting high-volume telecom events.
• Delivered critical features and bug fixes improving platform stability.`,
    },
  ];

  const projects = [
    {
      name: "Ascendon Telecom Product",
      description: `Played a key role in architecting and enhancing the Ascendon platform — a comprehensive telecom billing and customer experience system — by:
- Designing and implementing highly scalable Golang microservices for event rating, charging, and policy enforcement.
- Building automated CI/CD pipelines using Terraform, AWS CodePipeline, and Kubernetes, enabling rapid, reliable deployments.
- Developing advanced monitoring and alerting dashboards with Grafana to ensure system health and uptime.
- Optimizing Redis caching strategies for real-time data handling and improved performance.
- Leading DevOps initiatives to automate infrastructure provisioning and cost optimization across multi-region AWS environments.
- Streamlining troubleshooting and debugging with enhanced logging, observability, and production support best practices.

This work significantly improved system scalability, reduced deployment times by 40%, and enhanced operational visibility, making Ascendon a trusted platform for multiple Tier-1 telecom clients.`,
      link: "https://www.csgi.com/ascendon/", // hypothetical public link
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
      {/* Header */}
      <header className="text-center mb-14">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          About Akshay Verma
        </h1>
        <p className="mt-4 text-xl font-medium text-indigo-600 dark:text-indigo-400">
          Software Developer & Cloud Enthusiast
        </p>
      </header>

      {/* Top Section: Image + Summary + Contact/Education */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-16">
        <div className="flex justify-center lg:justify-start">
          {/* Add fallback alt background color and text */}
          <img
            src="/me.jpeg"
            alt="Akshay Verma"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://via.placeholder.com/160?text=Akshay+Verma";
            }}
            className="rounded-full w-40 h-40 shadow-2xl border-4 border-indigo-500 transition-transform duration-300 hover:scale-105 object-cover"
          />
        </div>

        <article className="lg:col-span-2 space-y-6 text-gray-700 dark:text-gray-300">
          <h2 className="text-3xl font-semibold tracking-wide text-gray-900 dark:text-white">
            Professional Summary
          </h2>
          <p className="leading-relaxed text-lg max-w-3xl">
            Passionate and results-driven Software Developer with 3+ years of
            experience specializing in Golang, AWS, Terraform, and DevOps.
            Proven expertise in building scalable microservices and cloud-native
            solutions for high-performance environments. Adept at automating
            infrastructure, optimizing cloud costs, and delivering end-to-end
            feature implementations. Currently focused on Golang backend systems
            and the AWS ecosystem to drive innovation and engineering efficiency.
          </p>

          <div className="flex flex-col md:flex-row md:space-x-12">
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                Education
              </h3>
              <div className="text-gray-800 dark:text-gray-300 space-y-1">
                <p className="font-semibold">B.Tech in Computer Science</p>
                <p>SVVV University</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">2018 - 2022</p>
              </div>
            </div>
            <div className="mt-8 md:mt-0">
              <h3 className="text-2xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                Contact
              </h3>
              <p className="text-gray-800 dark:text-gray-300">
                akshayvermajan28@gmail.com
              </p>
              <nav className="flex space-x-6 mt-3">
                <a
                  href="https://github.com/Akshay18280"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
                  aria-label="GitHub Profile"
                >
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/akshay-verma-024aa0152/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
                  aria-label="LinkedIn Profile"
                >
                  LinkedIn
                </a>
              </nav>
            </div>
          </div>
        </article>
      </div>

      {/* Quote */}
      <blockquote className="max-w-4xl mx-auto mb-16 border-l-4 border-indigo-600 pl-6 italic text-gray-700 dark:text-gray-400 text-lg">
        "Strive not just to build software, but to build impactful experiences
        that empower users and businesses alike."
      </blockquote>

      {/* Technical Skills */}
      <section className="mb-20">
        <h2 className="text-3xl font-extrabold mb-10 text-gray-900 dark:text-white text-center">
          Technical Skills
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map(({ category, items }) => (
            <div
              key={category}
              className="bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-5 text-indigo-700 dark:text-indigo-300">
                {category}
              </h3>
              <ul className="flex flex-wrap gap-3">
                {items.map((skill) => (
                  <li
                    key={skill}
                    className="inline-block px-4 py-1 bg-indigo-200 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-100 rounded-full font-medium text-sm cursor-default select-none transition-transform transform hover:scale-110"
                    aria-label={`${skill} skill`}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <h2 className="text-3xl font-extrabold mb-10 text-gray-900 dark:text-white text-center">
          Projects
        </h2>
        <div className="max-w-5xl mx-auto space-y-10">
          {projects.map(({ name, description, link }, idx) => (
            <article
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8 transition-transform hover:-translate-y-1 hover:shadow-2xl"
              aria-labelledby={`project-title-${idx}`}
            >
              <header className="mb-4">
                <h3
                  id={`project-title-${idx}`}
                  className="text-2xl font-semibold text-indigo-700 dark:text-indigo-300"
                >
                  {name}
                </h3>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    aria-label={`${name} project link`}
                  >
                    Learn more &rarr;
                  </a>
                )}
              </header>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-lg">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Professional Experience */}
      <section className="mt-20">
        <h2 className="text-3xl font-extrabold mb-10 text-gray-900 dark:text-white text-center">
          Professional Experience
        </h2>
        <div className="space-y-10 max-w-5xl mx-auto">
          {experience.map(({ company, position, period, description }, idx) => (
            <article
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8 transition-transform hover:-translate-y-1 hover:shadow-2xl"
              aria-labelledby={`experience-title-${idx}`}
            >
              <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <div>
                  <h3
                    id={`experience-title-${idx}`}
                    className="text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {position}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium">{company}</p>
                </div>
                <time
                  className="mt-2 md:mt-0 text-gray-500 dark:text-gray-400 font-mono text-sm"
                  dateTime={period.replace(/\s+/g, "")}
                >
                  {period}
                </time>
              </header>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-lg">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
