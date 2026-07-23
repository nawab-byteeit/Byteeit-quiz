import { Question } from '../types';

export const QUESTIONS: Question[] = [
  // --- SESSION 1: GE CAPABILITIES ---
  {
    id: 1,
    session: 1,
    sessionTitle: "Session 1: GE Capabilities",
    question: "According to the GE Capabilities presentation, what is the core shift in workplace philosophy that Gemini Enterprise enables?",
    options: [
      "A) Fully automating customer service so human agents are no longer needed.",
      "B) Moving employees from doing repetitive \"busy work\" to focusing on strategy, innovation, and breakthroughs.",
      "C) Replacing Google Workspace applications with third-party software.",
      "D) Reducing the need for any data analysis within a company."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) Moving employees from doing repetitive \"busy work\" to focusing on strategy, innovation, and breakthroughs.",
    explanation: "Gemini Enterprise aims to eliminate repetitive operational tasks, empowering teams to focus on creative, strategic, and high-value innovation across the business.",
    timeLimit: 30
  },
  {
    id: 2,
    session: 1,
    sessionTitle: "Session 1: GE Capabilities",
    question: "Which of the following is highlighted as one of the four key ways Gemini Enterprise helps teams \"work smarter\"?",
    options: [
      "A) Condensing hours of research into seconds.",
      "B) Manually auditing all compliance documents.",
      "C) Replacing all third-party CRM systems.",
      "D) Physically managing warehouse inventory."
    ],
    correctAnswer: 0,
    correctAnswerText: "A) Condensing hours of research into seconds.",
    explanation: "Gemini Enterprise leverages deep multi-document analysis and semantic search to summarize vast knowledge bases and synthesize research in seconds.",
    timeLimit: 30
  },
  {
    id: 3,
    session: 1,
    sessionTitle: "Session 1: GE Capabilities",
    question: "Based on the Kewal Kiran Clothing Limited (KKCL) case study, how was Gemini Enterprise primarily utilized by their design team?",
    options: [
      "A) To automatically generate payroll reports.",
      "B) To analyze fashion trends and match fabric inventory for faster design decisions.",
      "C) To calculate the daily carbon emissions of their factories.",
      "D) To manage IT helpdesk tickets."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) To analyze fashion trends and match fabric inventory for faster design decisions.",
    explanation: "KKCL used Gemini Enterprise to cross-reference market fashion trends with their internal fabric inventory catalog, significantly accelerating time-to-market for new apparel lines.",
    timeLimit: 30
  },
  {
    id: 4,
    session: 1,
    sessionTitle: "Session 1: GE Capabilities",
    question: "In the Emami Limited case study, how did the marketing team leverage Gemini Enterprise to accelerate content creation?",
    options: [
      "A) By automatically writing legal contracts.",
      "B) By analyzing competitor pricing data in real time.",
      "C) By generating brand-specific videos with avatars while adhering to approved style guidelines.",
      "D) By managing hardware infrastructure."
    ],
    correctAnswer: 2,
    correctAnswerText: "C) By generating brand-specific videos with avatars while adhering to approved style guidelines.",
    explanation: "Emami Limited empowered its marketing teams to quickly produce high-quality video content using branded digital avatars and strictly aligned visual style guidelines.",
    timeLimit: 30
  },
  {
    id: 5,
    session: 1,
    sessionTitle: "Session 1: GE Capabilities",
    question: "Scenario: You are pitching to a logistics and supply chain company that is struggling to quickly access shipment histories, warehouse details, and standard operating procedures (SOPs). Based on the SRS Combined Cargo case study, which AI Agent should you propose?",
    options: [
      "A) A Marketing Content Agent",
      "B) A Fashion Design Agent",
      "C) A Logistics Intelligence Agent",
      "D) A Code Review Agent"
    ],
    correctAnswer: 2,
    correctAnswerText: "C) A Logistics Intelligence Agent",
    explanation: "A Logistics Intelligence Agent synthesizes fragmented shipment manifests, warehouse telemetry, and compliance SOPs to provide instant actionable insights for cargo operators.",
    timeLimit: 30
  },
  {
    id: 6,
    session: 1,
    sessionTitle: "Session 1: GE Capabilities",
    question: "Scenario: You are meeting with an engineering consultancy firm that wastes hundreds of hours manually analyzing ESG (Environmental, Social, and Governance) data and regulatory requirements. Referring to the AESG case study, what is the best GE solution to pitch?",
    options: [
      "A) A Sustainability & Compliance Agent",
      "B) A Hardware Assessment Agent",
      "C) A Retail Inventory Agent",
      "D) An Outbound Email Sales Agent"
    ],
    correctAnswer: 0,
    correctAnswerText: "A) A Sustainability & Compliance Agent",
    explanation: "AESG deployed a Sustainability & Compliance Agent to parse complex environmental standards, build audit-ready reports, and automate sustainability compliance reviews.",
    timeLimit: 30
  },

  // --- SESSION 2: GOOGLE CLOUD FUNDAMENTALS AND SERVICES ---
  {
    id: 7,
    session: 2,
    sessionTitle: "Session 2: Google Cloud Fundamentals and Services",
    question: "In the evolution of cloud architecture discussed during the session, what are the three distinct waves of computing?",
    options: [
      "A) Local Area Networks, Wide Area Networks, and Cloud Networks.",
      "B) Collocation, Virtualized Data Centers, and Container-Based Architecture.",
      "C) Physical Servers, Cloud Servers, and AI Servers.",
      "D) Infrastructure, Platforms, and Software."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) Collocation, Virtualized Data Centers, and Container-Based Architecture.",
    explanation: "Computing evolved from early physical collocation to virtualized infrastructure (VMs) and into modern containerized, serverless cloud architectures.",
    timeLimit: 30
  },
  {
    id: 8,
    session: 2,
    sessionTitle: "Session 2: Google Cloud Fundamentals and Services",
    question: "How did the training define the difference between PaaS (Platform as a Service) and SaaS (Software as a Service)?",
    options: [
      "A) PaaS is strictly for hardware management, while SaaS requires the user to write all the code.",
      "B) PaaS allows users to focus solely on code while Google manages the hardware/platform, whereas SaaS is fully managed software provided by Google (like Gemini Enterprise).",
      "C) PaaS is used only for data storage, and SaaS is used only for networking.",
      "D) There is no difference; they are just different pricing tiers."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) PaaS allows users to focus solely on code while Google manages the hardware/platform, whereas SaaS is fully managed software provided by Google (like Gemini Enterprise).",
    explanation: "PaaS gives developers execution environments to deploy code without managing servers, while SaaS delivers turnkey end-user software applications completely hosted and maintained by the cloud provider.",
    timeLimit: 30
  },
  {
    id: 9,
    session: 2,
    sessionTitle: "Session 2: Google Cloud Fundamentals and Services",
    question: "When pitching Google Cloud to experienced IT directors and CIOs who are considering migrating large-scale workloads from competitors like AWS or Azure, what is the most effective overarching strategy to build customer confidence and secure the deal?",
    options: [
      "A) Provide exhaustive technical documentation and architecture diagrams on the very first discovery call to prove technical superiority.",
      "B) Claim that AWS and Azure are inherently unsecure and heavily prone to downtime compared to Google Cloud.",
      "C) Emphasize a proven track record of executing large-scale migrations by citing specific examples of successful cross-cloud transitions and highlighting the availability of certified resources to ensure minimal business disruption.",
      "D) Advise the customer to independently assess their own infrastructure compatibility and finalize their migration plan before engaging further with the sales team."
    ],
    correctAnswer: 2,
    correctAnswerText: "C) Emphasize a proven track record of executing large-scale migrations by citing specific examples of successful cross-cloud transitions and highlighting the availability of certified resources to ensure minimal business disruption.",
    explanation: "CIOs prioritize enterprise risk mitigation; highlighting proven migration reference cases and certified migration support assures leadership of smooth execution.",
    timeLimit: 30
  },
  {
    id: 10,
    session: 2,
    sessionTitle: "Session 2: Google Cloud Fundamentals and Services",
    question: "When a customer compares Google's Looker to Microsoft's PowerBI, how should the sales team position Looker?",
    options: [
      "A) As a free alternative to PowerBI.",
      "B) By explaining that Looker shouldn't be directly compared to PowerBI, as Looker provides distinct advantages like a semantic layer and AI analytics.",
      "C) By stating that Looker is strictly an on-premise reporting tool.",
      "D) By admitting PowerBI is superior for all use cases."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) By explaining that Looker shouldn't be directly compared to PowerBI, as Looker provides distinct advantages like a semantic layer and AI analytics.",
    explanation: "Looker offers a centralized governance semantic modeling layer (LookML) and direct integration with BigQuery and Gemini AI analytics, going beyond conventional desktop BI tools.",
    timeLimit: 30
  },
  {
    id: 11,
    session: 2,
    sessionTitle: "Session 2: Google Cloud Fundamentals and Services",
    question: "Scenario: A customer has an existing application and simply needs foundational hardware—including RAM, CPU, storage, and networking—in a secure environment on Google Cloud. They will manage the OS and the app themselves. Which hosting model are they asking for?",
    options: [
      "A) Software as a Service (SaaS)",
      "B) Platform as a Service (PaaS)",
      "C) Infrastructure as a Service (IaaS)",
      "D) Container as a Service (CaaS)"
    ],
    correctAnswer: 2,
    correctAnswerText: "C) Infrastructure as a Service (IaaS)",
    explanation: "IaaS (e.g., Compute Engine) provisions raw virtualized hardware resources (CPU, RAM, storage, networking) while leaving OS management and application logic to the client.",
    timeLimit: 30
  },
  {
    id: 12,
    session: 2,
    sessionTitle: "Session 2: Google Cloud Fundamentals and Services",
    question: "Scenario: A prospect wants to migrate an application to Google Cloud. They don't want to do a full code rewrite (Refactoring) but they do want to make some minor optimizations, such as switching to Google's managed databases, before launching. Which migration strategy is this?",
    options: [
      "A) Rehosting (Lift-and-shift)",
      "B) Replatforming",
      "C) Replacing",
      "D) Retiring"
    ],
    correctAnswer: 1,
    correctAnswerText: "B) Replatforming",
    explanation: "Replatforming (lift-and-reshape) modifies cloud infrastructure components—such as substituting self-hosted databases with Cloud SQL or Cloud Spanner—without rewriting core application code.",
    timeLimit: 30
  },

  // --- SESSION 3: GOOGLE CLOUD SECURITY, FORTINET, COMMERCIAL AND OBJECTION HANDLING ---
  {
    id: 13,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "How should Fortinet be positioned when speaking to a Google Cloud customer?",
    options: [
      "A) As a temporary patch until Google builds its own firewall.",
      "B) As a random third-party firewall vendor that we happen to resell.",
      "C) As a strategic, natively integrated partner on Google Cloud.",
      "D) As a competitor to Google Cloud Security Command Center."
    ],
    correctAnswer: 2,
    correctAnswerText: "C) As a strategic, natively integrated partner on Google Cloud.",
    explanation: "Fortinet is positioned as a strategic technology ecosystem partner on Google Cloud, providing unified threat protection across hybrid multi-cloud environments.",
    timeLimit: 30
  },
  {
    id: 14,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "To answer the question \"Is Google Cloud secure?\" with the concept of \"defense in depth\", how many security layers does Google's infrastructure utilize?",
    options: [
      "A) 1 layer (Just the perimeter firewall)",
      "B) 3 layers (Hardware, Software, and Network)",
      "C) 6 layers (Hardware, Storage, Deployment, Internet Comm, Identity, and Operational Security)",
      "D) 10 layers"
    ],
    correctAnswer: 2,
    correctAnswerText: "C) 6 layers (Hardware, Storage, Deployment, Internet Comm, Identity, and Operational Security)",
    explanation: "Google Cloud's end-to-end defense in depth spans 6 distinct layers: Hardware, Storage Encryption, Service Deployment, Internet Communications, Identity Access, and Operational Security.",
    timeLimit: 30
  },
  {
    id: 15,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "What is a key competitive advantage of Google Security Command Center over AWS's native security tools?",
    options: [
      "A) Google relies entirely on Splunk, while AWS does not.",
      "B) Google unifies security posture across compute, data, and identity into one console, whereas AWS spreads this across multiple tools (Security Hub, GuardDuty, Config).",
      "C) AWS provides a natively built-in SIEM, while Google does not.",
      "D) Google's Security Command Center is only available for on-premise servers."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) Google unifies security posture across compute, data, and identity into one console, whereas AWS spreads this across multiple tools (Security Hub, GuardDuty, Config).",
    explanation: "Google Security Command Center (SCC) offers a single unified pane of glass for asset discovery, posture management, vulnerability scanning, and threat detection.",
    timeLimit: 30
  },
  {
    id: 16,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "How do Google Marketplace \"private offers\" help accelerate the procurement process for a customer?",
    options: [
      "A) They bypass the customer's finance department entirely.",
      "B) They flow through the customer's standard purchase-order process, meaning they look like buying more of something they already buy from Google without needing a new vendor security review.",
      "C) They require the customer to sign up with a third-party billing agency.",
      "D) They offer a flat rate for unlimited cloud usage."
    ],
    correctAnswer: 1,
    correctAnswerText: "B) They flow through the customer's standard purchase-order process, meaning they look like buying more of something they already buy from Google without needing a new vendor security review.",
    explanation: "Marketplace private offers simplify enterprise purchasing by leveraging existing billing agreements, committed cloud spend (committed use discounts), and pre-approved Google master agreements.",
    timeLimit: 30
  },
  {
    id: 17,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "Scenario (Category Identification): A customer problem is: \"Our developers are moving quickly, but our security team has no idea what cloud-native applications are currently running in production, how they are configured, or if they are compliant with our industry regulations.\" Which security matrix category does this problem fall into?",
    options: [
      "A) Security Operations",
      "B) Cloud Security and Compliance (Posture)",
      "C) Identity & Access Management",
      "D) Secure Infrastructure"
    ],
    correctAnswer: 1,
    correctAnswerText: "B) Cloud Security and Compliance (Posture)",
    explanation: "Visibility into application configurations, compliance monitoring, and infrastructure governance fall directly under Security Posture Management.",
    timeLimit: 30
  },
  {
    id: 18,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "Scenario (Category Identification): A customer problem is: \"We are constantly targeted by sophisticated phishing and malware campaigns, and our security team is struggling to keep up. We need a way to detect and respond to these threats in real time using the latest global threat intelligence.\" Which security matrix category does this problem fall into?",
    options: [
      "A) Secure Infrastructure",
      "B) Identity & Access Management",
      "C) Security Operations (SecOps)",
      "D) Cloud Security and Compliance (Posture)"
    ],
    correctAnswer: 2,
    correctAnswerText: "C) Security Operations (SecOps)",
    explanation: "Real-time threat detection, incident response, SIEM/SOAR capabilities, and active defense operations fall under Security Operations (SecOps).",
    timeLimit: 30
  },
  {
    id: 19,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "Scenario (Category Identification): A customer problem is: \"We have hundreds of employees accessing our cloud databases and APIs, but we don't have a reliable way to enforce 'least privilege' access or securely manage user credentials. We need to ensure that only verified employees can access specific sensitive resources.\" Which security matrix category does this problem fall into?",
    options: [
      "A) Security Operations (SecOps)",
      "B) Secure Infrastructure",
      "C) Identity & Access Management (IAM)",
      "D) Cloud Security and Compliance (Posture)"
    ],
    correctAnswer: 2,
    correctAnswerText: "C) Identity & Access Management (IAM)",
    explanation: "Enforcing least-privilege roles, credentials management, zero-trust authentication, and user access controls fall under Identity & Access Management.",
    timeLimit: 30
  },
  {
    id: 20,
    session: 3,
    sessionTitle: "Session 3: Google Cloud Security, Fortinet, Commercial and Objection Handling",
    question: "Scenario (Category Identification): A customer problem is: \"We are migrating highly sensitive database workloads and virtual machine environments to the cloud, but we need to guarantee that the underlying compute nodes, storage drives, and network pathways themselves are hardened and shielded against physical and hypervisor-level attacks.\" Which security matrix category does this problem fall into?",
    options: [
      "A) Secure Infrastructure",
      "B) Cloud Security and Compliance (Posture)",
      "C) Security Operations (SecOps)",
      "D) Identity & Access Management (IAM)"
    ],
    correctAnswer: 0,
    correctAnswerText: "A) Secure Infrastructure",
    explanation: "Hardware roots of trust, custom Titan security chips, memory encryption, and network substrate hardening belong to Secure Infrastructure.",
    timeLimit: 30
  }
];
