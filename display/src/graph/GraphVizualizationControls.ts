import { GraphDataProvider } from './GraphDataProvider';

export class GraphVizualizationControls {
  dataLoader: GraphDataProvider;

  constructor(dataLoader: GraphDataProvider) {
    this.dataLoader = dataLoader;
  }

  addSpaceSelectorOptions(container: any) {
    container
      .selectAll('option.space-option')
      .data(this.dataLoader.getRawSpaceNodes())
      .join('option')
      .attr('id', (d: any) => d.id)
      .attr('class', 'space-option' )
      .attr('value', (d: any) => d.id)
      .text((d: any) => d.displayName);
  }
}
