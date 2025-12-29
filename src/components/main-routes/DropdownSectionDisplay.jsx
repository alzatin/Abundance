import React from "react";

export default function DropdownSectionDisplay({ sections }) {
  const [openIndex, setOpenIndex] = React.useState(null);

  if (!sections || !Array.isArray(sections)) return null;

  return (
    <div className="tutorials-list">
      {sections.map((section, idx) => (
        <div key={idx}>
          <div
            className="login-nav-item"
            style={{
              cursor: "pointer",
              display: "inline",
              fontWeight: openIndex === idx ? "bold" : "normal",
            }}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <p>
              {section.label}{" "}
              <span style={{ marginLeft: 8 }}>
                {openIndex === idx ? "▼" : "►"}
              </span>
            </p>
          </div>
          {openIndex === idx && (
            <div
              className="dropdown-section-value"
              style={{
                marginLeft: 20,
                marginTop: 4,
                padding: 8,
                background: "#f6f6f6",
                borderRadius: 4,
              }}
              //onClick={() => section.onClick()}
            >
              {Array.isArray(section.value) ? (
                <div style={{ margin: 0, paddingLeft: 0 }}>
                  {section.value.map((item, i) => {
                    const hasOnClick =
                      item &&
                      typeof item === "object" &&
                      typeof item.onClick === "function";
                    return (
                      <div
                        onClick={hasOnClick ? item.onClick : undefined}
                        className="login-nav-item dropdown-section-value"
                      >
                        <p
                          key={i}
                          style={{
                            fontSize: "0.95em",
                            opacity: 0.85,
                            marginLeft: 0,
                            marginBottom: 4,
                            cursor: hasOnClick ? "pointer" : "default",
                            display: "inline",
                          }}
                        >
                          {item && typeof item === "object" && item.label
                            ? item.label
                            : String(item)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={section.onClick ? section.onClick : undefined}
                  className="login-nav-item dropdown-section-value"
                >
                  <p
                    key={section.label}
                    style={{
                      fontSize: "0.95em",
                      opacity: 0.85,
                      marginLeft: 0,
                      marginBottom: 4,
                      cursor: section.onClick ? "pointer" : "default",
                      display: "inline",
                    }}
                  >
                    {section && typeof section === "object" && section.label
                      ? section.label
                      : String(section.value)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
