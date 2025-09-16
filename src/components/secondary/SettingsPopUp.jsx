import React, { useState, useRef, useEffect } from "react";
import Globalvariables from "../../js/globalvariables.js";
import CreatableSelect from "react-select/creatable";
import topics from "../../js/maslowTopics.js";
import { use } from "react";

const SettingsPopUp = ({
  setSettingsPopUp,
  shortCutsOn,
  setShortCuts,
  gridParam,
  axesParam,
  wireParam,
  solidParam,
  setGrid,
  setAxes,
  setWire,
  setSolid,
  backgroundUsdzFile,
}) => {
  let repoTopics = [];
  if (Globalvariables.currentRepo.topics.length > 0) {
    Globalvariables.currentRepo.topics.forEach((topic) => {
      repoTopics.push({ value: topic, label: topic });
    });
  }
  const projectTopicRef = useRef(repoTopics);
  const projectDescriptionRef = useRef(Globalvariables.currentRepo.description);
  const dateString = Globalvariables.currentRepo.dateCreated;
  const dateCreated = new Date(dateString);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSettingsPopUp(false);
    const projectTopicArray = projectTopicRef.current.getValue();
    const projectTopic = [];
    projectTopicArray.forEach((topic) => {
      projectTopic.push(topic[`value`]);
    });
    Globalvariables.currentRepo.description =
      projectDescriptionRef.current.value;
    setState({
      ...state,
      projectDescription: projectDescriptionRef.current.value,
    });
    Globalvariables.currentRepo.topics = projectTopic;
  };
  const [value, setValue] = React.useState(0);

  // Custom Tabs implementation
  const tabLabels = [
    "INFO",
    "CANVAS SETTINGS",
    "PROJECT SETTINGS",
    "RENDER PREFERENCES",
  ];
  function CustomTabPanel({ children, value, index }) {
    return value === index ? (
      <div style={{ padding: 16 }}>{children}</div>
    ) : null;
  }
  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const [state, setState] = React.useState({
    shortcut: shortCutsOn,
    displaytheme: false,
    fontSize: parseInt(
      Globalvariables.canvasFont.replace("px Work Sans Bold", ""),
      10
    ),
    atomSize: Globalvariables.atomSize * 1000,
    projectDescription: Globalvariables.currentRepo.description,
  });

  const handleValueChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.value,
    });
    if (event.target.name === "atomSize") {
      Globalvariables.atomSize = event.target.value / 1000;
      localStorage.setItem("atomSize", event.target.value / 1000);
    }
    if (event.target.name === "projectDescription") {
      Globalvariables.currentRepo.description = event.target.value;
    }
    if (event.target.name === "fontSize") {
      console.log(event.target.value);
      Globalvariables.canvasFont = `${event.target.value}px Work Sans Bold`;
      localStorage.setItem(
        "canvasFont",
        `${event.target.value}px Work Sans Bold`
      );
    }
  };

  const handleCheckChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
    if (event.target.name === "shortcut") {
      setShortCuts(event.target.checked);
    }
    if (event.target.name === "displaytheme") {
      const element = document.querySelector("html");
      if (element && element.className === "light-theme") {
        element.className = "dark-theme";
        localStorage.setItem("displayTheme", "dark-theme");
      } else {
        element.className = "light-theme";
        localStorage.setItem("displayTheme", "light-theme");
      }
    }
  };

  const handleSelectChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.value,
    });
    Globalvariables.topLevelMolecule.unitsKey = event.target.value;
  };

  return (
    <div className="settingsDiv">
      <div className="form animate fadeInUp one " id="settingsPopUp">
        <a
          onClick={() => {
            setSettingsPopUp(false);
          }}
          className="closeButton2"
        >
          {"\u00D7"}
        </a>
        <form
          className="settings-form project-info"
          onSubmit={(e) => {
            handleSubmit(e);
          }}
        >
          {/* Custom Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #ccc",
              marginBottom: 8,
            }}
          >
            {tabLabels.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => handleChange(idx)}
                style={{
                  background: value === idx ? "#e0e5ef" : "#f7f7fa",
                  color: value === idx ? "#7a3eb1" : "#444",
                  border: "none",
                  borderBottom:
                    value === idx
                      ? "2px solid #7a3eb1"
                      : "2px solid transparent",
                  fontWeight: 600,
                  fontSize: 15,
                  padding: "10px 18px",
                  cursor: "pointer",
                  outline: "none",
                  borderRadius: "8px 8px 0 0",
                  marginRight: 2,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Tab Panels */}
          <CustomTabPanel value={value} index={0}>
            <div id="project-info">
              <div id="project-info-name">
                <label>Project Name</label>
                <p title="To change the Project Name go to your Github repository">
                  {Globalvariables.currentRepo.repoName}
                </p>
              </div>
              <div id="project-info-date">
                <label>Date Created</label>
                <p>{dateCreated.toDateString()}</p>
              </div>
            </div>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={state.shortcut}
                  onChange={handleCheckChange}
                  name="shortcut"
                  style={{ marginRight: 8 }}
                />
                Shortcut Helper Show/Hide
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={state.displaytheme}
                  onChange={handleCheckChange}
                  name="displaytheme"
                  style={{ marginRight: 8 }}
                />
                Display light/dark
              </label>
              <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }} />
              <label
                className="settings-labels"
                style={{ margin: "10px 0 4px 0" }}
              >
                Font Size
              </label>
              <input
                type="range"
                min={8}
                max={30}
                value={state.fontSize}
                onChange={handleValueChange}
                name="fontSize"
                className="settings-sliders"
                style={{ width: 180 }}
              />
              <span style={{ fontSize: 13, color: "#888", marginLeft: 6 }}>
                {state.fontSize}px
              </span>
              <label
                className="settings-labels"
                style={{ margin: "10px 0 4px 0" }}
              >
                Atom Size
              </label>
              <input
                type="range"
                min={10}
                max={60}
                value={state.atomSize}
                onChange={handleValueChange}
                name="atomSize"
                className="settings-sliders"
                style={{ width: 180 }}
              />
              <span style={{ fontSize: 13, color: "#888", marginLeft: 6 }}>
                {state.atomSize}
              </span>
            </div>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <label style={{ marginBottom: "8px", fontWeight: 500 }}>
              Project Description
            </label>
            <input
              id="project-description"
              defaultValue={Globalvariables.currentRepo.description}
              ref={projectDescriptionRef}
              name="projectDescription"
              style={{
                width: "100%",
                marginBottom: 12,
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
            <label htmlFor="Project Topics" style={{ fontWeight: 500 }}>
              Project Tags
            </label>
            <CreatableSelect
              defaultValue={repoTopics}
              isMulti
              name="Project Topics"
              options={topics}
              className="basic-multi-select"
              classNamePrefix="select"
              ref={projectTopicRef}
            />
            <label
              htmlFor="measure-units"
              style={{ marginTop: 12, fontWeight: 500 }}
            >
              Project Units
            </label>
            <select
              id="measure-units"
              name="measure-units"
              value={Globalvariables.topLevelMolecule.unitsKey}
              onChange={handleSelectChange}
              style={{
                width: 120,
                marginLeft: 8,
                padding: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="MM">MM</option>
              <option value="Inches">Inches</option>
              <option value="Unitless">Unitless</option>
            </select>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={3}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={gridParam}
                  onChange={(event) => setGrid(event.target.checked)}
                  name="grid"
                  style={{ marginRight: 8 }}
                />
                Grid
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={axesParam}
                  onChange={(event) => setAxes(event.target.checked)}
                  name="axes"
                  style={{ marginRight: 8 }}
                />
                Axes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={wireParam}
                  onChange={(event) => setWire(event.target.checked)}
                  name="wire"
                  style={{ marginRight: 8 }}
                />
                Output Wire
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={solidParam}
                  onChange={(event) => setSolid(event.target.checked)}
                  name="wireframe"
                  style={{ marginRight: 8 }}
                />
                Wireframe
              </label>
              <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }} />
              <label
                className="settings-labels"
                style={{ margin: "10px 0 4px 0" }}
              >
                Background Model
              </label>
              <div style={{ marginBottom: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("backgroundUsdzInput").click();
                  }}
                  style={{
                    padding: "8px 16px",
                    marginRight: "10px",
                    backgroundColor: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Upload 3D Background Model
                </button>
                {backgroundUsdzFile && (
                  <button
                    type="button"
                    onClick={() => {
                      document
                        .getElementById("backgroundUsdzDeleteInput")
                        .click();
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete Background
                  </button>
                )}
              </div>
              <span
                style={{
                  color: "#666",
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                Supported formats: GLB, GLTF. Max file size: 25MB
              </span>
            </div>
          </CustomTabPanel>
          <button
            className="submit-button"
            type="submit"
            style={{ marginTop: 18 }}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPopUp;
