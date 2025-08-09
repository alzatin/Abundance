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
import { Typography } from "@mui/material";
import Divider from "@mui/material/Divider";

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
  setBackgroundUsdzFile,
  backgroundUsdzSha,
  setBackgroundUsdzSha,
  showBackgroundModel,
  setShowBackgroundModel,
  authorizedUserOcto,
}) => {
  // Debug background model props on every render with timestamp
  console.log("SettingsPopUp: Received props", { 
    backgroundUsdzFile, 
    showBackgroundModel,
    hasAuthorizedUserOcto: !!authorizedUserOcto,
    timestamp: new Date().toISOString()
  });
  
  // Component reference tracking for debugging multiple instances
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  console.log("SettingsPopUp: Component ID", componentId.current, "rendering with backgroundUsdzFile:", backgroundUsdzFile);
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

  // Track background model prop changes
  useEffect(() => {
    console.log("SettingsPopUp:", componentId.current, "Background model props changed", { 
      backgroundUsdzFile, 
      showBackgroundModel,
      renderStack: new Error().stack?.split('\n').slice(1, 3).join(' -> ')
    });
  }, [backgroundUsdzFile, showBackgroundModel]);

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
              textColor="inherit"
              indicatorColor="#767676"
            >
              <Tab label="Project Information" {...a11yProps(0)} />
              <Tab label="Canvas Settings" {...a11yProps(1)} />
              <Tab label="Project Settings" {...a11yProps(2)} />
              <Tab label="Render Settings" {...a11yProps(3)} />
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
                    color="secondary"
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
                    color="secondary"
                  />
                }
                label="Display light/dark"
              />
              <Divider flexItem />
              <Typography
                id="input-slider"
                style={{ margin: "10px" }}
                gutterBottom
                class="settings-labels"
              >
                Font Size
              </Typography>
              <Slider
                aria-label="fontSize"
                value={state.fontSize}
                onChange={handleValueChange}
                name="fontSize"
                min={8}
                max={30}
                color="white"
                className="settings-sliders"
              />
              <Typography
                id="input-slider"
                class="settings-labels"
                gutterBottom
                color="white"
              >
                Atom Size
              </Typography>

              <Slider
                aria-label="atomSize"
                value={state.atomSize}
                onChange={handleValueChange}
                name="atomSize"
                className="settings-sliders"
                min={10}
                max={60}
                color="white"
                defaultValue={Globalvariables.atomSize * 1000}
              />
            </FormGroup>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            {" "}
            <InputLabel
              id="measure-units-label"
              style={{ marginBottom: "15px" }}
            >
              Project Description
            </InputLabel>
            <input
              id="project-description"
              defaultValue={Globalvariables.currentRepo.description}
              ref={projectDescriptionRef}
              name="projectDescription"
            />
            {/* <TextField
              fullWidth
              label="Project Description and Tags"
              id="project-description"
              multiline
              rows={4}
              value={state.projectDescription}
              ref={projectDescriptionRef}
            />*/}
            <label htmlFor="Project Topics">Project Tags</label>
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
                color="white"
              >
                <MenuItem value={"MM"}>MM</MenuItem>
                <MenuItem value={"Inches"}>Inches</MenuItem>
                <MenuItem value={"Unitless"}>Unitless</MenuItem>
              </Select>
            </FormControl>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={3}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={gridParam}
                    onChange={(event) => {
                      setGrid(event.target.checked);
                    }}
                    name="grid"
                    color="secondary"
                  />
                }
                label="Grid"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={axesParam}
                    onChange={(event) => {
                      setAxes(event.target.checked);
                    }}
                    name="axes"
                    color="secondary"
                  />
                }
                label="Axes"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={wireParam}
                    onChange={(event) => {
                      setWire(event.target.checked);
                    }}
                    name="wire"
                    color="secondary"
                  />
                }
                label="Output Wire"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={solidParam}
                    onChange={(event) => {
                      setSolid(event.target.checked);
                    }}
                    name="wireframe"
                    color="secondary"
                  />
                }
                label="Wireframe"
              />
              <Divider flexItem style={{ margin: "10px 0" }} />
              <Typography
                style={{ margin: "10px 0" }}
                gutterBottom
                className="settings-labels"
              >
                Background Model
              </Typography>
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
                      document.getElementById("backgroundUsdzDeleteInput").click();
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
              <Typography 
                variant="caption" 
                style={{ color: "#666", fontSize: "12px", display: "block", marginBottom: "10px" }}
              >
                Supported formats: GLB, GLTF. Max file size: 25MB
              </Typography>
              {/* SUPER PROMINENT DEBUG PANEL - IMPOSSIBLE TO MISS */}
              <div style={{ 
                padding: '15px', 
                backgroundColor: backgroundUsdzFile ? '#e8f5e8' : '#ffe6e6', 
                margin: '15px 0', 
                fontSize: '14px', 
                border: `4px solid ${backgroundUsdzFile ? 'green' : 'red'}`,
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                  🐛 BACKGROUND MODEL DEBUG PANEL 🐛
                </div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  <strong>backgroundUsdzFile:</strong> <span style={{ color: backgroundUsdzFile ? 'green' : 'red', fontWeight: 'bold' }}>"{backgroundUsdzFile}"</span> (type: {typeof backgroundUsdzFile})
                </div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  <strong>showBackgroundModel:</strong> <span style={{ color: showBackgroundModel ? 'green' : 'red', fontWeight: 'bold' }}>{showBackgroundModel?.toString()}</span> (type: {typeof showBackgroundModel})
                </div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  <strong>truthy check:</strong> <span style={{ color: (!!backgroundUsdzFile) ? 'green' : 'red', fontWeight: 'bold' }}>{(!!backgroundUsdzFile).toString()}</span>
                </div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  <strong>Component ID:</strong> {componentId.current}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: (!!backgroundUsdzFile) ? 'green' : 'red' }}>
                  <strong>Checkbox condition:</strong> {(!!backgroundUsdzFile) ? '✅ SHOULD SHOW CHECKBOX BELOW' : '❌ CHECKBOX WILL NOT SHOW'}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <strong>Render timestamp:</strong> {new Date().toISOString()}
                </div>
              </div>
              {console.log("SettingsPopUp: Render check - backgroundUsdzFile:", backgroundUsdzFile, "truthy:", !!backgroundUsdzFile, "type:", typeof backgroundUsdzFile)}
              
              {/* CHECKPOINT: About to evaluate checkbox condition */}
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#ffeb3b', 
                border: '3px dashed #f57f17', 
                margin: '10px 0',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                🚀 CHECKPOINT: backgroundUsdzFile = "{backgroundUsdzFile}" | Condition result: {backgroundUsdzFile ? 'TRUE (checkbox will show)' : 'FALSE (no checkbox)'}
              </div>
              
              {backgroundUsdzFile && (
                <div style={{ marginBottom: "10px" }}>
                  {/* SUCCESS INDICATOR */}
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#c8e6c9', 
                    border: '2px solid #4caf50', 
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2e7d32'
                  }}>
                    ✅ SUCCESS: Background model checkbox is being rendered! File: {backgroundUsdzFile}
                  </div>
                  {console.log("SettingsPopUp: Rendering background model controls for file:", backgroundUsdzFile)}
                  <Typography variant="body2" style={{ color: "#666" }}>
                    Current file: {backgroundUsdzFile}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showBackgroundModel}
                        onChange={(event) => {
                          console.log("SettingsPopUp: Background model toggle changed to:", event.target.checked);
                          setShowBackgroundModel(event.target.checked);
                        }}
                        name="backgroundModel"
                        color="secondary"
                      />
                    }
                    label="Show Background Model"
                  />
                </div>
              )}
              {/* Enhanced debug when backgroundUsdzFile is falsy */}
              {!backgroundUsdzFile && (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#ffebee', 
                  fontSize: '14px', 
                  border: '4px solid #f44336',
                  borderRadius: '8px',
                  margin: '15px 0',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '10px' }}>
                    🚨 CHECKBOX NOT SHOWN 🚨
                  </div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    <strong>Reason:</strong> backgroundUsdzFile is falsy
                  </div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    <strong>Value:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>"{backgroundUsdzFile}"</span>
                  </div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    <strong>Type:</strong> {typeof backgroundUsdzFile}
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Possible causes:</strong> Upload failed, state not propagated, or wrong component instance
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <strong>Check console for upload logs and state propagation</strong>
                  </div>
                </div>
              )}
              {!backgroundUsdzFile && console.log("SettingsPopUp: No background model controls shown - backgroundUsdzFile is falsy:", backgroundUsdzFile)}
            </FormGroup>
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
