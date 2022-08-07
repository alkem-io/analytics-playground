import * as d3 from 'd3';
import { GraphDataProvider } from './GraphDataProvider';
import { Hovercard } from './components/Hovercard';
import { Selection } from 'd3';

export class GraphVizualizationControls {
  dataLoader: GraphDataProvider;
  container: Selection<any, any, any, any>;

  constructor(
    container: any,
    dataLoader: GraphDataProvider,
  ) {
    this.dataLoader = dataLoader;
    this.container = container;

    // Add in a Hub selection for each Hub in the data set
    this.container
      .selectAll('option.hub-option')
      .data(this.dataLoader.getRawHubNodes())
      .join('option')
      .attr('id', (d: any) => d.id)
      .attr('class', 'hub-option')
      .attr('value', (d: any) => d.id)
      .text((d: any) => d.displayName);
    }

    logInfo() {
      //console.log('Graph controls added');
    }


  }
