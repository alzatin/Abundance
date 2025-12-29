// FAQDisplay styles
const FAQ_DISPLAY_STYLES = `
.faq-list-container {
  max-width: 80%;
  margin: 60px 30px;
}
.faq-list-item {
  margin-bottom: 12px;
}
.faq-question {
  cursor: pointer;
  border-radius: 4px;
  padding: 8px;
  font-weight: normal;
  background: none;
  transition: background 0.2s, font-weight 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.faq-question-open {
  font-weight: bold;
  background: #f6f6f6;
}
.faq-arrow {
  margin-left: 8px;
  float: right;
}
.faq-answer {
  margin-left: 16px;
  margin-top: 6px;
  padding: 8px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 0.98em;
}
`;
import React from "react";

const FAQ_LIST = [
  {
    question: "What is Abundance?",
    answer:
      "Abundance is a collaborative, web-based 3D CAD platform that runs in your browser. It focuses on programmable design and seamless GitHub integration for storing and managing your projects.",
  },
  {
    question: "Where are my designs and projects stored?",
    answer:
      "All your designs and projects in Abundance are automatically stored as GitHub repositories in your account. This means you get real version control, history, and collaboration features for free.",
  },
  {
    question: "How do I open or create a new design?",
    answer:
      "After logging in, you can create a new project (design), which creates a corresponding GitHub repository, or open existing projects from your list of repositories.",
  },
  {
    question: "Can I collaborate with others on my designs?",
    answer:
      "Yes! Anyone you invite (by giving them access to your project’s GitHub repository) can collaborate with you in real time or asynchronously.",
  },
  {
    question: "How does saving work? Do I need to save my work manually?",
    answer:
      "Your work is synced with your connected GitHub repository. Saving might happen automatically, or you may see a 'Save' or 'Sync' button—make sure to use this before leaving your session to ensure your latest changes are stored.",
  },
  {
    question: "How can I access my designs later or on another device?",
    answer:
      "Simply log in to Abundance again using your GitHub account. All your projects will be available through the project/repository browser.",
  },
  {
    question: "Can I import files or export my designs?",
    answer:
      "You can import or export designs using the 'Import' or 'Export' options in the interface. Supported formats typically include STL and project JSON.",
  },
  {
    question: "Are there templates or sample projects to learn from?",
    answer:
      "Yes! Look for a 'Gallery,' 'Templates,' or 'Examples' section after you log in, where you can browse public projects or clone them to your own account.",
  },
  {
    question: "Who can see my designs?",
    answer:
      "If your project repository is public on GitHub, anyone can view it. If it is private, only collaborators you invite can see and edit it. You control project visibility through GitHub’s repo settings.",
  },
  {
    question: "How do I report a bug or make a feature request?",
    answer:
      "Open an issue on the Abundance GitHub repository or use the in-app feedback tools if available.",
  },
  {
    question:
      "Why does the app seem slow when loading or rendering complex designs?",
    answer:
      "Abundance uses advanced 3D geometry calculations in the browser, which can be resource-intensive. Very complex models or slow devices may result in longer load or processing times.",
  },
  {
    question:
      "What should I do if I encounter errors or something doesn’t load?",
    answer:
      "Try refreshing the browser page, ensure your internet connection is stable, and use a supported, up-to-date browser. If the problem continues, check your GitHub repository for errors and report the issue if needed.",
  },
  {
    question: "Do I need to update anything manually?",
    answer:
      "No manual updates are needed—Abundance deploys updates automatically. If you see unexpected behavior, try clearing your browser cache or reloading the page.",
  },
  {
    question: "Is there a cost to using Abundance?",
    answer:
      "Abundance is open-source and free to use. Standard GitHub usage applies (private repositories may require a paid GitHub plan).",
  },
  {
    question: "Where can I go for more help?",
    answer:
      "Use the in-app help, documentation, or tutorials. You can also visit the Abundance GitHub repository or community forums if available.",
  },
];

export default function FAQDisplay() {
  const [openIndex, setOpenIndex] = React.useState(null);

  // Inject styles at the top of the file/component
  React.useEffect(() => {
    if (!document.getElementById("faq-display-styles")) {
      const style = document.createElement("style");
      style.id = "faq-display-styles";
      style.innerHTML = FAQ_DISPLAY_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="faq-list-container">
      {FAQ_LIST.map((faq, idx) => (
        <div key={idx} className="faq-list-item">
          <div
            className={
              "faq-question login-nav-item" +
              (openIndex === idx ? " faq-question-open" : "")
            }
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <span>{faq.question}</span>
            <span className="faq-arrow">{openIndex === idx ? "▼" : "►"}</span>
          </div>
          {openIndex === idx && <div className="faq-answer">{faq.answer}</div>}
        </div>
      ))}
    </div>
  );
}
