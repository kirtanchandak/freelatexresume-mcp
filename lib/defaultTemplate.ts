export const defaultLatexTemplate = `\\\\documentclass[letterpaper,11pt]{article}

\\\\usepackage[utf8]{inputenc}
\\\\usepackage[T1]{fontenc}
\\\\usepackage{lmodern}
\\\\usepackage[margin=0.75in]{geometry}
\\\\usepackage{enumitem}
\\\\usepackage{titlesec}
\\\\usepackage{hyperref}

% Section formatting
\\\\titleformat{\\\\section}{\\\\large\\\\bfseries\\\\scshape}{}{0em}{}[\\\\titlerule]
\\\\titlespacing*{\\\\section}{0pt}{6pt}{4pt}

% Remove page numbers
\\\\pagestyle{empty}

% Tight list spacing
\\\\setlist[itemize]{nosep, leftmargin=1.5em}

\\\\begin{document}

%----------HEADING----------
\\\\begin{center}
  {\\\\Huge\\\\textbf{John Doe}} \\\\\\\\[4pt]
  San Francisco, CA \\\\quad
  \\\\href{mailto:john@example.com}{john@example.com} \\\\quad
  \\\\href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe} \\\\quad
  \\\\href{https://github.com/johndoe}{github.com/johndoe}
\\\\end{center}

%----------EXPERIENCE----------
\\\\section{Experience}

\\\\textbf{Senior Software Engineer} \\\\hfill Jan 2022 -- Present \\\\\\\\
\\\\textit{Acme Corp, San Francisco, CA}
\\\\begin{itemize}
  \\\\item Led migration of monolithic application to microservices, reducing deployment time by 60\\\\%.
  \\\\item Designed and implemented real-time data pipeline processing 2M+ events/day using Kafka and Flink.
  \\\\item Mentored 4 junior engineers; established code review standards adopted across the org.
\\\\end{itemize}

\\\\vspace{4pt}
\\\\textbf{Software Engineer} \\\\hfill Jun 2019 -- Dec 2021 \\\\\\\\
\\\\textit{Startup Inc, New York, NY}
\\\\begin{itemize}
  \\\\item Built REST APIs serving 10K+ RPM with Node.js and PostgreSQL; achieved 99.9\\\\% uptime.
  \\\\item Developed internal CLI tooling that reduced developer onboarding time from 2 days to 3 hours.
  \\\\item Contributed to open-source projects with 500+ GitHub stars.
\\\\end{itemize}

%----------EDUCATION----------
\\\\section{Education}

\\\\textbf{B.S. in Computer Science} \\\\hfill Aug 2015 -- May 2019 \\\\\\\\
\\\\textit{University of California, Berkeley}
\\\\begin{itemize}
  \\\\item GPA: 3.8/4.0 \\\\quad Dean's List (6 semesters)
\\\\end{itemize}

%----------SKILLS----------
\\\\section{Skills}

\\\\textbf{Languages:} TypeScript, Python, Go, Java, SQL \\\\\\\\
\\\\textbf{Frameworks:} React, Next.js, Node.js, FastAPI, Spring Boot \\\\\\\\
\\\\textbf{Tools:} Docker, Kubernetes, Terraform, AWS, GCP, PostgreSQL, Redis, Kafka

%----------PROJECTS----------
\\\\section{Projects}

\\\\textbf{Open Source Contribution Tracker} \\\\hfill \\\\href{https://github.com/johndoe/osc-tracker}{GitHub}
\\\\begin{itemize}
  \\\\item Full-stack app to track and visualize open source contributions across organizations.
  \\\\item Built with Next.js, Prisma, and PostgreSQL; deployed on Vercel with CI/CD via GitHub Actions.
\\\\end{itemize}

\\\\end{document}
`;
