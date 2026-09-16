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
      {Bachelor of Science in Computer Science}{Aug. 2019 -- May 2023}
  \\resumeSubHeadingListEnd


%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

    \\resumeSubheading
      {Software Engineer}{June 2023 -- Present}
      {Tech Corp}{New York, NY}
      \\resumeItemListStart
        \\resumeItem{Built the platform's core API using Next.js and Node, reducing response times by 40\\%.}
        \\resumeItem{Shipped a unified messaging inbox (Email, Slack, SMS) with LLM-drafted replies.}
        \\resumeItem{Designed a distributed queue system for processing background tasks securely at scale.}
        \\resumeItem{Integrated 5 third-party account providers with secure OAuth workflows.}
      \\resumeItemListEnd

        \\resumeSubheading
      {Software Engineering Intern}{May 2022 -- August 2022}
      {Open Source Foundation}{Remote}
      \\resumeItemListStart
      \\resumeItem{Designed and implemented tools and APIs that allow contributors to explore and search data.}
        \\resumeItem{Built moderation and bulk-editing features to maintain data quality across the platform.}
        \\resumeItem{Developed a wizard and role-based workflows to streamline contributor onboarding.}
      \\resumeItemListEnd

  \\resumeSubHeadingListEnd


%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
  \\resumeProjectHeading
    {%
      \\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
        \\textbf{Project One} $|$ \\emph{TypeScript, Next.js, OpenAI} &
         \\href{https://github.com/johndoe/project-one}{\\underline{GitHub}} \\\\
      \\end{tabular*}
    }
    
          \\resumeItemListStart
          \\resumeItem{Built an autonomous data auditor that verifies records against live web evidence.}
            \\resumeItem{Generated per-field confidence scores and packaged verified changes securely.}
          \\resumeItemListEnd

            \\resumeProjectHeading
    {%
      \\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
        \\textbf{Project Two} $|$ \\emph{TypeScript, Next.js, Postgres} &
        \\href{https://github.com/johndoe/project-two}{\\underline{GitHub}} \\\\
      \\end{tabular*}
    }
    
          \\resumeItemListStart
          \\resumeItem{Built a full-stack application with an AI layer to batch-extract a knowledge graph.}
            \\resumeItem{Added LLM analysis powering insight dashboards and full-text search.}
          \\resumeItemListEnd
    \\resumeSubHeadingListEnd



%-----------MISC-----------
\\section{Achievements \\& Extracurricular}
\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=0pt]
    \\small{
    \\item{- Founded a university developer community (1,000+ members), organizing workshops and hackathons.}
    \\item{- Won 1st place at the National Collegiate Hackathon 2022.}
    }
\\end{itemize}


%-----------SKILLS-----------
\\section{Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
    \\item{
     \\textbf{Languages}{: JavaScript, TypeScript, Python, SQL, HTML/CSS} \\\\
     \\textbf{Frameworks}{: React, Next.js, Node.js, FastAPI, Tailwind CSS} \\\\
     \\textbf{Others}{: REST APIs, MongoDB, OAuth, Docker, Git, Linux} \\\\
    }
    }
\\end{itemize}



%-------------------------------------------
\\end{document}
`;
