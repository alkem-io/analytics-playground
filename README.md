
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

The layout of this simple demonstration takes inspiration from https://github.com/danielstern/force-graph-example.

## Usage
There are three steps to running this demonstration:
* **Acquire**: Interact with the Alkemio graphql api to capture the raw data.
  * The queries that are used to acquire the data from Alkemio server are located under: `acquire/graphql`
  * Create a copy of the `.env.default` file, and save it as `.env`. Edit it to specify the credentials to use to connect.
  * Run the following scripts: `npm run acquire-spaces` and `npm run acquire-contributors`.
  * These scripts will save their output into the following folder: `transform/src/acquired-data`
* **Transform**: Transform the raw data, combining if needed other data, to create the graph data suitable for usage in D3 display
  * Move to the `transform` folder: `cd transform`
  * Run the script to convert the data using `npm run transform-data`
  * This script places the resulting graph data in the following file: `display/public/data/transformed-data.json`
* **Display**: View the results
  * Move to the `display` folder: `cd display`
  * Launch the web dev server using `npm start`, a browser will open to `(http://localhost:8080/)[http://localhost:8080]` + display the visualization

The connectivity graph is meant to provide a way of navigating the connectivity within the Spaces and Challenges hosted on Alkemio.

## Connectivity Graph
A sample image generated using this approach is shown below:
<p align="center">
  <img src="./docs/images/vizualization.png" width="400" alt="Visual example" /></a>
</p>




