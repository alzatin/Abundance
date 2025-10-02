import { useState, useRef } from "react";
import { licenses } from "../../js/licenseOptions.js";
import GlobalVariables from "../../js/globalvariables.js";
import { useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import topics from "../../js/maslowTopics.js";
import { useProject } from "../../contexts/index.js";
//Replaces the loaded projects if the user clicks on new project button
const NewProjectPopUp = ({ setExportPopUp, authorizedUserOcto, exporting }) => {
  const keys_ar = [];
  Object.keys(licenses).forEach((key) => {
    keys_ar.push(key);
  });

  const navigate = useNavigate();
  const projectRef = useRef();
  const projectTopicRef = useRef();
  const projectDescriptionRef = useRef();
  const projectLicenseRef = useRef();
  const projectUnitsRef = useRef();
  const [pending, setPending] = useState(false); // useFormStatus(); in the future

  //Progress bar for creating a new project
  const [newProjectBar, setNewProjectBar] = useState(0);
  const { createProject } = useProject();

  /* Handles form submission for create new/ export project form */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    const projectName = projectRef.current.value.replace(/\//g, "");
    const projectTopicArray = projectTopicRef.current.getValue();
    const projectDescription = projectDescriptionRef.current.value;
    const projectTopic = [];
    const projectLicense = projectLicenseRef.current.value;
    const projectUnits = projectUnitsRef.current.value;

    projectTopicArray.forEach((topic) => {
      projectTopic.push(topic[`value`]);
    });

    if (GlobalVariables.currentMolecule) {
      var molecule = GlobalVariables.currentMolecule;
    }
    // Calls the create new project function and creates a new github repo with user input
    createProject(
      authorizedUserOcto,
      [
        projectName,
        projectTopic,
        projectDescription,
        projectLicense,
        projectUnits,
      ],
      molecule,
      exporting,
      setNewProjectBar
    ).then((project) => {
      console.log("Created project:", project);
      setExportPopUp(false);
      setPending(false);
      navigate(
        `/${GlobalVariables.currentAWSnode.owner}/${GlobalVariables.currentAWSnode.repoName}`
      );
    });
  };

  return (
    <>
      <div className="login-page export-div">
        <div className="form animate fadeInUp one">
          <button
            onClick={() => {
              setExportPopUp(false);
            }}
            className="closeButton"
          >
            X
          </button>
          <form
            className="new-project-form"
            onSubmit={(e) => {
              handleSubmit(e);
            }}
          >
            <h2>
              {exporting
                ? "Export this molecule to Github"
                : "Create a New Project"}
            </h2>
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              name="Project Name"
              placeholder="Project Name"
              ref={projectRef}
              required
            />
            <label htmlFor="license-options">License</label>
            <select id="license-options" ref={projectLicenseRef}>
              {keys_ar.map((opt) => {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              })}
            </select>
            <label htmlFor="measure-units">Units</label>
            <select id="measure-units" ref={projectUnitsRef}>
              <option key={"millop"} value={"MM"}>
                MM
              </option>
              <option key={"inchesop"} value={"Inches"}>
                Inches
              </option>
              <option key={"unitlessop"} value={"Unitless"}>
                Unitless
              </option>
            </select>
            <label htmlFor="project-description">Project Description</label>
            <input
              placeholder="Project Description"
              ref={projectDescriptionRef}
            />
            <label htmlFor="project-topics">Project Tags</label>
            <CreatableSelect
              defaultValue={[]}
              isMulti
              name="Project Topics"
              options={topics}
              className="basic-multi-select"
              classNamePrefix="select"
              ref={projectTopicRef}
            />
            <button className="submit-button" disabled={pending} type="submit">
              {pending ? newProjectBar + "%" : "Submit/Export to Github"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default NewProjectPopUp;
