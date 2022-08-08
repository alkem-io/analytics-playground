import { GraphDataProvider } from './GraphDataProvider';

export class GraphVizualizationControls {
  dataLoader: GraphDataProvider;

  constructor(dataLoader: GraphDataProvider) {
    this.dataLoader = dataLoader;
  }

  addHubSelectorOptions(container: any) {
    container
      .selectAll('option.hub-option')
      .data(this.dataLoader.getRawHubNodes())
      .join('option')
      .attr('id', (d: any) => d.id)
      .attr('class', 'hub-option' )
      .attr('value', (d: any) => d.id)
      .text((d: any) => d.displayName);
  }
}
