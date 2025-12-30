import Molecule from "../molecules/molecule";
import GlobalVariables from "../js/globalvariables.js";

import { Status } from "../prototypes/observableEntity.js";

/**
 * This class creates the GitHubMolecule atom.
 */
export default class GitHubMolecule extends Molecule {
  /**
   * The constructor function.
   * @param {object} values An array of values passed in which will be assigned to the class as this.x
   */
  constructor(values) {
    super(values);

    /**
     * This atom's name
     * @type {string}
     */
    this.name = "Github Molecule";
    /**
     * This atom's type
     * @type {string}
     */
    this.atomType = "GitHubMolecule";
    /**
     * A flag to signal if this node is the top level node
     * @type {boolean}
     */
    this.topLevel = false;
    /**
     * The color for the whole in the center of the drawing...probably doesn't need to be in this scope
     * @type {string}
     */
    this.centerColor = "black";
    /**
     * A description of this atom
     * @type {string}
     */
    this.description = "Project imported from GitHub";

    this.gitHubUniqueID;

    this.setValues(values);
  }

  /**
     * Handle double clicks on GitHub molecules
     * If the user owns the molecule (based on parentRepo.owner), allow navigation with confirmation
     * @param {number} x - The x coordinate of the click
     * @param {number} y - The y coordinate of the click
     // */
  doubleClick(x, y) {
    //returns true if something was done with the click
    x = GlobalVariables.pixelsToWidth(x);
    y = GlobalVariables.pixelsToHeight(y);

    var clickProcessed = false;

    var distFromClick = GlobalVariables.distBetweenPoints(x, this.x, y, this.y);

    if (distFromClick < this.radius * 2) {
      // Check if the user owns this GitHub molecule
      if (
        this.parentRepo &&
        this.parentRepo.owner === GlobalVariables.currentUser
      ) {
        // User owns this GitHub molecule - allow navigation with confirmation
        const moleculeName = this.name || this.parentRepo.repoName;
        const confirmMessage = `Navigate to ${moleculeName}?\n\nThis will take you to the project "${this.parentRepo.owner}/${this.parentRepo.repoName}" and leave your current project.\n\nDo you want to continue?`;

        if (window.confirm(confirmMessage)) {
          // User confirmed - navigate to the owned molecule's project
          window.location.href = `/${this.parentRepo.owner}/${this.parentRepo.repoName}`;
        }
      }
      // else: User doesn't own this molecule - do nothing (can't navigate into it)

      clickProcessed = true;
    }

    return clickProcessed;
  }

  onChildError() {
    // find the causal error.
    let buffer = [this.getOutputAtom()];
    while (buffer.length > 0) {
      let atom = buffer.shift();
      if (atom.getState().status === Status.ERROR) {
        this.setError(atom.alert?.message);
        return;
      }
      if (atom.getState().status === Status.UPSTREAM_ERROR) {
        atom.inputs.forEach((input) => {
          if (input.connectors.length > 0) {
            let toAdd = input.connectors[0].attachmentPoint1.parentMolecule;
            if (
              toAdd.atomType == "Molecule" ||
              toAdd.atomType == "GitHubMolecule"
            ) {
              toAdd = toAdd.getOutputAtom();
            }

            if (buffer.includes(toAdd) === false) {
              buffer.push(toAdd);
            }
          }
        });
      }
    }
    // Failed to find cause. set something generic.
    this.setError("An unknown error occurred in a child atom.");
  }

  /**
   * Override onUpstreamChange to add logging for debugging
   */
  onUpstreamChange() {
    const oldStatus = this.status;
    super.onUpstreamChange();
    const newStatus = this.status;
    
    // Log when molecule changes to or stays in WAITING status
    if (newStatus === Status.WAITING && this.nodesOnTheScreen && this.nodesOnTheScreen.length > 0) {
      console.warn(`⚠️ GitHub Molecule "${this.name}" is in WAITING status (was: ${oldStatus})`);
      console.log('Automatically logging atom statuses for debugging:');
      this.logAtomStatuses();
    }
  }

  /**
   * Log the status of all atoms inside this GitHub molecule to the console
   * for debugging purposes
   */
  logAtomStatuses() {
    console.group(`📊 GitHub Molecule Status Report: ${this.name} (${this.uniqueID})`);
    console.log(`Molecule Status: ${this.status}`);
    console.log(`Total atoms: ${this.nodesOnTheScreen.length}`);
    console.log('');
    
    // Log each atom's status
    this.nodesOnTheScreen.forEach((atom, index) => {
      const state = atom.getState();
      const statusEmoji = {
        'disabled': '⚫',
        'waiting': '⏳',
        'processing': '⚙️',
        'ready': '✅',
        'error': '❌',
        'upstream_error': '⚠️'
      }[state.status] || '❓';
      
      console.log(`${statusEmoji} [${index}] ${atom.atomType} "${atom.name}" (${atom.uniqueID})`);
      console.log(`   Status: ${state.status}`);
      
      // Log input statuses
      if (atom.inputs && atom.inputs.length > 0) {
        console.log(`   Inputs (${atom.inputs.length}):`);
        atom.inputs.forEach((input) => {
          const inputState = input.getState();
          const inputEmoji = {
            'disabled': '⚫',
            'waiting': '⏳',
            'processing': '⚙️',
            'ready': '✅',
            'error': '❌',
            'upstream_error': '⚠️'
          }[inputState.status] || '❓';
          
          const hasConnector = input.connectors && input.connectors.length > 0;
          const connectorInfo = hasConnector ? ` (connected to ${input.connectors[0].attachmentPoint1.parentMolecule.name})` : ' (no connection)';
          
          console.log(`     ${inputEmoji} "${input.name}" [${input.valueType}]: ${inputState.status}${connectorInfo}`);
          if (input.valueType === 'geometry' && inputState.value) {
            console.log(`        Value: ${JSON.stringify(inputState.value)}`);
          }
        });
      }
      
      // Log output status if exists
      if (atom.output) {
        const outputState = atom.output.getState();
        const outputEmoji = {
          'disabled': '⚫',
          'waiting': '⏳',
          'processing': '⚙️',
          'ready': '✅',
          'error': '❌',
          'upstream_error': '⚠️'
        }[outputState.status] || '❓';
        
        const hasConnectors = atom.output.connectors && atom.output.connectors.length > 0;
        const connectorCount = hasConnectors ? atom.output.connectors.length : 0;
        
        console.log(`   Output: ${outputEmoji} ${outputState.status} (${connectorCount} connections)`);
      }
      
      console.log('');
    });
    
    console.groupEnd();
  }

  createInputParams() {
    let inputParams = {};
    inputParams = super.createInputParams();
    inputParams["Reload From Github"] = {
      type: "button",
      label: "Reload From Github",
      onClick: () => this.reloadMoleculeFromGithub(),
    };
    inputParams["Log Atom Statuses"] = {
      type: "button",
      label: "Log Atom Statuses",
      onClick: () => this.logAtomStatuses(),
    };
    return inputParams;
  }

  /**
   * Reload this github molecule from github
   */
  reloadMoleculeFromGithub() {
    var githubMoleculeObjectPreReload = this.serialize();
    var githubMoleculeParentObjectConnectorsPreReload =
      this.parent.serialize().allConnectors;

    let gitObj = this.parentRepo;
    let parentMolecule = this.parent;

    const copyOfNodeToBeDeleted = this;
    copyOfNodeToBeDeleted.deleteNode(false, false, true);

    this.loadGithubMoleculeByName(
      /*old way > keeping until i fix reload -- this.gitHubUniqueID*/
      gitObj,
      githubMoleculeObjectPreReload,
      githubMoleculeParentObjectConnectorsPreReload
    );
  }
}
