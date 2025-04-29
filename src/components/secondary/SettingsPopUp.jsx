import React, { useState, useRef, useEffect } from "react";
import Globalvariables from "../../js/globalvariables.js";
import CreatableSelect from "react-select/creatable";
import topics from "../../js/maslowTopics.js";
import { use } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";

const SettingsPopUp = ({ setSettingsPopUp, shortCutsOn, setShortCuts }) => {
  let repoTopics = [];
  if (Globalvariables.currentRepo.topics.length > 0) {
    Globalvariables.currentRepo.topics.forEach((topic) => {
      repoTopics.push({ value: topic, label: topic });
    });
  }

  const projectTopicRef = useRef(repoTopics);
  const projectDescriptionRef = useRef(Globalvariables.currentRepo.description);
  const projectUnitsRef = useRef(Globalvariables.topLevelMolecule.unitsKey);
  const shortcutsRef = useRef(shortCutsOn);

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
    Globalvariables.topLevelMolecule.unitsKey = projectUnitsRef.current.value;
    Globalvariables.currentRepo.description =
      projectDescriptionRef.current.value;
    Globalvariables.currentRepo.topics = projectTopic;

    setShortCuts(shortcutsRef.current.checked);
  };
  const [value, setValue] = React.useState(0);

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }
  function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [state, setState] = React.useState({
    shortcut: true,
    displaytheme: false,
    fontSize: 12,
  });

  const handleCheckChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
    if (event.target.name === "shortcut") {
      setShortCuts(event.target.checked);
    }

    if (event.target.name === "fontSize") {
      console.log(event.target.value);
      setState({
        ...state,
        fontSize: event.target.value,
      });
    }
  };

  return (
    <div className="settingsDiv">
      <div className="form animate fadeInUp one">
        <a
          onClick={() => {
            setSettingsPopUp(false);
          }}
          className="closeButton2"
        >
          {"\u00D7"}
        </a>
        <h2 style={{ margin: "0 0 15px 0" }}> Project Preferences</h2>
        <form
          className="settings-form project-info"
          onSubmit={(e) => {
            handleSubmit(e);
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label="Project Information" {...a11yProps(0)} />
              <Tab label="Canvas Settings" {...a11yProps(1)} />
              <Tab label="Project Settings" {...a11yProps(2)} />
            </Tabs>
          </Box>
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
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.shortcut}
                    onChange={handleCheckChange}
                    name="shortcut"
                  />
                }
                label="Shortcut Helper Show/Hide"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={state.displaytheme}
                    onChange={handleCheckChange}
                    name="displaytheme"
                  />
                }
                label="Display light/dark"
              />
              <FormControlLabel
                control={
                  <Slider
                    aria-label="fontSize"
                    value={state.fontSize}
                    onChange={handleCheckChange}
                    name="fontSize"
                  />
                }
                label="Font Size"
              />
            </FormGroup>
            <label htmlFor="theme-toggle">Display Theme (placeholder)</label>
            <input
              type="checkbox"
              className="checkbox "
              name={"theme-toggle"}
              id={"theme-toggle-light"}
            />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <label htmlFor="project-description">Project Description</label>
            <input
              defaultValue={Globalvariables.currentRepo.description}
              ref={projectDescriptionRef}
            />
            <label htmlFor="project-topics">Project Tags</label>
            <CreatableSelect
              defaultValue={repoTopics}
              isMulti
              name="Project Topics"
              options={topics}
              className="basic-multi-select"
              classNamePrefix="select"
              ref={projectTopicRef}
            />
            <label htmlFor="measure-units">Units</label>
            <select
              id="measure-units"
              defaultValue={Globalvariables.topLevelMolecule.unitsKey}
              ref={projectUnitsRef}
            >
              <option key={"inchesop"} value={"Inches"}>
                Inches
              </option>
              <option key={"millop"} value={"MM"}>
                MM
              </option>
            </select>
          </CustomTabPanel>

          <button className="submit-button" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPopUp;
