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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import { Typography } from "@mui/material";

const SettingsPopUp = ({ setSettingsPopUp, shortCutsOn, setShortCuts }) => {
  let repoTopics = [];
  if (Globalvariables.currentRepo.topics.length > 0) {
    Globalvariables.currentRepo.topics.forEach((topic) => {
      repoTopics.push({ value: topic, label: topic });
    });
  }
  const projectTopicRef = useRef(repoTopics);
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
    shortcut: shortCutsOn,
    displaytheme: false,
    fontSize: 12,
    atomSize: 12,
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
      setState({
        ...state,
        [event.target.name]: event.target.value,
      });
      Globalvariables.canvasFont = `${event.target.value}px Work Sans Bold`;
    }
    if (event.target.name === "atomSize") {
      setState({
        ...state,
        [event.target.name]: event.target.value,
      });
      Globalvariables.atomSize = event.target.value / 1000;
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
              aria-label="setting-tabs"
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
              <Typography id="input-slider" gutterBottom color="white">
                Font Size
              </Typography>
              <Slider
                aria-label="fontSize"
                value={state.fontSize}
                onChange={handleCheckChange}
                name="fontSize"
                min={8}
                max={30}
              />
              <Typography id="input-slider" gutterBottom color="white">
                Atom Size
              </Typography>

              <Slider
                aria-label="atomSize"
                value={state.atomSize}
                onChange={handleCheckChange}
                name="atomSize"
                min={10}
                max={30}
              />
            </FormGroup>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <TextField
              fullWidth
              label="Project Description and Tags"
              color="red"
              id="project-description"
              multiline
              rows={4}
              value={Globalvariables.currentRepo.description}
              onChange={(event) => {
                //setName(event.target.value);
                Globalvariables.currentRepo.description = event.target.value;
              }}
            />
            <CreatableSelect
              defaultValue={repoTopics}
              isMulti
              name="Project Topics"
              options={topics}
              className="basic-multi-select"
              classNamePrefix="select"
              ref={projectTopicRef}
            />

            <FormControl fullWidth>
              <InputLabel id="measure-units-label">Project Units</InputLabel>
              <Select
                labelId="measure-units-label"
                id="measure-units"
                value={Globalvariables.topLevelMolecule.unitsKey}
                label="Project Units"
                onChange={handleSelectChange}
              >
                <MenuItem value={"MM"}>MM</MenuItem>
                <MenuItem value={"Inches"}>Inches</MenuItem>
              </Select>
            </FormControl>
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
