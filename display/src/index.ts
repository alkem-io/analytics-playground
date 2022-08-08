import * as d3 from 'd3';
import { GraphDataProvider } from './graph/GraphDataProvider';
import { GraphVizualization } from './graph/GraphVizualization';
import { GraphVizualizationControls } from './graph/GraphVizualizationControls';
import { LifecycleDataProvider } from './lifecycle/LifecycleDataProvider';
import { LifecycleVisualization } from './lifecycle/LifecycleVisualization';

// Make the DOM locations available
const graphSvg = d3.select('#graph-svg');
const graphHubSelectionControl = d3.select('#graph-hub-selector');
const graphShowContributors = d3.select('#graph-checkbox-show-contributors');
const graphScaleToFit = d3.select('#graph-scale-to-fit');

const lifecycleSvg = d3.select('#lifecycle-svg');
const lifecycleSelectionControl = d3.select('#lifecycle-selector');

// Load
const graphDataFileLocation = 'data/transformed-graph-data.json'; //
const hubID = ''; //"c4111e11-edad-48f6-916f-20e11f468848";
const graphDataProvider = new GraphDataProvider(true, false, hubID);
await graphDataProvider.loadData(graphDataFileLocation);

const graphControls = new GraphVizualizationControls(graphDataProvider);
graphControls.addHubSelectorOptions(graphHubSelectionControl);
const forceGraph = new GraphVizualization(
  graphSvg,
  graphDataProvider,
  800,
  600
);

graphHubSelectionControl.on('change', function () {
  const selectedHubOption = d3.select(this);
  const selectedHubID = selectedHubOption.property('value');
  graphDataProvider.showSpecificHub(selectedHubID);
  forceGraph.refreshDisplayedGraph();
});

graphShowContributors.attr("checked", "checked");
graphShowContributors.on('click', (e: any) => {
  const checked = e.target.checked;
  graphDataProvider.showContributors(checked);
  forceGraph.refreshDisplayedGraph();
});

graphScaleToFit.on('click', (e: any) => {
  forceGraph.scaleToFit();
});

/// Lifecycle ///////////////////////
const lifecycleData = new LifecycleDataProvider();
const selectedLifecycle = lifecycleSelectionControl.property('value');
await lifecycleData.loadData(selectedLifecycle);
//lifecycleData.updateState('awaitingApproval');
const lifecycleViz = new LifecycleVisualization(
  lifecycleSvg,
  lifecycleData,
  800,
  600
);
lifecycleViz.displayLifecycle();

lifecycleSelectionControl.on('change', function () {
  const selectedLifecycle = d3.select(this).property('value');
  console.log(`switching to lifecycle: ${selectedLifecycle}`);
});
