
<p align="center">
  <a href="http://alkemio.foundation/" target="blank"><img src="https://alkemio.foundation/uploads/logos/alkemio-logo.svg" width="400" alt="Alkemio Logo" /></a>
</p>
<p align="center"><i><b>Open Innovation Platform.</b></i></p>
<p align="center"><i>Enabling society to collaborate. Building a better future, together.</i></p>

<p></p>

# Analytics Playground
Alkemio has a structured domain model with a growing set of data representing users and organizations working together on topics they care about: Challenges!

This repository is for exploring ways for extracting value from this data. This can be via aggregation, usage in reports or by visualizing the information.

The implementation in this repository is a such that the vizualization can be created / extended separate from the Alkemio server / client - to allow for rapid experimentation.

## Usage
There are three steps to running this demonstration:
* **Capture**: Interact with the Alkemio graphql api to capture the data.
  * Run each of the queries under `capture/graphql` and save the results from each as the data for the exported file with the same name under `generate/src/data`
* **Generate**: Create the graph data suitable for usage in D3 display from the raw Alkemio json data
  * Run the script to convert the data using `npm run generate-graph-data`
  * This script places the resulting graph data in the following file: `display/data/data.json`
* **Display**: View the results
  * Launch the http server using `npm start`
  * Open up a browser and navigate to `http://127.0.0.1:8080/display/index.html`

The connectivity graph is meant to provide a way of navigating the connectivity within the Hubs and Challenges hosted on Alkemio.

## Connectivity Graph
A sample image generated using this approach is shown below:
<p align="center">
  <img src="./docs/images/vizualization.png" width="400" alt="Visual example" /></a>
</p>




