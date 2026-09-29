export const defaultLatexTemplate = `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.6in}
\\addtolength{\\textheight}{1.2in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-7pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-4pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape John Doe} \\\\ \\vspace{1pt}
    \\small +1-123-456-7890 $|$ \\href{mailto:john@example.com}{\\underline{john@example.com}} $|$ 
    \\href{https://linkedin.com/in/johndoe}{\\underline{linkedin.com/in/johndoe}} $|$
    \\href{https://github.com/johndoe}{\\underline{github.com/johndoe}}
\\end{center}


%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University of Technology}{City, ST}
      {Master of Science in Computer Science; GPA: 3.9/4.0}{Aug. 2023 -- May 2025}
    \\resumeSubheading
      {University of Technology}{City, ST}
      {Bachelor of Science in Computer Science; Minor in Mathematics}{Aug. 2019 -- May 2023}
  \\resumeSubHeadingListEnd


%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

    \\resumeSubheading
      {Senior Software Engineer}{June 2023 -- Present}
      {Tech Corp}{New York, NY}
      \\resumeItemListStart
        \\resumeItem{Spearheaded the migration of a legacy monolithic architecture to a microservices-based system using Node.js, Go, and Docker, resulting in a 40\\% reduction in API response times.}
        \\resumeItem{Designed and implemented a scalable distributed messaging queue using Apache Kafka, processing over 5 million events daily with zero data loss and significantly improved fault tolerance.}
        \\resumeItem{Mentored a team of 4 junior developers, conducting code reviews, pair programming sessions, and architectural planning to improve overall team velocity by 25\\%.}
        \\resumeItem{Integrated 5 third-party account providers with secure OAuth workflows, ensuring enterprise-grade security compliance and seamless single sign-on (SSO) for 50k+ enterprise users.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Software Engineering Intern}{May 2022 -- August 2022}
      {Open Source Foundation}{Remote}
      \\resumeItemListStart
        \\resumeItem{Engineered robust internal tooling and RESTful APIs using Python and Django to allow 10,000+ open-source contributors to seamlessly explore, search, and edit structured global datasets.}
        \\resumeItem{Built automated content moderation pipelines leveraging Natural Language Processing (NLP) to detect and flag spam submissions, improving data accuracy and quality by 35\\%.}
        \\resumeItem{Developed a multi-step property generation wizard using React and Redux, cutting the average time required for new contributors to properly format and submit data by over half.}
      \\resumeItemListEnd
      
    \\resumeSubheading
      {Undergraduate Research Assistant}{Sept 2021 -- May 2022}
      {University Computer Vision Lab}{City, ST}
      \\resumeItemListStart
        \\resumeItem{Collaborated with PhD candidates to train and evaluate deep convolutional neural networks (CNNs) using PyTorch, focusing on real-time object detection for autonomous driving simulations.}
        \\resumeItem{Optimized data pre-processing scripts in Python, reducing image dataset load times by 20\\% and accelerating the model training pipeline on university GPU clusters.}
      \\resumeItemListEnd

  \\resumeSubHeadingListEnd


%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
  \\resumeProjectHeading
    {%
      \\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
        \\textbf{Autonomous Data Auditor} $|$ \\emph{TypeScript, Next.js, OpenAI, PostgreSQL} &
         \\href{https://github.com/johndoe/project-one}{\\underline{GitHub}} \\\\
      \\end{tabular*}
    }
    
          \\resumeItemListStart
          \\resumeItem{Constructed a multi-agent AI pipeline utilizing GPT-4 to autonomously audit B2B CRM records against live web evidence, successfully identifying and correcting data drift across thousands of records.}
            \\resumeItem{Engineered a real-time review dashboard using Next.js and Server-Sent Events (SSE) to display per-field confidence scores and package verified changes as actionable \\textit{Data Pull Requests}.}
          \\resumeItemListEnd

  \\resumeProjectHeading
    {%
      \\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
        \\textbf{Insight Journal} $|$ \\emph{React, Node.js, Express, MongoDB} &
        \\href{https://github.com/johndoe/project-two}{\\underline{GitHub}} \\\\
      \\end{tabular*}
    }
    
          \\resumeItemListStart
          \\resumeItem{Developed a secure, full-stack journaling application supporting end-to-end encrypted entries, utilizing a custom-built cryptographic module for robust user privacy and data protection.}
            \\resumeItem{Integrated an automated sentiment analysis layer running via CRON jobs to generate personalized weekly mood insights, visualizing emotional trends using interactive D3.js charts.}
          \\resumeItemListEnd
          
  \\resumeProjectHeading
    {%
      \\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
        \\textbf{Distributed File System} $|$ \\emph{C++, gRPC, POSIX Threads} &
        \\href{https://github.com/johndoe/project-three}{\\underline{GitHub}} \\\\
      \\end{tabular*}
    }
    
          \\resumeItemListStart
          \\resumeItem{Built a fault-tolerant distributed file system from scratch in C++, featuring master-worker node architecture, file chunking, replication, and automatic failure recovery.}
          \\resumeItemListEnd
    \\resumeSubHeadingListEnd



%-----------MISC-----------
\\section{Achievements \\& Extracurricular}
\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=0pt]
    \\small{
    \\item{- \\textbf{Founder \\& President, University Developer Community:} Grew the organization to over 1,000 active members, organized 15+ technical workshops, and hosted the university's largest annual hackathon.}
    \\item{- \\textbf{Hackathon Winner:} 1st Place at National Collegiate Hackathon 2022 out of 300+ participating teams.}
    \\item{- \\textbf{Open Source Contributor:} Merged over 20+ PRs into popular Javascript frameworks, improving documentation and fixing edge-case rendering bugs.}
    }
\\end{itemize}


%-----------SKILLS-----------
\\section{Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
    \\item{
     \\textbf{Languages}{: JavaScript, TypeScript, Python, C++, Java, SQL (PostgreSQL, MySQL), HTML/CSS} \\\\
     \\textbf{Frameworks}{: React, Next.js, Node.js, Express, Django, FastAPI, Tailwind CSS, Material-UI} \\\\
     \\textbf{Developer Tools}{: Git, Docker, Kubernetes, AWS (EC2, S3, RDS), CI/CD (GitHub Actions), Linux} \\\\
    }
    }
\\end{itemize}



%-------------------------------------------
\\end{document}
`;
