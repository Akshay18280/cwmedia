import React from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

export default function HomePage() {
  const technologies = [
    "Golang", "Terraform", "AWS", "Redis",
    "Docker", "Kubernetes", "Grafana", "CI/CD",
    "Git", "SQL", "PowerShell", "Linux",
  ];

  return (
    <main className="font-sans text-gray-800 dark:text-white bg-white dark:bg-gray-900 min-h-screen px-6 py-10">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <img
          src="/images/akshay.png" // Add your image in public/images folder
          alt="Akshay Verma"
          className="w-40 h-40 mx-auto rounded-full shadow-xl object-cover"
        />
        <h1 className="text-4xl font-extrabold tracking-tight">Akshay Verma</h1>
        <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
          Backend Engineer | Golang, AWS & DevOps Specialist
        </p>
        <div className="flex justify-center space-x-4 pt-2">
          <a href="mailto:youremail@gmail.com" className="hover:text-blue-400">
            <FaEnvelope size={24} />
          </a>
          <a href="https://github.com/AkshayVvv" target="_blank" rel="noopener noreferrer">
            <FaGithub size={24} />
          </a>
          <a href="https://linkedin.com/in/akshay-verma" target="_blank" rel="noopener noreferrer">
            <FaLinkedin size={24} />
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="my-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">About Me</h2>
        <p className="leading-relaxed text-lg">
          I’m a backend engineer with a strong focus on Golang, AWS, and scalable microservices. I’ve worked extensively
          on <strong>Ascendon</strong>, a telecom platform used by global clients like Claro Brazil, CBTS, and M1. My
          role involved building charging modules, handling telecom and non-telecom rating events, optimizing Redis-based
          aggregators with TTL logic, and deploying secure and cost-optimized infrastructure via Terraform and AWS. I'm
          passionate about solving real-time problems and building fault-tolerant, high-performance systems.
        </p>
      </section>

      {/* Technologies Section */}
      <section className="my-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">Technologies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center font-semibold shadow hover:scale-105 transition-transform"
            >
              {tech}
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section className="my-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">Projects</h2>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h3 className="text-2xl font-semibold">Ascendon Platform - CSG</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Enhanced the real-time charging and rating systems for telecom clients. Worked on Redis-based aggregations,
              DynamoDB optimizations, and built scalable Go microservices handling high-throughput UDR data.
              Deployed secure infrastructure with Terraform, improved monitoring via Grafana, and resolved production
              issues ensuring 99.99% uptime.
            </p>
            <div className="mt-2 text-sm text-gray-500">Tech: Golang, AWS, Redis, Terraform, Docker, K8s, SQL</div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="my-12 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Let’s Connect</h2>
        <p className="text-lg mb-6">
          Open to freelance, full-time roles, or just a good tech conversation.
        </p>
        <a
          href="mailto:youremail@gmail.com"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
        >
          Send me an Email
        </a>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 pt-10">
        © {new Date().getFullYear()} Akshay Verma. All rights reserved.
      </footer>
    </main>
  );
}
