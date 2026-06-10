\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{resume}[2026/06/10 Academic CV class adapted from billryan/resume]
\LoadClass[10pt]{article}

\setlength{\parindent}{0pt}
\AtBeginDocument{\fontsize{10.3pt}{11.95pt}\selectfont}

\RequirePackage{xifthen}
\RequirePackage{hyperref}
\hypersetup{hidelinks}
\RequirePackage{url}
\urlstyle{tt}
\RequirePackage{fontawesome}
\RequirePackage{fontspec}
\RequirePackage{geometry}
\RequirePackage{titlesec}
\RequirePackage{enumitem}
\RequirePackage{xcolor}
\RequirePackage{tabularx}
\RequirePackage[super]{nth}

\definecolor{THUPurple}{HTML}{660874}
\definecolor{THUPurpleMuted}{HTML}{7A2E83}

\setmainfont[
  Path = fonts/Main/ ,
  Extension = .otf ,
  UprightFont = *-regular ,
  BoldFont = *-bold ,
  ItalicFont = *-italic ,
  BoldItalicFont = *-bolditalic ,
  SmallCapsFont = Fontin-SmallCaps
]{texgyretermes}

\geometry{
  a4paper,
  left=0.55in,
  right=0.55in,
  top=0.62in,
  bottom=0.62in,
  nohead
}

\setlist{noitemsep}
\setlist[itemize]{topsep=0.05em, leftmargin=1.0pc}
\setlist[enumerate]{topsep=0.05em, leftmargin=1.0pc}
\setlength{\tabcolsep}{0pt}

\titleformat{\section}
  {\fontsize{11.4pt}{12.2pt}\selectfont\scshape\raggedright\color{THUPurple}}
  {}{0em}
  {}
  [{\color{THUPurple}\titlerule}]
\titlespacing*{\section}{0cm}{*1.15}{*0.80}

\titleformat{\subsection}
  {\normalsize\raggedright}
  {}{0em}
  {}
\titlespacing*{\subsection}{0cm}{*0.65}{*0.18}

\newcommand{\datedsection}[2]{%
  \section[#1]{#1 \hfill #2}%
}

\newcommand{\datedsubsection}[2]{%
  \subsection[#1]{\textbf{#1} \hfill {\normalfont #2}}%
}

\newcommand{\datedline}[2]{%
  {\par #1 \hfill #2 \par}%
}

\newcommand{\tightdatedline}[2]{%
  \begin{tabularx}{\textwidth}{@{}X r@{}}
    #1 & #2
  \end{tabularx}\par
}

\newcommand{\name}[1]{%
  \centerline{\Huge\scshape{\color{THUPurple}#1}}%
  \vspace{0.25ex}%
}

\newcommand{\email}[1]{\faEnvelope\ \href{mailto:#1}{#1}}
\newcommand{\phone}[1]{\faPhone\ {#1}}

\newcommand{\linkedin}[2][]{\faLinkedin\ 
  \ifthenelse{\isempty{#1}}%
    {\href{#2}{#2}}%
    {\href{#2}{#1}}}

\newcommand{\github}[2][]{\faGithub\ 
  \ifthenelse{\isempty{#1}}%
    {\href{#2}{#2}}%
    {\href{#2}{#1}}}

\newcommand{\homepage}[2][]{\faGlobe\ 
  \ifthenelse{\isempty{#1}}%
    {\href{#2}{#2}}%
    {\href{#2}{#1}}}

\newcommand{\scholar}[2][]{\faGoogle\ 
  \ifthenelse{\isempty{#1}}%
    {\href{#2}{#2}}%
    {\href{#2}{#1}}}

\newcommand{\basicInfo}[1]{%
  \begin{center}
    {\sffamily\footnotesize #1}
  \end{center}
  \vspace{-1.1ex}
}

\newcommand{\role}[2]{%
  {\par \textit{#1} {\color{THUPurpleMuted}\textbar}\ #2 \par}
  \vspace{0.16ex}
}

\newcommand{\outcome}[2]{%
  {\par\hangindent=0.62in\hangafter=1
  \makebox[0.62in][l]{\textcolor{THUPurpleMuted}{\textbf{#1:}}}#2\par}
}

\newcommand{\publication}[6]{%
  \begin{tabular*}{\textwidth}{@{}p{0.37in}@{}p{0.82\textwidth}@{\extracolsep{\fill}}r@{}}
    \textcolor{THUPurple}{\textbf{[#1]}} & \textbf{#2} & #6
  \end{tabular*}\par
  {\hangindent=0.37in\hangafter=1\hspace*{0.37in}#3\par}
  {\hangindent=0.37in\hangafter=1\hspace*{0.37in}\textit{#4}\ifthenelse{\isempty{#5}}{}{. #5}\par}
  \vspace{0.18ex}
}

\newcommand{\skillsline}[1]{%
  {\par \textcolor{THUPurpleMuted}{\textbf{Core tools:}}\quad #1\par}
}
